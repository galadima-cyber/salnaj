import { Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import { generateRef, normalizePhone } from '../utils'
import * as R from '../utils/response'
import { createNotification } from './notification.controller'
import { walletService } from '../services/wallet.service'
import { redisClient, CacheKeys } from '../config/redis'

const CONVERSION_RATES: Record<string, { rate: number; merchantPhone: string; ussdPattern: string }> = {
  MTN: {
    rate: 80, // 80% payout to user
    merchantPhone: '08149652233',
    ussdPattern: '*321*1*{merchantPhone}*{amount}*{pin}#',
  },
  AIRTEL: {
    rate: 75,
    merchantPhone: '09023456789',
    ussdPattern: '*432*1*{merchantPhone}*{amount}*PIN#',
  },
  GLO: {
    rate: 70,
    merchantPhone: '08051234567',
    ussdPattern: '*131*{merchantPhone}*{amount}*PIN#',
  },
  ETISALAT: {
    rate: 70,
    merchantPhone: '08091234567',
    ussdPattern: '*223*PIN*{amount}*{merchantPhone}#',
  },
}

const MIN_AMOUNT = 1000
const MAX_AMOUNT = 50000

/**
 * GET /api/airtime-to-cash/rates
 */
export async function getRates(_req: any, res: Response): Promise<void> {
  R.ok(res, 'Airtime to cash rates', {
    rates: CONVERSION_RATES,
    minAmount: MIN_AMOUNT,
    maxAmount: MAX_AMOUNT,
  })
}

/**
 * POST /api/airtime-to-cash/submit
 */
export async function submitConversion(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { network, phoneNumber, airtimeAmount, pin } = req.body

  const netKey = (network || '').toUpperCase()
  const config = CONVERSION_RATES[netKey]
  if (!config) {
    R.badRequest(res, 'Supported networks are MTN, AIRTEL, GLO, and ETISALAT')
    return
  }

  const amount = Number(airtimeAmount)
  if (!amount || isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    R.badRequest(res, `Airtime amount must be between ₦${MIN_AMOUNT.toLocaleString()} and ₦${MAX_AMOUNT.toLocaleString()}`)
    return
  }

  if (!phoneNumber || phoneNumber.trim().length < 10) {
    R.badRequest(res, 'Please provide the valid phone number sending the airtime')
    return
  }

  if (!pin) {
    R.badRequest(res, 'Transaction PIN is required')
    return
  }

  // Verify PIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, pinHash: true },
  })

  if (!user || !user.pinHash) {
    R.badRequest(res, 'Please set your 4-digit transaction PIN in Settings before proceeding')
    return
  }

  const pinMatches = await bcrypt.compare(pin, user.pinHash)
  if (!pinMatches) {
    R.badRequest(res, 'Incorrect transaction PIN. Please check your PIN and try again.')
    return
  }

  const cashPayout = (amount * config.rate) / 100
  const reference = generateRef('A2C')
  const sendingPhone = normalizePhone(phoneNumber)

  const ussdCode = config.ussdPattern
    .replace('{merchantPhone}', config.merchantPhone)
    .replace('{amount}', String(amount))

  // Create request and transaction
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.airtimeToCashRequest.create({
      data: {
        userId,
        network: netKey as any,
        phoneNumber: sendingPhone,
        airtimeAmount: amount,
        cashAmount: cashPayout,
        ratePercent: config.rate,
        merchantPhone: config.merchantPhone,
        reference,
        status: 'PENDING',
      },
    })

    await tx.transaction.create({
      data: {
        userId,
        type: 'AIRTIME_TO_CASH',
        amount: cashPayout,
        status: 'PENDING',
        reference,
        phone: sendingPhone,
        metadata: {
          network: netKey,
          airtimeAmount: amount,
          ratePercent: config.rate,
          merchantPhone: config.merchantPhone,
          ussdCode,
        },
      },
    })

    return request
  })

  // Create notification
  createNotification({
    userId,
    title: 'Airtime to Cash Submitted',
    message: `Your conversion of ₦${amount.toLocaleString()} ${netKey} airtime for ₦${cashPayout.toLocaleString()} cash is pending airtime transfer.`,
    type: 'TRANSACTION',
    actionUrl: '/airtime-cash',
  })

  R.created(res, 'Airtime to Cash request submitted. Transfer the airtime using the USSD code provided.', {
    reference,
    network: netKey,
    airtimeAmount: amount,
    cashPayout,
    ratePercent: config.rate,
    merchantPhone: config.merchantPhone,
    ussdCode,
    instructions: `Dial ${ussdCode} on your ${netKey} line (${sendingPhone}) to transfer ₦${amount.toLocaleString()} airtime to ${config.merchantPhone}. Your wallet will be credited with ₦${cashPayout.toLocaleString()} as soon as transfer is verified.`,
  })
}

/**
 * GET /api/airtime-to-cash/history
 */
export async function getConversionHistory(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 15))
  const skip = (page - 1) * limit

  const [requests, total] = await Promise.all([
    prisma.airtimeToCashRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.airtimeToCashRequest.count({ where: { userId } }),
  ])

  R.ok(res, 'Airtime to cash requests', {
    items: requests,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

/**
 * POST /api/airtime-to-cash/:id/confirm-transfer
 * Called by user after dialing the USSD code to signal transfer completed.
 * In development or demo mode, it immediately credits the cash payout!
 */
export async function confirmTransfer(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { id } = req.params

  const request = await prisma.airtimeToCashRequest.findFirst({
    where: { id, userId },
  })

  if (!request) {
    R.notFound(res, 'Conversion request not found')
    return
  }

  if (request.status === 'SUCCESS') {
    R.badRequest(res, 'This request has already been verified and credited')
    return
  }

  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    // In dev / sandbox, simulate instant automated SIM verification & wallet credit
    await prisma.$transaction(async (tx) => {
      await tx.airtimeToCashRequest.update({
        where: { id },
        data: { status: 'SUCCESS' },
      })

      await tx.transaction.updateMany({
        where: { reference: request.reference },
        data: { status: 'SUCCESS' },
      })

      await walletService.credit({
        userId,
        amount: Number(request.cashAmount),
        type: 'main',
        prismaCtx: tx as typeof prisma,
      })
    })

    await redisClient.del(CacheKeys.walletBalance(userId)).catch(() => {})

    createNotification({
      userId,
      title: 'Airtime to Cash Credited!',
      message: `₦${Number(request.cashAmount).toLocaleString()} has been credited to your main wallet balance.`,
      type: 'TRANSACTION',
      actionUrl: '/wallet',
    })

    R.ok(res, `Transfer verified! ₦${Number(request.cashAmount).toLocaleString()} has been credited to your wallet.`, {
      id: request.id,
      status: 'SUCCESS',
      cashAmount: Number(request.cashAmount),
    })
    return
  }

  // In production, update status to PROCESSING for verification
  await prisma.airtimeToCashRequest.update({
    where: { id },
    data: { status: 'PROCESSING' },
  })

  R.ok(res, 'Transfer received and currently being verified. Your wallet will be credited shortly.', {
    id: request.id,
    status: 'PROCESSING',
  })
}

/**
 * PATCH /api/airtime-to-cash/:id/complete (Admin / Automated System)
 */
export async function completeConversion(req: any, res: Response): Promise<void> {
  const { id } = req.params

  const request = await prisma.airtimeToCashRequest.findUnique({
    where: { id },
  })

  if (!request) {
    R.notFound(res, 'Conversion request not found')
    return
  }

  if (request.status === 'SUCCESS') {
    R.badRequest(res, 'This conversion is already marked as SUCCESS')
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.airtimeToCashRequest.update({
      where: { id },
      data: { status: 'SUCCESS' },
    })

    await tx.transaction.updateMany({
      where: { reference: request.reference },
      data: { status: 'SUCCESS' },
    })

    await walletService.credit({
      userId: request.userId,
      amount: Number(request.cashAmount),
      type: 'main',
      prismaCtx: tx as typeof prisma,
    })
  })

  await redisClient.del(CacheKeys.walletBalance(request.userId)).catch(() => {})

  createNotification({
    userId: request.userId,
    title: 'Airtime to Cash Credited!',
    message: `₦${Number(request.cashAmount).toLocaleString()} has been credited to your main wallet for reference ${request.reference}.`,
    type: 'TRANSACTION',
    actionUrl: '/wallet',
  })

  R.ok(res, 'Airtime to cash request approved and credited successfully')
}

/**
 * PATCH /api/airtime-to-cash/:id/reject
 */
export async function rejectConversion(req: any, res: Response): Promise<void> {
  const { id } = req.params
  const { reason = 'Airtime transfer was not received or invalid amount' } = req.body

  const request = await prisma.airtimeToCashRequest.findUnique({
    where: { id },
  })

  if (!request) {
    R.notFound(res, 'Conversion request not found')
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.airtimeToCashRequest.update({
      where: { id },
      data: { status: 'FAILED', adminNote: reason },
    })

    await tx.transaction.updateMany({
      where: { reference: request.reference },
      data: { status: 'FAILED' },
    })
  })

  createNotification({
    userId: request.userId,
    title: 'Airtime to Cash Declined',
    message: `Your conversion request (${request.reference}) was declined: ${reason}`,
    type: 'TRANSACTION',
    actionUrl: '/airtime-cash',
  })

  R.ok(res, 'Airtime to cash request rejected')
}
