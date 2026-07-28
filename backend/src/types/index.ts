import { Request } from 'express'

export type UserRole = 'USER' | 'AGENT' | 'SUPER_AGENT' | 'ADMIN' | 'SUPER_ADMIN'
export type KycStatus = 'UNVERIFIED' | 'PHONE_VERIFIED' | 'BVN_VERIFIED' | 'FULL_KYC'
export type TxType = 'DATA' | 'AIRTIME' | 'ELECTRICITY' | 'CABLE_TV' | 'EDUCATION' |
  'BETTING' | 'AIRTIME_TO_CASH' | 'BULK_SMS' | 'RECHARGE_CARD' |
  'WALLET_FUND' | 'WALLET_TRANSFER' | 'REFERRAL_BONUS' | 'API_PURCHASE'
export type TxStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'REFUNDED'
export type Network = 'MTN' | 'AIRTEL' | 'GLO' | 'ETISALAT'

export interface JwtPayload {
  userId: string
  email:  string
  role:   UserRole
  iat?:   number
  exp?:   number
}

// AuthRequest fully extends Request so body/params/query are available
export interface AuthRequest extends Request {
  user?: JwtPayload
  apiUser?: { userId: string; keyId: string }
}

export interface PaginationMeta {
  page: number; limit: number; total: number
  totalPages: number; hasNext: boolean; hasPrev: boolean
}

export interface VTPassResponse {
  code: string
  response_description: string
  requestId: string
  amount: string
  transaction_date?: { date: string }
  purchased_code?: string
  Token?: string; token?: string
  content?: { transactions?: Record<string, unknown> }
}

export type VTPassStatus = 'delivered' | 'failed' | 'pending'

export interface SmartBuyResult {
  rank: number; network: string; planName: string; sizeLabel: string
  price: number; validityDays: number; valueScore: number
  badge?: string; planId: string; providerCode: string; insight?: string
}
