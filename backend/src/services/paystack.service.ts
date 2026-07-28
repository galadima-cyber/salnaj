import axios, { AxiosInstance } from 'axios'
import { env }    from '../config/env'
import { logger } from '../config/logger'
import { sha256 } from '../utils'

class PaystackService {
  private readonly client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL:  'https://api.paystack.co',
      timeout:  15_000,
      headers: {
        Authorization:  `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Initialize a wallet funding transaction
   * Returns a payment URL for the frontend to redirect to
   */
  async initializePayment(params: {
    email:     string
    amount:    number      // in Naira — we convert to kobo internally
    reference: string
    metadata?: Record<string, unknown>
    callbackUrl?: string
  }): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
    const res = await this.client.post('/transaction/initialize', {
      email:        params.email,
      amount:       Math.round(params.amount * 100), // kobo
      reference:    params.reference,
      callback_url: params.callbackUrl || `${env.FRONTEND_URL}/wallet/fund/callback`,
      metadata: {
        ...params.metadata,
        app: env.APP_NAME,
      },
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    })

    const { data } = res.data
    return {
      authorizationUrl: data.authorization_url,
      accessCode:       data.access_code,
      reference:        data.reference,
    }
  }

  /**
   * Verify a payment — called after Paystack redirects back OR on webhook
   */
  async verifyPayment(reference: string): Promise<{
    status:     string
    amount:     number   // in Naira
    channel:    string
    cardLast4?: string
    bank?:      string
    email:      string
    phone?:     string
    metadata?:  Record<string, unknown>
  }> {
    const res = await this.client.get(`/transaction/verify/${reference}`)
    const { data } = res.data

    return {
      status:     data.status,
      amount:     data.amount / 100, // convert from kobo
      channel:    data.channel,
      cardLast4:  data.authorization?.last4,
      bank:       data.authorization?.bank,
      email:      data.customer.email,
      phone:      data.customer.phone,
      metadata:   data.metadata,
    }
  }

  /**
   * Verify Paystack webhook signature
   * CRITICAL: always validate before processing
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!env.PAYSTACK_SECRET_KEY) return false
    const expected = sha256(rawBody, env.PAYSTACK_SECRET_KEY)
    return expected === signature
  }

  /**
   * Get list of Nigerian banks — useful for future payout feature
   */
  async getBanks(): Promise<Array<{ name: string; code: string; slug: string }>> {
    const res = await this.client.get('/bank?country=nigeria&perPage=100')
    return res.data.data || []
  }

  /**
   * Resolve bank account — verify account name before payout
   */
  async resolveAccount(accountNumber: string, bankCode: string): Promise<{
    accountName:   string
    accountNumber: string
  }> {
    const res = await this.client.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    )
    return {
      accountName:   res.data.data.account_name,
      accountNumber: res.data.data.account_number,
    }
  }
}

export const paystackService = new PaystackService()
