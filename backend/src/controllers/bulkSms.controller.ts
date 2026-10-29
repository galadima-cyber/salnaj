import { Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import { smsService } from '../services/sms.service'
import { generateRef, normalizePhone } from '../utils'
import * as R from '../utils/response'
import { createNotification } from './notification.controller'

const COST_PER_SMS_PAGE = 4.0 // ₦4.00 per SMS unit/page
const MAX_SMS_LENGTH = 160

function cleanRecipients(rawList: string[] | string): string[] {
  let list: string[] = []
  if (Array.isArray(rawList)) {
    list = rawList
  } else if (typeof rawList === 'string') {
    list = rawList.split(/[\n,;\s]+/)
  }

  const cleaned = new Set<string>()
  for (const item of list) {
    const digits = item.trim().replace(/\D/g, '')
    if (digits.length >= 10 && digits.length <= 14) {
      cleaned.add(digits)
    }
  }
  return Array.from(cleaned)
}

/**
 * POST /api/bulk-sms/estimate
 */
export async function estimateCost(req: any, res: Response): Promise<void> {
  const { message, recipients } = req.body

  if (!message || typeof message !== 'string') {
    R.badRequest(res, 'Please provide message content')
    return
  }

  const cleaned = cleanRecipients(recipients || [])
  const charCount = message.length
  const pages = Math.ceil(charCount / MAX_SMS_LENGTH) || 1
  const recipientCount = cleaned.length
  const totalUnits = recipientCount * pages
  const totalCost = totalUnits * COST_PER_SMS_PAGE

  R.ok(res, 'Estimation calculated', {
    charCount,
    pages,
    recipientCount,
    costPerPage: COST_PER_SMS_PAGE,
    totalUnits,
    totalCost,
  })
}

/**
 * POST /api/bulk-sms/send
 */
export async function sendBulkSms(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { senderId, message, recipients, pin } = req.body

  // Validation
  if (!senderId || typeof senderId !== 'string' || senderId.trim().length === 0 || senderId.trim().length > 11) {
    R.badRequest(res, 'Sender ID must be 1 to 11 alphanumeric characters')
    return
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    R.badRequest(res, 'Message text cannot be empty')
    return
  }

  if (!pin) {
    R.badRequest(res, 'Transaction PIN is required')
    return
  }

  const cleanedNumbers = cleanRecipients(recipients)
  if (cleanedNumbers.length === 0) {
    R.badRequest(res, 'Please provide at least one valid recipient phone number')
    return
  }

  if (cleanedNumbers.length > 5000) {
    R.badRequest(res, 'Maximum 5,000 recipients per campaign')
    return
  }

  // Verify PIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, pinHash: true },
  })

  if (!user || !user.pinHash) {
    R.badRequest(res, 'Please set your 4-digit transaction PIN in Settings before sending SMS')
    return
  }

  const pinMatches = await bcrypt.compare(pin, user.pinHash)
  if (!pinMatches) {
    R.badRequest(res, 'Incorrect transaction PIN')
    return
  }

  // Calculate pricing
  const pages = Math.ceil(message.length / MAX_SMS_LENGTH) || 1
  const totalCost = cleanedNumbers.length * pages * COST_PER_SMS_PAGE
  const reference = generateRef('SMS')

  // Atomic debit & job creation
  let job: any
  let txRecord: any
  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, mainBalance: true },
      })

      if (!wallet || Number(wallet.mainBalance) < totalCost) {
        throw new Error('INSUFFICIENT_FUNDS')
      }

      // Debit wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          mainBalance: { decrement: totalCost },
          totalSpent:  { increment: totalCost },
        },
      })

      // Create transaction record
      const createdTx = await tx.transaction.create({
        data: {
          userId,
          type: 'BULK_SMS',
          amount: totalCost,
          status: 'PENDING',
          reference,
          metadata: {
            senderId: senderId.trim(),
            recipientsCount: cleanedNumbers.length,
            smsPages: pages,
            messagePreview: message.slice(0, 50),
          },
        },
      })

      // Create Bulk SMS Job
      const createdJob = await tx.bulkSmJob.create({
        data: {
          userId,
          senderId: senderId.trim(),
          message,
          recipients: cleanedNumbers,
          totalCount: cleanedNumbers.length,
          costPerSms: COST_PER_SMS_PAGE * pages,
          totalCost,
          status: 'PROCESSING',
        },
      })

      return { job: createdJob, tx: createdTx }
    })
    job = txResult.job
    txRecord = txResult.tx
  } catch (err: any) {
    if (err.message === 'INSUFFICIENT_FUNDS') {
      R.badRequest(res, `Insufficient wallet balance. You need ₦${totalCost.toLocaleString()} for this SMS campaign. Please fund your wallet.`)
      return
    }
    throw err
  }

  // Dispatch SMS in background
  smsService.sendBulk(cleanedNumbers, message, senderId.trim())
    .then(async (result) => {
      const isCompleteFail = result.failed === cleanedNumbers.length
      const isPartialFail = result.failed > 0 && result.sent > 0
      const refundAmount = result.failed * COST_PER_SMS_PAGE * pages

      if (isCompleteFail) {
        // Full refund to wallet
        await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { userId },
            data: {
              mainBalance: { increment: totalCost },
              totalSpent:  { decrement: totalCost },
            },
          })
          await tx.transaction.update({
            where: { id: txRecord.id },
            data: {
              status: 'FAILED',
              metadata: {
                ...(txRecord.metadata as any || {}),
                error: 'SMS dispatch failed. Full refund credited.',
                refunded: totalCost,
              },
            },
          })
          await tx.bulkSmJob.update({
            where: { id: job.id },
            data: {
              sentCount: 0,
              failedCount: result.failed,
              status: 'FAILED',
              completedAt: new Date(),
            },
          })
        })

        createNotification({
          userId,
          title: 'Bulk SMS Failed (Refunded)',
          message: `Campaign "${senderId.trim()}" could not be delivered. ₦${totalCost.toLocaleString()} has been fully refunded to your wallet.`,
          type: 'TRANSACTION',
          actionUrl: '/bulk-sms',
        })
      } else if (isPartialFail) {
        // Partial refund
        await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { userId },
            data: {
              mainBalance: { increment: refundAmount },
              totalSpent:  { decrement: refundAmount },
            },
          })
          await tx.transaction.update({
            where: { id: txRecord.id },
            data: {
              status: 'SUCCESS',
              metadata: {
                ...(txRecord.metadata as any || {}),
                partialRefund: refundAmount,
                delivered: result.sent,
                failed: result.failed,
              },
            },
          })
          await tx.bulkSmJob.update({
            where: { id: job.id },
            data: {
              sentCount: result.sent,
              failedCount: result.failed,
              status: 'DONE',
              completedAt: new Date(),
            },
          })
        })

        createNotification({
          userId,
          title: 'Bulk SMS Partial Delivery',
          message: `Campaign "${senderId.trim()}": ${result.sent} sent successfully. ₦${refundAmount.toLocaleString()} was refunded for ${result.failed} failed numbers.`,
          type: 'TRANSACTION',
          actionUrl: '/bulk-sms',
        })
      } else {
        // 100% success
        await prisma.$transaction(async (tx) => {
          await tx.transaction.update({
            where: { id: txRecord.id },
            data: { status: 'SUCCESS' },
          })
          await tx.bulkSmJob.update({
            where: { id: job.id },
            data: {
              sentCount: result.sent,
              failedCount: 0,
              status: 'DONE',
              completedAt: new Date(),
            },
          })
        })

        createNotification({
          userId,
          title: 'Bulk SMS Delivered',
          message: `Your campaign "${senderId.trim()}" sent ${result.sent} SMS successfully.`,
          type: 'TRANSACTION',
          actionUrl: '/bulk-sms',
        })
      }
    })
    .catch((err) => {
      console.error('Bulk SMS send background error:', err)
    })

  R.ok(res, 'Bulk SMS broadcast started successfully', {
    reference,
    jobId: job.id,
    recipientsCount: cleanedNumbers.length,
    pages,
    totalCost,
    senderId: senderId.trim(),
  })
}

/**
 * GET /api/bulk-sms/history
 */
export async function getBulkSmsHistory(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 15))
  const skip = (page - 1) * limit

  const [jobs, total] = await Promise.all([
    prisma.bulkSmJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        senderId: true,
        message: true,
        totalCount: true,
        sentCount: true,
        failedCount: true,
        totalCost: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.bulkSmJob.count({ where: { userId } }),
  ])

  R.ok(res, 'Bulk SMS campaigns retrieved', {
    items: jobs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
