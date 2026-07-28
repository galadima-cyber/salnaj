import axios, { AxiosInstance } from 'axios'
import { env }    from '../config/env'
import { logger } from '../config/logger'
import { generateRef, sleep } from '../utils'
import { VTPassResponse, VTPassStatus } from '../types'
import { redisClient, CacheKeys } from '../config/redis'

class VTPassService {
  private readonly client: AxiosInstance

  constructor() {
    const credentials = Buffer.from(
      `${env.VTPASS_API_KEY}:${env.VTPASS_SECRET_KEY}`
    ).toString('base64')

    this.client = axios.create({
      baseURL:  env.VTPASS_BASE_URL,
      timeout:  30_000,
      headers: {
        'Content-Type': 'application/json',
        'api-key':      env.VTPASS_API_KEY,
        'public-key':   env.VTPASS_PUBLIC_KEY,
        'secret-key':   env.VTPASS_SECRET_KEY,
      },
    })
  }

  // ─── Internal ───────────────────────────────────────────────

  private parseStatus(code: string): VTPassStatus {
    if (['000', 'delivered'].includes(code)) return 'delivered'
    if (['099'].includes(code)) return 'pending'
    return 'failed'
  }

  private async post<T = VTPassResponse>(
    endpoint: string,
    payload: Record<string, unknown>,
    retries = 2
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const res = await this.client.post(endpoint, payload)
        return res.data as T
      } catch (err: unknown) {
        const isLast = attempt === retries + 1
        logger.warn('VTPass request failed', {
          endpoint, attempt, err: (err as Error).message
        })
        if (isLast) throw err
        await sleep(1000 * attempt) // exponential backoff
      }
    }
    throw new Error('VTPass: max retries exceeded')
  }

  // ─── Data Plans ──────────────────────────────────────────────

  async getDataPlans(network: string): Promise<unknown> {
    // Check cache first (refresh every 6 hours)
    const cached = await redisClient.getJSON(CacheKeys.dataPlans(network))
    if (cached) return cached

    const networkMap: Record<string, string> = {
      MTN:      'mtn-data',
      AIRTEL:   'airtel-data',
      GLO:      'glo-data',
      ETISALAT: 'etisalat-data',
    }
    const serviceId = networkMap[network.toUpperCase()]
    if (!serviceId) throw new Error(`Unknown network: ${network}`)

    const res = await this.client.get(`/service-variations?serviceID=${serviceId}`)
    const plans = res.data?.content?.variations || []
    await redisClient.setJSON(CacheKeys.dataPlans(network), plans, 6 * 3600)
    return plans
  }

  // ─── Airtime ─────────────────────────────────────────────────

  async purchaseAirtime(params: {
    requestId: string
    network:   string
    phone:     string
    amount:    number
  }): Promise<{ status: VTPassStatus; providerRef?: string; data: VTPassResponse }> {
    const networkMap: Record<string, string> = {
      MTN: 'mtn', AIRTEL: 'airtel', GLO: 'glo', ETISALAT: 'etisalat'
    }
    const serviceID = networkMap[params.network.toUpperCase()]

    logger.info('VTPass airtime purchase initiated', {
      network: params.network,
      amount: params.amount,
    })

    const data = await this.post<VTPassResponse>('/pay', {
      request_id: params.requestId,
      serviceID,
      amount:     params.amount,
      phone:      params.phone,
    })

    return {
      status:      this.parseStatus(data.code),
      providerRef: data.requestId,
      data,
    }
  }

  // ─── Data ────────────────────────────────────────────────────

  async purchaseData(params: {
    requestId:     string
    network:       string
    phone:         string
    variationCode: string
    amount:        number
  }): Promise<{ status: VTPassStatus; providerRef?: string; data: VTPassResponse }> {
    const networkMap: Record<string, string> = {
      MTN: 'mtn-data', AIRTEL: 'airtel-data', GLO: 'glo-data', ETISALAT: 'etisalat-data'
    }
    const serviceID = networkMap[params.network.toUpperCase()]

    logger.info('VTPass data purchase initiated', {
      network: params.network,
      variation: params.variationCode,
    })

    const data = await this.post<VTPassResponse>('/pay', {
      request_id:      params.requestId,
      serviceID,
      billersCode:     params.phone,
      variation_code:  params.variationCode,
      amount:          params.amount,
      phone:           params.phone,
    })

    return {
      status:      this.parseStatus(data.code),
      providerRef: data.requestId,
      data,
    }
  }

  // ─── Electricity ─────────────────────────────────────────────

  async verifyMeter(meterNumber: string, disco: string, meterType: 'prepaid' | 'postpaid'): Promise<{
    customerName:    string
    customerAddress: string
    meterNumber:     string
    minAmount:       number
  }> {
    const res = await this.client.post('/merchant-verify', {
      billersCode:     meterNumber,
      serviceID:       disco,
      type:            meterType,
    })

    const content = res.data?.content
    if (!content?.Customer_Name) {
      throw new Error('Meter number not found or invalid')
    }

    return {
      customerName:    content.Customer_Name,
      customerAddress: content.Address || '',
      meterNumber:     content.Meter_Number || meterNumber,
      minAmount:       content.Minimum_Amount || 500,
    }
  }

  async purchaseElectricity(params: {
    requestId:   string
    disco:       string
    meterNumber: string
    meterType:   'prepaid' | 'postpaid'
    amount:      number
    phone:       string
  }): Promise<{ status: VTPassStatus; token?: string; providerRef?: string; data: VTPassResponse }> {
    logger.info('VTPass electricity purchase initiated', {
      disco: params.disco, amount: params.amount
    })

    const data = await this.post<VTPassResponse>('/pay', {
      request_id:      params.requestId,
      serviceID:       params.disco,
      billersCode:     params.meterNumber,
      variation_code:  params.meterType,
      amount:          params.amount,
      phone:           params.phone,
    })

    const token = data.Token || data.token || data.purchased_code

    return {
      status:      this.parseStatus(data.code),
      token,
      providerRef: data.requestId,
      data,
    }
  }

  // ─── Cable TV ─────────────────────────────────────────────────

  async verifyDecoder(decoderNumber: string, provider: string): Promise<{
    customerName:   string
    currentPackage: string
    dueDate?:       string
  }> {
    const res = await this.client.post('/merchant-verify', {
      billersCode: decoderNumber,
      serviceID:   provider,
    })

    const content = res.data?.content
    if (!content?.Customer_Name) {
      throw new Error('Decoder number not found or invalid')
    }

    return {
      customerName:   content.Customer_Name,
      currentPackage: content.Current_Bouquet   || '',
      dueDate:        content.Due_Date          || '',
    }
  }

  async purchaseCableTv(params: {
    requestId:     string
    provider:      string
    decoderNumber: string
    variationCode: string
    amount:        number
    phone:         string
    quantity?:     number
  }): Promise<{ status: VTPassStatus; providerRef?: string; data: VTPassResponse }> {
    logger.info('VTPass cable TV purchase initiated', {
      provider: params.provider, plan: params.variationCode
    })

    const data = await this.post<VTPassResponse>('/pay', {
      request_id:          params.requestId,
      serviceID:           params.provider,
      billersCode:         params.decoderNumber,
      variation_code:      params.variationCode,
      amount:              params.amount,
      phone:               params.phone,
      quantity:            params.quantity || 1,
      subscription_type:   'change',
    })

    return {
      status:      this.parseStatus(data.code),
      providerRef: data.requestId,
      data,
    }
  }

  // ─── Education (WAEC / NECO / JAMB) ──────────────────────────

  async purchaseEducation(params: {
    requestId:     string
    serviceId:     string   // 'waec' | 'neco' | 'jamb'
    variationCode: string
    amount:        number
    phone:         string
    quantity?:     number
  }): Promise<{ status: VTPassStatus; pins?: string[]; providerRef?: string; data: VTPassResponse }> {
    logger.info('VTPass education purchase initiated', {
      service: params.serviceId, qty: params.quantity
    })

    const data = await this.post<VTPassResponse>('/pay', {
      request_id:     params.requestId,
      serviceID:      params.serviceId,
      variation_code: params.variationCode,
      amount:         params.amount,
      phone:          params.phone,
      quantity:       params.quantity || 1,
    })

    const rawPins = data.purchased_code || ''
    const pins = rawPins ? rawPins.split(',').map((p: string) => p.trim()) : []

    return {
      status:      this.parseStatus(data.code),
      pins,
      providerRef: data.requestId,
      data,
    }
  }

  // ─── Betting Wallet ───────────────────────────────────────────

  async verifyBettingUser(userId: string, serviceId: string): Promise<{ name: string }> {
    const res = await this.client.post('/merchant-verify', {
      billersCode: userId,
      serviceID:   serviceId,
    })
    const content = res.data?.content
    if (!content?.Customer_Name) throw new Error('Betting user ID not found')
    return { name: content.Customer_Name }
  }

  async fundBettingWallet(params: {
    requestId:  string
    serviceId:  string
    bettingId:  string
    amount:     number
    phone:      string
  }): Promise<{ status: VTPassStatus; providerRef?: string; data: VTPassResponse }> {
    const data = await this.post<VTPassResponse>('/pay', {
      request_id:  params.requestId,
      serviceID:   params.serviceId,
      billersCode: params.bettingId,
      amount:      params.amount,
      phone:       params.phone,
    })
    return { status: this.parseStatus(data.code), providerRef: data.requestId, data }
  }

  // ─── Query Transaction Status ─────────────────────────────────

  async queryTransaction(requestId: string): Promise<{ status: VTPassStatus; data: VTPassResponse }> {
    const data = await this.post<VTPassResponse>('/requery', { request_id: requestId })
    return { status: this.parseStatus(data.code), data }
  }
}

export const vtpassService = new VTPassService()
