import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { tokenUtils } from '@/utils/token'

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '')
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api'
  }
  return 'https://salnaj-production.up.railway.app/api'
}

const BASE_URL = getApiUrl()

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenUtils.getAccess()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — try refresh, retry once, then logout
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // ── Guard: Do NOT treat PIN verification failures as auth token errors.
    // The backend returns 401 for wrong PIN; we must NOT refresh/logout in that case.
    const errData = (error.response?.data as any)
    const errMsg = (errData?.message || '').toLowerCase()
    if (errMsg.includes('pin') || errMsg.includes('incorrect pin') || errMsg.includes('transaction pin')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        original.headers!.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry  = true
    isRefreshing     = true

    const refreshToken = tokenUtils.getRefresh()
    if (!refreshToken) {
      tokenUtils.clearAll()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
      const newAccess = data.data.accessToken
      tokenUtils.setAccess(newAccess)
      processQueue(null, newAccess)
      original.headers!.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenUtils.clearAll()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

/**
 * Extract user-friendly, layman error message from any error
 * Eliminates status codes and technical jargon
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as any
    const rawMsg = data?.message || data?.error

    if (typeof rawMsg === 'string' && rawMsg.trim()) {
      const lower = rawMsg.toLowerCase()
      // Translate common technical messages into plain layman explanations
      if (lower.includes('insufficient') || (lower.includes('balance') && lower.includes('need'))) {
        return 'Your wallet balance is too low. Please fund your wallet to complete this transaction.'
      }
      if ((lower.includes('incorrect') || lower.includes('wrong')) && lower.includes('pin')) {
        return 'The 4-digit PIN you entered is incorrect. Please double-check and try again.'
      }
      if (lower.includes('pin') && (lower.includes('incorrect') || lower.includes('invalid'))) {
        return 'The 4-digit PIN you entered is incorrect. Please double-check and try again.'
      }
      if (lower.includes('pin has already been set') || lower.includes('already set')) {
        return 'Your transaction PIN is already set. Use "Change PIN" in Security settings.'
      }
      if (lower.includes('meter') && (lower.includes('invalid') || lower.includes('not found'))) {
        return 'Could not verify this meter number. Please check the DISCO and meter number.'
      }
      if (lower.includes('phone') && (lower.includes('invalid') || lower.includes('format'))) {
        return 'Please enter a valid Nigerian mobile phone number (e.g. 08012345678).'
      }
      if (lower.includes('already exists')) {
        return 'An account with this email address or phone number is already registered.'
      }
      if (lower.includes('daily') && lower.includes('limit')) {
        return 'You have reached your daily transaction limit. Complete KYC verification to increase your limit.'
      }
      if (lower.includes('plan not found') || lower.includes('unavailable')) {
        return 'This plan is currently unavailable. Please select another plan and try again.'
      }
      if (lower.includes('wallet not found')) {
        return 'Your wallet could not be found. Please contact support.'
      }
      return rawMsg
    }

    if (data?.errors) {
      const errs = data.errors as Record<string, string>
      const firstError = Object.values(errs)[0]
      if (firstError) return firstError
    }

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return 'The connection took too long to respond. Please check your network and try again.'
    }
    if (!err.response) {
      return 'Unable to reach the server. Please check your internet connection.'
    }
    if (err.response.status === 401) {
      return 'Your session has expired. Please log in again to continue.'
    }
    if (err.response.status === 403) {
      return 'You do not have permission to perform this action.'
    }
    if (err.response.status === 429) {
      return 'Too many attempts. For your safety, please wait a minute before trying again.'
    }
    if (err.response.status >= 500) {
      return 'Service is temporarily undergoing maintenance. Please try again in a few moments.'
    }
    return 'We could not complete your request. Please check your details and try again.'
  }

  if (err instanceof Error) {
    if (err.message.includes('status code')) {
      return 'Transaction could not be completed. Please check your details or wallet balance.'
    }
    return err.message
  }

  return 'An unexpected issue occurred. Please try again.'
}

export type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?:   T
  meta?:   Record<string, unknown>
  errors?: Record<string, string>
}
