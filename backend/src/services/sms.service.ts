import axios from 'axios'
import { env }    from '../config/env'
import { logger } from '../config/logger'

const TERMII_URL = 'https://api.ng.termii.com/api/sms/send'

async function sendSms(to: string, message: string): Promise<void> {
  if (!env.TERMII_API_KEY) {
    logger.warn('TERMII_API_KEY not set — SMS skipped', { to })
    return
  }
  try {
    const phone = to.startsWith('0') ? `234${to.slice(1)}` : to
    await axios.post(TERMII_URL, {
      to:       phone,
      from:     env.TERMII_SENDER_ID,
      sms:      message,
      type:     'plain',
      api_key:  env.TERMII_API_KEY,
      channel:  'generic',
    })
    logger.info('SMS sent', { to: phone })
  } catch (err: unknown) {
    logger.error('SMS send failed', { to, err: (err as Error).message })
    // Don't throw — SMS failure should not block main flow
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
    let sent = 0; let failed = 0
    // Termii supports batch but we chunk for reliability
    const chunks: string[][] = []
    for (let i = 0; i < recipients.length; i += 100) {
      chunks.push(recipients.slice(i, i + 100))
    }
    for (const chunk of chunks) {
      try {
        await axios.post('https://api.ng.termii.com/api/sms/send/bulk', {
          to:       chunk.map(p => p.startsWith('0') ? `234${p.slice(1)}` : p),
          from:     senderId || env.TERMII_SENDER_ID,
          sms:      message,
          type:     'plain',
          api_key:  env.TERMII_API_KEY,
          channel:  'generic',
        })
        sent += chunk.length
      } catch {
        failed += chunk.length
      }
    }
    return { sent, failed }
  },

  /** Get cost per SMS from Termii — used for pricing */
  async getBalance(): Promise<number | null> {
    try {
      const res = await axios.get(`https://api.ng.termii.com/api/get-balance?api_key=${env.TERMII_API_KEY}`)
      return res.data?.balance ?? null
    } catch {
      return null
    }
  },
}
