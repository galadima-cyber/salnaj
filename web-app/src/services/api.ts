import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// ─── Base client ─────────────────────────────────────────────
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach access token ───────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('salnaj_access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle 401, auto-refresh ─────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('salnaj_refresh_token')

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          )
          const newAccess = data.data.accessToken
          localStorage.setItem('salnaj_access_token', newAccess)
          if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        } catch {
          // Refresh failed — clear session and redirect
          localStorage.removeItem('salnaj_access_token')
          localStorage.removeItem('salnaj_refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// ─── Typed API helpers ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?:   T
  meta?:   Record<string, unknown>
  errors?: Record<string, string>
}

/** Extract data from response, throw on error */
export async function apiCall<T>(
  promise: Promise<{ data: ApiResponse<T> }>
): Promise<T> {
  const { data } = await promise
  if (!data.success) throw new Error(data.message)
  return data.data as T
}

/** Extract error message from axios error */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.message || err.message || 'Something went wrong'
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}
