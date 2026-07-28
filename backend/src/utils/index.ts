import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { PaginationMeta } from '../types'

// ─── Reference Generation ─────────────────────────────────────

/** Generate a unique transaction reference e.g. SNJ-TXN-1721900000000-A3K9P */
export function generateRef(prefix = 'SNJ-TXN'): string {
  const timestamp = Date.now()
  const random    = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/** Generate a referral code e.g. SNJ-A3K9P */
export function generateReferralCode(): string {
  return `SNJ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

/** Generate a gift data code e.g. GIFT-X4K2-MTN2G */
export function generateGiftCode(network: string, sizeLabel: string): string {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  const tag    = `${network.slice(0, 3)}${sizeLabel.replace(/[^0-9A-Z]/gi, '').toUpperCase()}`
  return `GIFT-${random}-${tag}`
}

/** Generate a secure random API key */
export function generateApiKey(): string {
  return `snj_live_${crypto.randomBytes(24).toString('hex')}`
}

// ─── OTP ──────────────────────────────────────────────────────

/** Generate a 6-digit numeric OTP */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/** Get OTP expiry date — default 5 minutes */
export function getOtpExpiry(minutes = 5): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

// ─── Formatting ───────────────────────────────────────────────

/** Format Naira for display */
export function formatNaira(amount: number | string): string {
  return new Intl.NumberFormat('en-NG', {
    style:    'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

/** Mask phone number for logs: 08012345678 → 0801****678 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-3)
}

/** Mask email for logs: user@email.com → u***@email.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain}`
}

// ─── Pagination ───────────────────────────────────────────────

export function parsePagination(query: { page?: string; limit?: string }) {
  const page  = Math.max(1, parseInt(query.page  || '1',  10))
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
  const skip  = (page - 1) * limit
  return { page, limit, skip }
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

// ─── Validation helpers ───────────────────────────────────────

/** Check if a Nigerian phone number is valid */
export function isValidNigerianPhone(phone: string): boolean {
  return /^(0[789][01]\d{8}|(\+234)[789][01]\d{8})$/.test(phone)
}

/** Normalize phone to 080... format */
export function normalizePhone(phone: string): string {
  if (phone.startsWith('+234')) return '0' + phone.slice(4)
  if (phone.startsWith('234'))  return '0' + phone.slice(3)
  return phone
}

/** Detect network from Nigerian phone number */
export function detectNetwork(phone: string): string | null {
  const normalized = normalizePhone(phone)
  const prefix = normalized.slice(0, 4)

  const MTN_PREFIXES     = ['0803','0806','0703','0706','0813','0816','0810','0814','0903','0906','0913','0916']
  const AIRTEL_PREFIXES  = ['0802','0808','0708','0812','0701','0902','0901','0907','0912']
  const GLO_PREFIXES     = ['0805','0807','0705','0815','0811','0905','0915']
  const ETISALAT_PREFIXES= ['0809','0817','0818','0909','0908']

  if (MTN_PREFIXES.includes(prefix))      return 'MTN'
  if (AIRTEL_PREFIXES.includes(prefix))   return 'AIRTEL'
  if (GLO_PREFIXES.includes(prefix))      return 'GLO'
  if (ETISALAT_PREFIXES.includes(prefix)) return 'ETISALAT'
  return null
}

// ─── Date helpers ─────────────────────────────────────────────

/** Get start of today (midnight) */
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Get next occurrence of a scheduled time */
export function getNextRunDate(
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  timeOfDay: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  const now  = new Date()
  const next = new Date()

  next.setHours(hours, minutes, 0, 0)

  if (frequency === 'DAILY') {
    if (next <= now) next.setDate(next.getDate() + 1)
  } else if (frequency === 'WEEKLY' && dayOfWeek !== undefined) {
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7
    next.setDate(now.getDate() + (daysUntil === 0 && next <= now ? 7 : daysUntil))
  } else if (frequency === 'MONTHLY' && dayOfMonth !== undefined) {
    next.setDate(dayOfMonth)
    if (next <= now) {
      next.setMonth(next.getMonth() + 1)
      next.setDate(dayOfMonth)
    }
  }

  return next
}

// ─── Hashing ──────────────────────────────────────────────────

/** SHA-256 hash for Paystack webhook verification */
export function sha256(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

// ─── Sleep ────────────────────────────────────────────────────
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
