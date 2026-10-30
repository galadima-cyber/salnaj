import axios from 'axios'
import { env }    from '../config/env'
import { logger } from '../config/logger'

const TERMII_URL      = 'https://api.ng.termii.com/api/sms/send'
const TERMII_BULK_URL = 'https://api.ng.termii.com/api/sms/send/bulk'

/**
 * Determine the best Termii channel to use.
 * - 'dnd'     — penetrates DND list but requires an approved sender ID.
 * - 'generic' — works without a registered sender ID (cannot reach DND-only numbers).
 * - 'N-Alert' — Nigerian telecom alert channel, no approval needed.
 * We default to 'generic' so SMS can be delivered without waiting for Termii approval.
 */
const CHANNEL = process.env.TERMII_CHANNEL || 'generic'
const SENDER  = process.env.TERMII_SENDER_ID || 'N-Alert'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`
  if (digits.startsWith('234') && digits.length === 13) return digits
  if (digits.length === 10) return `234${digits}`
  return digits
}

async function sendSms(to: string, message: string): Promise<void> {
  if (!env.TERMII_API_KEY) {
    logger.warn('TERMII_API_KEY not set — SMS skipped', { to })
    return
  }
  try {
    const phone = normalizePhone(to)
    const res = await axios.post(TERMII_URL, {
      to:      phone,
      from:    SENDER,
      sms:     message,
      type:    'plain',
      api_key: env.TERMII_API_KEY,
      channel: CHANNEL,
    })
    logger.info('SMS sent', { to: phone, status: res.data?.message })
  } catch (err: unknown) {
    const axiosErr = err as any
    const errData  = axiosErr?.response?.data
    logger.error('SMS send failed', {
      to,
      status: axiosErr?.response?.status,
      error:  errData || axiosErr?.message,
    })
    // Don't throw — SMS failure should never block the main purchase flow
  }
}

export const smsService = {
  async sendOtp(phone: string, otp: string): Promise<void> {
    const msg = `Your ${env.APP_NAME} OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`
    await sendSms(phone, msg)
  },

  async sendTransactionAlert(
    phone: string,
    details: { type: string; amount: string; token?: string; reference: string }
  ): Promise<void> {
    let msg = `${env.APP_NAME}: ${details.type} of ${details.amount} successful. Ref: ${details.reference}.`
    if (details.token) msg += ` Token: ${details.token}`
    await sendSms(phone, msg)
  },

  async sendBulk(
    recipients: string[],
    message: string,
    senderId?: string
  ): Promise<{ sent: number; failed: number }> {
    if (!env.TERMII_API_KEY) {
      logger.warn('TERMII_API_KEY not set — Bulk SMS skipped')
      return { sent: 0, failed: recipients.length }
    }

    let sent = 0
    let failed = 0

    // Chunk into groups of 100 for Termii bulk reliability
    const chunks: string[][] = []
    for (let i = 0; i < recipients.length; i += 100) {
      chunks.push(recipients.slice(i, i + 100))
    }

    // Use the user-provided senderId if available, otherwise default
    // Using 'generic' channel bypasses sender ID approval requirements
    const effectiveSender  = senderId || SENDER
    const effectiveChannel = CHANNEL

    for (const chunk of chunks) {
      const normalizedChunk = chunk.map(normalizePhone)
      try {
        const res = await axios.post(TERMII_BULK_URL, {
          to:      normalizedChunk,
          from:    effectiveSender,
          sms:     message,
          type:    'plain',
          api_key: env.TERMII_API_KEY,
          channel: effectiveChannel,
        })

        const responseData = res.data
        logger.info('Bulk SMS chunk sent', {
          count:   chunk.length,
          status:  responseData?.message,
        })
        sent += chunk.length
      } catch (err: any) {
        const errData = err?.response?.data
        const errMsg  = errData?.message || errData?.error || err?.message || 'Unknown error'

        logger.error('Bulk SMS batch dispatch error:', {
          error: errMsg,
          data:  errData,
          count: chunk.length,
        })

        // Log helpful hint for sender ID issues
        if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('sender_id')) {
          logger.warn(
            `Bulk SMS sender ID "${effectiveSender}" not approved for this workspace. ` +
            `Set TERMII_CHANNEL=generic and TERMII_SENDER_ID=N-Alert in .env to bypass approval.`
          )
        }

        failed += chunk.length
      }
    }

    return { sent, failed }
  },

  /** Get Termii account balance */
  async getBalance(): Promise<number | null> {
    try {
      const res = await axios.get(
        `https://api.ng.termii.com/api/get-balance?api_key=${env.TERMII_API_KEY}`
      )
      return res.data?.balance ?? null
    } catch {
      return null
    }
  },
}
