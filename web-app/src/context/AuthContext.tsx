import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
  type ReactNode,
} from 'react'
import { api, getErrorMessage } from '@/services/api'
import { tokenUtils } from '@/utils/token'

// ─── Types ────────────────────────────────────────────────────

export interface AuthUser {
  id:              string
  fullName:        string
  email:           string
  phone:           string
  role:            string
  kycStatus:       string
  referralCode:    string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  profilePhoto?:   string
}

export interface WalletBalance {
  main:     number
  bonus:    number
  cashback: number
  total:    number
}

interface AuthContextValue {
  user:            AuthUser | null
  balance:         WalletBalance | null
  isAuthenticated: boolean
  isLoading:       boolean         // true while checking session on mount
  login:           (email: string, password: string) => Promise<void>
  logout:          () => Promise<void>
  register:        (data: RegisterData) => Promise<{ userId: string }>
  refreshBalance:  () => Promise<void>
  updateUser:      (u: Partial<AuthUser>) => void
}

export interface RegisterData {
  fullName:     string
  email:        string
  phone:        string
  password:     string
  referralCode?: string
}

// ─── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [balance,   setBalance]   = useState<WalletBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const didMount = useRef(false)

  // On mount — restore session if token exists
  useEffect(() => {
    if (didMount.current) return
    didMount.current = true

    const restore = async () => {
      if (!tokenUtils.isLoggedIn()) {
        setIsLoading(false)
        return
      }
      try {
        const [meRes, balRes] = await Promise.all([
          api.get<{ success: boolean; data: AuthUser }>('/auth/me'),
          api.get<{ success: boolean; data: WalletBalance }>('/wallet/balance'),
        ])
        setUser(meRes.data.data)
        setBalance(balRes.data.data)
      } catch {
        // Token invalid — clear and stay on login
        tokenUtils.clearAll()
      } finally {
        setIsLoading(false)
      }
    }

    restore()
  }, [])

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{
      success: boolean
      data: { accessToken: string; refreshToken: string; user: AuthUser }
    }>('/auth/login', { email, password })

    const { accessToken, refreshToken, user: loggedUser } = data.data
    tokenUtils.setTokens(accessToken, refreshToken)
    setUser(loggedUser)

    // Fetch balance after login (non-blocking on error)
    api.get<{ success: boolean; data: WalletBalance }>('/wallet/balance')
      .then(r => setBalance(r.data.data))
      .catch(() => {})
  }, [])

  // ── Register ───────────────────────────────────────────────
  const register = useCallback(async (formData: RegisterData): Promise<{ userId: string }> => {
    const { data } = await api.post<{
      success: boolean
      data: { userId: string; email: string; referralCode: string }
    }>('/auth/register', formData)

    return { userId: data.data.userId }
  }, [])

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    tokenUtils.clearAll()
    setUser(null)
    setBalance(null)
  }, [])

  // ── Refresh balance ────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: WalletBalance }>('/wallet/balance')
      setBalance(data.data)
    } catch { /* silent */ }
  }, [])

  // ── Update user (after profile save) ──────────────────────
  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      balance,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      register,
      refreshBalance,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
