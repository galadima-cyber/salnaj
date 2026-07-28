import { Response }  from 'express'
import { Decimal }    from '@prisma/client/runtime/library'
import bcrypt         from 'bcryptjs'
import prisma         from '../config/database'
import { walletService  } from '../services/wallet.service'
import { vtpassService  } from '../services/vtpass.service'
import { emailService   } from '../services/email.service'
import { smsService     } from '../services/sms.service'
import * as R             from '../utils/response'
import { generateRef, formatNaira, normalizePhone } from '../utils'
import { AuthRequest }    from '../types'

// ─── Helper: verify PIN ───────────────────────────────────────

async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { pinHash: true },
  })
  if (!user?.pinHash) return false
  return bcrypt.compare(pin, user.pinHash)
}

// ─── GET /api/data/plans/:network ────────────────────────────

export async function getDataPlans(req: any, res: Response): Promise<void> {
  const { network } = req.params
  const plans = await vtpassService.getDataPlans(network.toUpperCase())

  // Also return from our DB (with our pricing)
  const localPlans = await prisma.dataPlan.findMany({
    where:   { network: network.toUpperCase() as 'MTN', isActive: true },
    orderBy: [{ category: 'asc' }, { price: 'asc' }],
  })

  R.ok(res, 'Data plans fetched', { plans: localPlans, vtpassPlans: plans })
}

// ─── GET /api/data/smart-buy ──────────────────────────────────

export async function smartBuy(req: any, res: Response): Promise<void> {
  const budget = parseFloat(req.query.budget as string)
  if (!budget || budget < 100) { R.badRequest(res, 'Budget must be at least ₦100'); return }

  const plans = await prisma.dataPlan.findMany({
    where:   { isActive: true, price: { lte: new Decimal(budget) } },
    orderBy: [{ sizeGb: 'desc' }],
  })

  // Score: (sizeGb / price) * validityDays^0.3 — rewards data volume + some validity
  const scored = plans.map(p => ({
    ...p,
    price:      Number(p.price),
    valueScore: (p.sizeGb / Number(p.price)) * Math.pow(p.validityDays, 0.3),
  }))

  scored.sort((a, b) => b.valueScore - a.valueScore)

  const top5 = scored.slice(0, 5).map((p, i) => ({
    rank:         i + 1,
    planId:       p.id,
    network:      p.network,
    planName:     p.name,
    sizeLabel:    p.sizeLabel,
    price:        p.price,
    validityDays: p.validityDays,
    providerCode: p.providerCode,
    valueScore:   Math.round(p.valueScore * 100) / 100,
    badge:
      i === 0 ? 'Best Value 🏆' :
      i === 1 ? 'Runner-up 🥈' :
      p.validityDays === Math.max(...top5Validity(scored)) ? 'Longest Validity 📅' :
      undefined,
  }))

  const insight = top5[0]
    ? `${top5[0].network} gives you ${top5[0].sizeLabel} for ₦${budget.toLocaleString()} — best deal right now.`
    : 'No plans found for this budget.'

  R.ok(res, 'Smart Buy results', { budget, results: top5, insight })
}

function top5Validity(plans: Array<{ validityDays: number }>) {
  return plans.slice(0, 5).map(p => p.validityDays)
}

// ─── POST /api/data/purchase ──────────────────────────────────

export async function purchaseData(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { planId, phone, pin } = req.body

  if (!(await verifyPin(userId, pin))) { R.unauthorized(res, 'Incorrect PIN'); return }

  const plan = await prisma.dataPlan.findUnique({ where: { id: planId } })
  if (!plan || !plan.isActive) { R.notFound(res, 'Data plan not found or unavailable'); return }

  const amount    = Number(plan.price)
  const normPhone = normalizePhone(phone)
  const reference = generateRef('SNJ-DATA')

  await walletService.checkDailyLimit(userId, amount)

  const tx = await walletService.executeTransaction({
    userId,
    amount,
    reference,
    txData: {
      type:     'DATA',
      network:  plan.network,
      phone:    normPhone,
      planId:   plan.id,
      planName: plan.name,
    },
    providerFn: () =>
      vtpassService.purchaseData({
        requestId:     reference,
        network:       plan.network,
        phone:         normPhone,
        variationCode: plan.providerCode,
        amount,
      }),
    onSuccess: async (result, _tx) => ({
      status:      result.status === 'delivered' ? 'SUCCESS' : 'FAILED',
      providerRef: result.providerRef,
      completedAt: new Date(),
      failureReason: result.status !== 'delivered' ? 'Provider could not deliver data' : undefined,
    }),
  })

  if (tx.status === 'SUCCESS') {
    // Send notifications (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true, phone: true } })
    if (user) {
      emailService.sendTransactionReceipt(user.email, user.fullName, {
        type: `${plan.name} Data`, amount: formatNaira(amount),
        reference, phone: normPhone, status: 'SUCCESS',
      }).catch(() => {})
      smsService.sendTransactionAlert(user.phone, {
        type: `${plan.name} Data`, amount: formatNaira(amount), reference,
      }).catch(() => {})
    }
    R.ok(res, `${plan.name} data delivered to ${normPhone}`, { reference, status: 'SUCCESS' })
  } else {
    R.ok(res, 'Transaction failed. Your wallet has been refunded.', { reference, status: 'FAILED' })
  }
}

// ─── POST /api/airtime/purchase ───────────────────────────────

export async function purchaseAirtime(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { network, phone, amount, pin } = req.body

  if (!(await verifyPin(userId, pin))) { R.unauthorized(res, 'Incorrect PIN'); return }
  await walletService.checkDailyLimit(userId, amount)

  const normPhone = normalizePhone(phone)
  const reference = generateRef('SNJ-AIR')

  const tx = await walletService.executeTransaction({
    userId, amount, reference,
    txData: { type: 'AIRTIME', network: network.toUpperCase(), phone: normPhone },
    providerFn: () => vtpassService.purchaseAirtime({
      requestId: reference, network, phone: normPhone, amount,
    }),
    onSuccess: async (result) => ({
      status:      result.status === 'delivered' ? 'SUCCESS' : 'FAILED',
      providerRef: result.providerRef,
      completedAt: new Date(),
    }),
  })

  R.ok(res, tx.status === 'SUCCESS'
    ? `₦${amount} ${network} airtime sent to ${normPhone}`
    : 'Transaction failed. Your wallet has been refunded.',
  { reference, status: tx.status })
}

// ─── POST /api/electricity/verify ────────────────────────────

export async function verifyMeter(req: any, res: Response): Promise<void> {
  const { meterNumber, disco, meterType } = req.body

  const result = await vtpassService.verifyMeter(meterNumber, disco, meterType)
  R.ok(res, 'Meter verified', result)
}

// ─── POST /api/electricity/purchase ──────────────────────────

export async function purchaseElectricity(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { disco, meterNumber, meterType, amount, phone, pin } = req.body

  if (!(await verifyPin(userId, pin))) { R.unauthorized(res, 'Incorrect PIN'); return }
  if (amount < 500) { R.badRequest(res, 'Minimum electricity purchase is ₦500'); return }

  await walletService.checkDailyLimit(userId, amount)
  const reference = generateRef('SNJ-ELEC')

  const tx = await walletService.executeTransaction({
    userId, amount, reference,
    txData: { type: 'ELECTRICITY', phone: normalizePhone(phone), meterNumber },
    providerFn: () => vtpassService.purchaseElectricity({
      requestId: reference, disco, meterNumber,
      meterType, amount, phone: normalizePhone(phone),
    }),
    onSuccess: async (result) => ({
      status:        result.status === 'delivered' ? 'SUCCESS' : 'FAILED',
      providerRef:   result.providerRef,
      providerToken: result.token,
      completedAt:   new Date(),
    }),
  })

  R.ok(res,
    tx.status === 'SUCCESS' ? 'Electricity token purchased' : 'Transaction failed. Wallet refunded.',
    { reference, status: tx.status, token: tx.providerToken }
  )
}

// ─── POST /api/cable/verify ───────────────────────────────────

export async function verifyDecoder(req: any, res: Response): Promise<void> {
  const { decoderNumber, provider } = req.body
  const result = await vtpassService.verifyDecoder(decoderNumber, provider)
  R.ok(res, 'Decoder verified', result)
}

// ─── POST /api/cable/purchase ─────────────────────────────────

export async function purchaseCableTv(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { provider, decoderNumber, variationCode, amount, phone, pin } = req.body

  if (!(await verifyPin(userId, pin))) { R.unauthorized(res, 'Incorrect PIN'); return }
  await walletService.checkDailyLimit(userId, amount)

  const reference = generateRef('SNJ-CABLE')

  const tx = await walletService.executeTransaction({
    userId, amount, reference,
    txData: { type: 'CABLE_TV', decoderNumber, phone: normalizePhone(phone) },
    providerFn: () => vtpassService.purchaseCableTv({
      requestId: reference, provider, decoderNumber,
      variationCode, amount, phone: normalizePhone(phone),
    }),
    onSuccess: async (result) => ({
      status:      result.status === 'delivered' ? 'SUCCESS' : 'FAILED',
      providerRef: result.providerRef,
      completedAt: new Date(),
    }),
  })

  R.ok(res,
    tx.status === 'SUCCESS' ? 'Cable TV subscription renewed' : 'Transaction failed. Wallet refunded.',
    { reference, status: tx.status }
  )
}

// ─── POST /api/education/purchase ────────────────────────────

export async function purchaseEducation(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { serviceId, variationCode, amount, phone, quantity = 1, pin } = req.body

  if (!(await verifyPin(userId, pin))) { R.unauthorized(res, 'Incorrect PIN'); return }

  const totalAmount = amount * quantity
  await walletService.checkDailyLimit(userId, totalAmount)

  const reference = generateRef('SNJ-EDU')

  const tx = await walletService.executeTransaction({
    userId, amount: totalAmount, reference,
    txData: { type: 'EDUCATION', phone: normalizePhone(phone) },
    providerFn: () => vtpassService.purchaseEducation({
      requestId: reference, serviceId, variationCode,
      amount: totalAmount, phone: normalizePhone(phone), quantity,
    }),
    onSuccess: async (result) => ({
      status:        result.status === 'delivered' ? 'SUCCESS' : 'FAILED',
      providerRef:   result.providerRef,
      providerToken: result.pins?.join(', '),
      completedAt:   new Date(),
    }),
  })

  R.ok(res,
    tx.status === 'SUCCESS' ? 'Education PIN(s) purchased' : 'Transaction failed. Wallet refunded.',
    { reference, status: tx.status, pins: tx.providerToken?.split(', ') }
  )
}

// ─── POST /api/betting/verify ─────────────────────────────────

export async function verifyBettingUser(req: any, res: Response): Promise<void> {
  const { userId: bettingId, serviceId } = req.body
  const result = await vtpassService.verifyBettingUser(bettingId, serviceId)
  R.ok(res, 'Betting user verified', result)
}

// ─── POST /api/betting/fund ───────────────────────────────────

export async function fundBettingWallet(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { serviceId, bettingId, amount, phone, pin } = req.body

  if (!(await verifyPin(userId, pin))) { R.unauthorized(res, 'Incorrect PIN'); return }
  await walletService.checkDailyLimit(userId, amount)

  const reference = generateRef('SNJ-BET')

  const tx = await walletService.executeTransaction({
    userId, amount, reference,
    txData: { type: 'BETTING', phone: normalizePhone(phone) },
    providerFn: () => vtpassService.fundBettingWallet({
      requestId: reference, serviceId, bettingId,
      amount, phone: normalizePhone(phone),
    }),
    onSuccess: async (result) => ({
      status:      result.status === 'delivered' ? 'SUCCESS' : 'FAILED',
      providerRef: result.providerRef,
      completedAt: new Date(),
    }),
  })

  R.ok(res,
    tx.status === 'SUCCESS' ? 'Betting wallet funded' : 'Transaction failed. Wallet refunded.',
    { reference, status: tx.status }
  )
}

// ─── GET /api/transactions ────────────────────────────────────

export async function getTransactions(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const page   = Math.max(1, parseInt(req.query.page  as string || '1'))
  const limit  = Math.min(50, parseInt(req.query.limit as string || '20'))
  const type   = req.query.type as string | undefined
  const status = req.query.status as string | undefined

  const where = {
    userId,
    ...(type   && { type: type as 'DATA' }),
    ...(status && { status: status as 'SUCCESS' }),
  }

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, type: true, network: true, phone: true,
        planName: true, amount: true, status: true,
        reference: true, providerToken: true,
        createdAt: true, completedAt: true, failureReason: true,
      },
    }),
    prisma.transaction.count({ where }),
  ])

  R.ok(res, 'Transactions fetched', transactions, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  })
}

// ─── GET /api/transactions/:id ────────────────────────────────

export async function getTransaction(req: any, res: Response): Promise<void> {
  const tx = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  })
  if (!tx) { R.notFound(res, 'Transaction not found'); return }
  R.ok(res, 'Transaction details', tx)
}
