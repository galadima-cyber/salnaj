import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format Nigerian Naira */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Format large numbers compactly */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`
  return num.toString()
}

/** Truncate long strings */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

/** Mask phone number for display */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-4)
}

/** Generate a simple unique reference */
export function generateRef(prefix = 'SNJ'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

/** Delay helper for testing */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Detect Nigerian network from phone number prefix */
export function detectNetwork(phone: string): string | null {
  const p = phone.startsWith('+234') ? '0' + phone.slice(4) : phone.startsWith('234') ? '0' + phone.slice(3) : phone
  const prefix = p.slice(0, 4)
  const MTN      = ['0803','0806','0703','0706','0813','0816','0810','0814','0903','0906','0913','0916']
  const AIRTEL   = ['0802','0808','0708','0812','0701','0902','0901','0907','0912']
  const GLO      = ['0805','0807','0705','0815','0811','0905','0915']
  const ETISALAT = ['0809','0817','0818','0909','0908']
  if (MTN.includes(prefix))      return 'MTN'
  if (AIRTEL.includes(prefix))   return 'AIRTEL'
  if (GLO.includes(prefix))      return 'GLO'
  if (ETISALAT.includes(prefix)) return 'ETISALAT'
  return null
}
