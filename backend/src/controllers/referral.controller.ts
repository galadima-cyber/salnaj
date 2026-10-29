import { Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import { env } from '../config/env'
import { generateRef } from '../utils'
import * as R from '../utils/response'
import { createNotification } from './notification.controller'
import { redisClient, CacheKeys } from '../config/redis'

const MIN_REFERRAL_WITHDRAWAL = 500 // ₦500 minimum transfer to main wallet

/**
 * GET /api/referrals/stats
 */
export async function getReferralStats(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId

  const [user, wallet, totalReferred, referredUsers, earnings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.wallet.findUnique({
      where: { userId },
      select: { referralBalance: true, mainBalance: true },
    }),
    prisma.user.count({ where: { referredById: userId } }),
    prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        createdAt: true,
        wallet: { select: { totalFunded: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.referralEarning.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  if (!user || !wallet) {
    R.notFound(res, 'User or wallet not found')
    return
  }

  // Mask user names & phones for privacy
  const maskedReferrals = referredUsers.map(u => {
    const parts = u.fullName.split(' ')
    const maskedName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0]
    const maskedPhone = u.phone.slice(0, 4) + '***' + u.phone.slice(-3)
    const hasFunded = Number(u.wallet?.totalFunded || 0) > 0

    return {
      id: u.id,
      name: maskedName,
      phone: maskedPhone,
      joinedAt: u.createdAt,
      hasFunded,
    }
  })

  // Calculate total earnings
  const totalEarned = earnings.reduce((sum, e) => sum + Number(e.amount), 0)

  R.ok(res, 'Referral statistics retrieved', {
    referralCode: user.referralCode,
    referralLink: `${env.FRONTEND_URL}/register?ref=${user.referralCode}`,
    referralBalance: Number(wallet.referralBalance),
    mainBalance: Number(wallet.mainBalance),
    totalEarned,
    totalReferred,
    minWithdrawal: MIN_REFERRAL_WITHDRAWAL,
    referredUsers: maskedReferrals,
    earningsHistory: earnings.map(e => ({
      id: e.id,
      amount: Number(e.amount),
      type: e.type,
      isPaid: e.isPaid,
      createdAt: e.createdAt,
    })),
  })
}

/**
 * POST /api/referrals/withdraw
 * Transfers referral earnings into main wallet balance
 */
export async function withdrawReferralEarnings(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { amount, pin } = req.body

  const transferAmount = Number(amount)
  if (!transferAmount || isNaN(transferAmount) || transferAmount < MIN_REFERRAL_WITHDRAWAL) {
    R.badRequest(res, `Minimum withdrawal amount is ₦${MIN_REFERRAL_WITHDRAWAL.toLocaleString()}`)
    return
  }

  if (!pin) {
    R.badRequest(res, 'Transaction PIN is required')
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, pinHash: true },
  })

  if (!user || !user.pinHash) {
    R.badRequest(res, 'Please set your 4-digit transaction PIN in Settings before withdrawing')
    return
  }

  const pinMatches = await bcrypt.compare(pin, user.pinHash)
  if (!pinMatches) {
    R.badRequest(res, 'Incorrect transaction PIN')
    return
  }

  const reference = generateRef('REF-WDR')

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { referralBalance: true, mainBalance: true },
      })

      if (!wallet || Number(wallet.referralBalance) < transferAmount) {
        throw new Error('INSUFFICIENT_REFERRAL_BALANCE')
      }

      // Decrement referral balance, increment main balance
      const newWallet = await tx.wallet.update({
        where: { userId },
        data: {
          referralBalance: { decrement: transferAmount },
          mainBalance:     { increment: transferAmount },
        },
        select: { referralBalance: true, mainBalance: true },
      })

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'REFERRAL_BONUS',
          amount: transferAmount,
          status: 'SUCCESS',
          reference,
          metadata: {
            action: 'REFERRAL_TO_MAIN_TRANSFER',
          },
        },
      })

      return newWallet
    })

    await redisClient.del(CacheKeys.walletBalance(userId)).catch(() => {})

    createNotification({
      userId,
      title: 'Referral Earnings Transferred',
      message: `₦${transferAmount.toLocaleString()} has been moved from your Referral Balance to your Main Wallet.`,
      type: 'TRANSACTION',
      actionUrl: '/wallet',
    })

    R.ok(res, `₦${transferAmount.toLocaleString()} transferred to your main wallet successfully`, {
      reference,
      referralBalance: Number(updated.referralBalance),
      mainBalance: Number(updated.mainBalance),
    })
  } catch (err: any) {
    if (err.message === 'INSUFFICIENT_REFERRAL_BALANCE') {
      R.badRequest(res, 'Insufficient referral balance for this transfer')
      return
    }
    throw err
  }
}
