import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { tokenUtils } from '@/utils/token'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

/** Extract the error message from any axios error */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    // Backend sends: { success: false, message: "..." }
    const msg = err.response?.data?.message
    if (msg) return msg
    if (err.response?.data?.errors) {
      const errs = err.response.data.errors as Record<string, string>
      return Object.values(errs)[0] || 'Validation failed'
    }
    if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.'
    if (!err.response)               return 'Cannot connect to server. Check your internet connection.'
    if (err.response.status === 429) return 'Too many attempts. Please wait a few minutes.'
    if (err.response.status === 500) return 'Server error. Please try again later.'
    return err.message || 'Something went wrong'
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

export type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?:   T
  meta?:   Record<string, unknown>
  errors?: Record<string, string>
}
