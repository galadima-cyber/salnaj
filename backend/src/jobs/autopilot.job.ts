/**
 * Autopilot Job — runs every minute via cron
 * Checks ScheduledPurchase records due for execution and processes them.
 *
 * In production: use Bull queue + Redis for reliability.
 * In development: simple setInterval works fine.
 */

import prisma  from '../config/database'
import { vtpassService  } from '../services/vtpass.service'
import { walletService  } from '../services/wallet.service'
import { smsService     } from '../services/sms.service'
import { emailService   } from '../services/email.service'
import { logger }         from '../config/logger'
import { generateRef, formatNaira, getNextRunDate } from '../utils'

async function runAutopilotJobs(): Promise<void> {
  const now = new Date()

  const duePurchases = await prisma.scheduledPurchase.findMany({
    where:   { isActive: true, nextRunAt: { lte: now } },
    include: { user: { select: { email: true, fullName: true, phone: true } } },
    take:    50, // process in batches
  })

  if (duePurchases.length === 0) return
  logger.info(`Autopilot: processing ${duePurchases.length} scheduled purchase(s)`)

  for (const job of duePurchases) {
    try {
      await processScheduledPurchase(job)
    } catch (err) {
      logger.error('Autopilot job failed', {
        jobId:  job.id,
        userId: job.userId,
        err:    (err as Error).message,
      })
      // Increment fail count — disable after 5 consecutive failures
      const updated = await prisma.scheduledPurchase.update({
        where: { id: job.id },
        data: {
          failCount: { increment: 1 },
          isActive:  job.failCount + 1 >= 5 ? false : true,
          nextRunAt: getNextRunDate(
            job.frequency,
            job.timeOfDay,
            job.dayOfWeek ?? undefined,
            job.dayOfMonth ?? undefined
          ),
        },
      })
      if (!updated.isActive) {
        logger.warn(`Autopilot job disabled after 5 failures`, { jobId: job.id })
        // Notify user
        emailService.sendOtp(
          job.user.email,
          job.user.fullName,
          'N/A',
          'EMAIL_VERIFY' // reuse template — ideally build a dedicated template
        ).catch(() => {})
      }
    }
  }
}

async function processScheduledPurchase(
  job: Awaited<ReturnType<typeof prisma.scheduledPurchase.findMany>>[0] & {
    user: { email: string; fullName: string; phone: string }
  }
): Promise<void> {
  const reference = generateRef('SNJ-AUTO')

  // Get plan details
  const plan = job.planId
    ? await prisma.dataPlan.findUnique({ where: { id: job.planId } })
    : null

  const amount = plan ? Number(plan.price) : Number(job.amount)

  if (!amount || amount <= 0) {
    throw new Error('Autopilot: invalid amount for scheduled purchase')
  }

  // Check wallet balance
  const balances = await walletService.getBalance(job.userId)
  if (balances.main + balances.bonus < amount) {
    logger.warn('Autopilot: insufficient balance — skipping', {
      jobId: job.id, required: amount, available: balances.main,
    })

    // Notify user
    smsService.sendTransactionAlert(job.user.phone, {
      type: 'Autopilot',
      amount: formatNaira(amount),
      reference: 'SKIPPED',
    }).catch(() => {})

    // Still update nextRunAt so we try again next cycle
    await prisma.scheduledPurchase.update({
      where: { id: job.id },
      data:  {
        nextRunAt: getNextRunDate(job.frequency, job.timeOfDay,
          job.dayOfWeek ?? undefined, job.dayOfMonth ?? undefined),
      },
    })
    return
  }

  // Execute purchase
  if (job.type === 'DATA' && plan) {
    const result = await vtpassService.purchaseData({
      requestId:     reference,
      network:       plan.network,
      phone:         job.phone,
      variationCode: plan.providerCode,
      amount,
    })

    const status = result.status === 'delivered' ? 'SUCCESS' : 'FAILED'

    await prisma.$transaction(async (tx) => {
      if (status === 'SUCCESS') {
        await walletService.debit({ userId: job.userId, amount, prismaCtx: tx as typeof prisma })
      }
      await tx.transaction.create({
        data: {
          userId:     job.userId,
          type:       'DATA',
          network:    plan.network,
          phone:      job.phone,
          planId:     plan.id,
          planName:   plan.name,
          amount,
          reference,
          status,
          providerRef: result.providerRef,
          completedAt: new Date(),
          metadata:   { autopilot: true, jobId: job.id },
        },
      })
    })

    // Notify user
    if (status === 'SUCCESS') {
      smsService.sendTransactionAlert(job.user.phone, {
        type: `Autopilot: ${plan.name}`, amount: formatNaira(amount), reference,
      }).catch(() => {})
    }
  }

  // Update schedule — set next run date
  await prisma.scheduledPurchase.update({
    where: { id: job.id },
    data: {
      lastRunAt:  new Date(),
      runCount:   { increment: 1 },
      failCount:  0, // reset on success
      nextRunAt:  getNextRunDate(
        job.frequency,
        job.timeOfDay,
        job.dayOfWeek ?? undefined,
        job.dayOfMonth ?? undefined
      ),
    },
  })

  logger.info('Autopilot job completed', { jobId: job.id, reference, userId: job.userId })
}

/** Start the autopilot scheduler */
export function startAutopilot(): void {
  logger.info('Autopilot scheduler started (runs every 60s)')
  // Run immediately, then every 60 seconds
  runAutopilotJobs().catch(err => logger.error('Autopilot initial run failed', { err }))
  setInterval(() => {
    runAutopilotJobs().catch(err => logger.error('Autopilot run failed', { err }))
  }, 60_000)
}
