import { Request, Response } from 'express'
import { Decimal }  from '@prisma/client/runtime/library'
import prisma        from '../config/database'
import { paystackService } from '../services/paystack.service'
import { walletService   } from '../services/wallet.service'
import { emailService    } from '../services/email.service'
import * as R              from '../utils/response'
import { generateRef, formatNaira } from '../utils'
import { AuthRequest } from '../types'
import { env }         from '../config/env'
import { logger }      from '../config/logger'

// ─── GET /api/wallet/balance ──────────────────────────────────

export async function getBalance(req: any, res: Response): Promise<void> {
  const balances = await walletService.getBalance(req.user!.userId)
  R.ok(res, 'Wallet balance', balances)
}

// ─── POST /api/wallet/fund/initiate ──────────────────────────

export async function initiateFunding(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { amount } = req.body

  if (amount < env.REFERRAL_SIGNUP_BONUS) {
    R.badRequest(res, `Minimum wallet funding is ₦${env.REFERRAL_SIGNUP_BONUS}`); return
  }

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { email: true, fullName: true },
  })
  if (!user) { R.notFound(res, 'User not found'); return }

  // Check max wallet balance
  const balances = await walletService.getBalance(userId)
  if (balances.main + amount > env.MAX_WALLET_BALANCE) {
    R.badRequest(res, `Adding this amount would exceed the maximum wallet balance of ₦${env.MAX_WALLET_BALANCE.toLocaleString()}`); return
  }

  const reference = generateRef('SNJ-FUND')

  // Record funding intent
  await prisma.walletFunding.create({
    data: { userId, amount: new Decimal(amount), paystackRef: reference, paystackStatus: 'pending' },
  })

  const { authorizationUrl, accessCode } = await paystackService.initializePayment({
    email:    user.email,
    amount,
    reference,
    metadata: { userId, fullName: user.fullName },
  })

  R.ok(res, 'Payment initialized', { authorizationUrl, accessCode, reference, amount })
}

// ─── POST /api/webhooks/paystack ─────────────────────────────
// IMPORTANT: This must receive raw body — configure in server.ts

export async function paystackWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['x-paystack-signature'] as string
  const rawBody   = req.body

  // 1. Always respond 200 immediately (Paystack requirement)
  res.status(200).json({ received: true })

  // 2. Verify signature
  if (!paystackService.verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Paystack webhook signature mismatch')
    return
  }

  const event = typeof rawBody === 'string'
    ? JSON.parse(rawBody)
    : Buffer.isBuffer(rawBody)
    ? JSON.parse(rawBody.toString('utf-8'))
    : rawBody

  if (event.event !== 'charge.success') return

  const { reference, amount: koboAmount, status } = event.data
  if (status !== 'success') return

  // 3. Idempotency — check if already processed
  const funding = await prisma.walletFunding.findUnique({
    where:  { paystackRef: reference },
    select: { id: true, userId: true, isProcessed: true, amount: true },
  })

  if (!funding) {
    logger.warn('Paystack webhook: funding record not found', { reference })
    return
  }

  if (funding.isProcessed) {
    logger.info('Paystack webhook: already processed', { reference })
    return
  }

  const amountNaira = koboAmount / 100

  try {
    // 4. Credit wallet + mark processed — all in one DB transaction
    await prisma.$transaction(async (tx) => {
      await walletService.credit({
        userId:    funding.userId,
        amount:    amountNaira,
        prismaCtx: tx as typeof prisma,
      })

      await tx.walletFunding.update({
        where: { paystackRef: reference },
        data: {
          paystackStatus: 'success',
          isProcessed:    true,
          processedAt:    new Date(),
          fee:            new Decimal((amountNaira * 0.015) > 2000 ? 2000 : amountNaira * 0.015),
        },
      })

      await tx.transaction.create({
        data: {
          userId:     funding.userId,
          type:       'WALLET_FUND',
          amount:     new Decimal(amountNaira),
          status:     'SUCCESS',
          reference,
          paystackRef: reference,
          completedAt: new Date(),
        },
      })
    })

    // 5. Referral bonus — first wallet funding
    await processReferralBonus(funding.userId, amountNaira)

    // 6. Send email receipt (non-blocking)
    const user = await prisma.user.findUnique({
      where:  { id: funding.userId },
      select: { email: true, fullName: true },
    })
    if (user) {
      emailService.sendTransactionReceipt(user.email, user.fullName, {
        type: 'Wallet Funding', amount: formatNaira(amountNaira),
        reference, status: 'SUCCESS',
      }).catch(() => {})
    }

    logger.info('Wallet funded via Paystack webhook', { userId: funding.userId, amountNaira })
  } catch (err) {
    logger.error('Paystack webhook processing failed', { reference, err: (err as Error).message })
  }
}

// ─── GET /api/wallet/history ──────────────────────────────────

export async function getWalletHistory(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const page   = Math.max(1, parseInt(req.query.page as string || '1'))
  const limit  = Math.min(50, parseInt(req.query.limit as string || '20'))

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, type: true, amount: true, status: true,
        reference: true, createdAt: true, network: true, planName: true,
      },
    }),
    prisma.transaction.count({ where: { userId } }),
  ])

  R.ok(res, 'Wallet history', transactions, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  })
}

// ─── Referral bonus helper ────────────────────────────────────

async function processReferralBonus(userId: string, fundingAmount: number): Promise<void> {
  if (fundingAmount < env.REFERRAL_MIN_FUNDING_FOR_BONUS) return

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { referredById: true },
  })
  if (!user?.referredById) return

  // Only award once
  const alreadyPaid = await prisma.referralEarning.findFirst({
    where: { refereeId: userId, type: 'SIGNUP_BONUS' },
  })
  if (alreadyPaid) return

  await prisma.$transaction(async (tx) => {
    // Referee gets signup bonus
    await walletService.credit({
      userId:    userId,
      amount:    env.REFERRAL_SIGNUP_BONUS,
      type:      'bonus',
      prismaCtx: tx as typeof prisma,
    })

    // Referrer gets transaction bonus
    await walletService.credit({
      userId:    user.referredById!,
      amount:    env.REFERRAL_TRANSACTION_BONUS,
      type:      'bonus',
      prismaCtx: tx as typeof prisma,
    })

    await tx.referralEarning.createMany({
      data: [
        {
          referrerId: user.referredById!,
          refereeId:  userId,
          amount:     new Decimal(env.REFERRAL_TRANSACTION_BONUS),
          type:       'SIGNUP_BONUS',
          isPaid:     true,
          paidAt:     new Date(),
        },
        {
          referrerId: user.referredById!,
          refereeId:  userId,
          amount:     new Decimal(env.REFERRAL_SIGNUP_BONUS),
          type:       'SIGNUP_BONUS',
          isPaid:     true,
          paidAt:     new Date(),
        },
      ],
    })
  })

  logger.info('Referral bonus processed', { refereeId: userId, referrerId: user.referredById })
}

// ─── POST /api/wallet/fund/verify ─────────────────────────────

export async function verifyFunding(req: any, res: Response): Promise<void> {
  const { reference } = req.body
  if (!reference) { R.badRequest(res, 'Payment reference is required'); return }

  const funding = await prisma.walletFunding.findUnique({
    where:  { paystackRef: reference },
    select: { id: true, userId: true, isProcessed: true, amount: true },
  })

  if (!funding) {
    R.notFound(res, 'Funding record not found')
    return
  }

  if (funding.isProcessed) {
    const balances = await walletService.getBalance(funding.userId)
    R.ok(res, 'Wallet already credited', { status: 'success', balance: balances.main })
    return
  }

  // Verify from Paystack directly
  try {
    const verification = await paystackService.verifyPayment(reference)
    if (verification.status !== 'success') {
      R.badRequest(res, `Payment verification status: ${verification.status}`)
      return
    }

    const amountNaira = verification.amount

    await prisma.$transaction(async (tx) => {
      await walletService.credit({
        userId:    funding.userId,
        amount:    amountNaira,
        prismaCtx: tx as typeof prisma,
      })

      await tx.walletFunding.update({
        where: { paystackRef: reference },
        data: {
          paystackStatus: 'success',
          isProcessed:    true,
          processedAt:    new Date(),
          fee:            new Decimal((amountNaira * 0.015) > 2000 ? 2000 : amountNaira * 0.015),
        },
      })

      await tx.transaction.create({
        data: {
          userId:     funding.userId,
          type:       'WALLET_FUND',
          amount:     new Decimal(amountNaira),
          status:     'SUCCESS',
          reference,
          paystackRef: reference,
          completedAt: new Date(),
        },
      })
    })

    // Referral bonus check (fire and forget)
    processReferralBonus(funding.userId, amountNaira).catch(() => {})

    const balances = await walletService.getBalance(funding.userId)
    R.ok(res, 'Wallet credited successfully', { status: 'success', balance: balances.main })
  } catch (err: unknown) {
    logger.error('Paystack verification error', { reference, err: (err as Error).message })
    R.serverError(res, 'Failed to verify payment with Paystack')
  }
}

