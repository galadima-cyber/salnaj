import prisma       from '../config/database'
import { redisClient, CacheKeys } from '../config/redis'
import { logger }   from '../config/logger'
import { AppError } from '../middlewares/error.middleware'
import { env }      from '../config/env'

export const walletService = {

  /**
   * Get wallet balance for a user.
   * Checks Redis cache first, falls back to DB.
   */
  async getBalance(userId: string) {
    const cached = await redisClient.getJSON<{
      main: number; bonus: number; cashback: number
    }>(CacheKeys.walletBalance(userId))

    if (cached) return cached

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new AppError('Wallet not found', 404)

    const balances = {
      main:     Number(wallet.mainBalance),
      bonus:    Number(wallet.bonusBalance),
      cashback: Number(wallet.cashbackBalance),
      total:    Number(wallet.mainBalance) + Number(wallet.bonusBalance),
    }
    await redisClient.setJSON(CacheKeys.walletBalance(userId), balances, 60)
    return balances
  },

  /**
   * Credit wallet — runs inside a DB transaction.
   * Invalidates Redis cache after update.
   */
  async credit(params: {
    userId:    string
    amount:    number
    type?:     'main' | 'bonus' | 'cashback'
    prismaCtx?: typeof prisma  // pass transaction context if within a larger tx
  }) {
    const { userId, amount, type = 'main', prismaCtx = prisma } = params

    if (amount <= 0) throw new AppError('Credit amount must be positive')

    const updateField =
      type === 'bonus'    ? { bonusBalance:    { increment: amount } } :
      type === 'cashback' ? { cashbackBalance: { increment: amount } } :
                            { mainBalance:     { increment: amount },
                              totalFunded:     { increment: amount } }

    const wallet = await prismaCtx.wallet.update({
      where: { userId },
      data:  updateField,
    })

    await redisClient.del(CacheKeys.walletBalance(userId))
    logger.info('Wallet credited', { userId, amount, type })
    return wallet
  },

  /**
   * Debit wallet — atomic check-and-debit.
   * Throws AppError if insufficient balance.
   */
  async debit(params: {
    userId:    string
    amount:    number
    prismaCtx?: typeof prisma
  }) {
    const { userId, amount, prismaCtx = prisma } = params

    if (amount <= 0) throw new AppError('Debit amount must be positive')

    const wallet = await prismaCtx.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new AppError('Wallet not found', 404)

    const available = Number(wallet.mainBalance) + Number(wallet.bonusBalance)
    if (available < amount) {
      throw new AppError(
        `Insufficient balance. You have ${available.toLocaleString('en-NG', {
          style: 'currency', currency: 'NGN'
        })} but need ₦${amount.toLocaleString()}`
      )
    }

    // Deduct from bonus first, then main
    let remaining = amount
    const bonusUsed = Math.min(Number(wallet.bonusBalance), remaining)
    remaining -= bonusUsed
    const mainUsed = remaining

    const updated = await prismaCtx.wallet.update({
      where: { userId },
      data: {
        bonusBalance: { decrement: bonusUsed },
        mainBalance:  { decrement: mainUsed  },
        totalSpent:   { increment: amount    },
      },
    })

    await redisClient.del(CacheKeys.walletBalance(userId))
    logger.info('Wallet debited', { userId, amount })
    return updated
  },

  /**
   * Full purchase flow — debit wallet, call provider, handle result.
   * All within a single DB transaction to prevent inconsistency.
   */
  async executeTransaction<T>(params: {
    userId:      string
    amount:      number
    reference:   string
    txData:      Record<string, unknown>   // prisma transaction create data
    providerFn:  () => Promise<T>          // VTPass API call
    onSuccess:   (result: T, tx: typeof prisma) => Promise<Record<string, unknown>>
    onFail?:     (result: T, tx: typeof prisma) => Promise<void>
  }) {
    const { userId, amount, reference, txData, providerFn, onSuccess, onFail } = params

    return await prisma.$transaction(async (tx) => {
      // 1. Debit wallet inside transaction
      await walletService.debit({ userId, amount, prismaCtx: tx as typeof prisma })

      // 2. Create transaction record as PENDING
      await tx.transaction.create({
        data: {
          userId,
          amount:    amount,
          reference,
          status:    'PENDING',
          ...txData,
        } as any,
      })

      // 3. Call provider
      let providerResult: T
      try {
        providerResult = await providerFn()
      } catch (err) {
        // Provider threw — reverse wallet, mark FAILED
        await walletService.credit({ userId, amount, type: 'main', prismaCtx: tx as typeof prisma })
        await tx.transaction.update({
          where:  { reference },
          data:   { status: 'FAILED', failureReason: (err as Error).message },
        })
        throw err
      }

      // 4. Update based on success/failure
      const updateData = await onSuccess(providerResult, tx as typeof prisma)

      return await tx.transaction.update({
        where: { reference },
        data:  updateData as any,
      })
    })
  },

  /**
   * Check if user has exceeded daily transaction limit
   */
  async checkDailyLimit(userId: string, amount: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { kycStatus: true },
    })

    const limit =
      user?.kycStatus === 'UNVERIFIED'
        ? env.DAILY_LIMIT_UNVERIFIED
        : env.DAILY_LIMIT_VERIFIED

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { _sum } = await prisma.transaction.aggregate({
      where: {
        userId,
        status:    'SUCCESS',
        createdAt: { gte: startOfDay },
        type:      { not: 'WALLET_FUND' },
      },
      _sum: { amount: true },
    })

    const todayTotal = Number(_sum.amount || 0)
    if (todayTotal + amount > limit) {
      throw new AppError(
        `Daily transaction limit of ₦${limit.toLocaleString()} reached. ` +
        `Complete KYC to increase your limit.`
      )
    }
  },

  /**
   * Create wallet for a new user
   */
  async createForUser(userId: string) {
    return prisma.wallet.create({ data: { userId } })
  },
}
