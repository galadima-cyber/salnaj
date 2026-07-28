import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, walletApi, User, WalletBalance } from '../services/endpoints'

interface AuthState {
  user:          User | null
  balance:       WalletBalance | null
  isLoading:     boolean
  isHydrated:    boolean

  // Actions
  login:         (email: string, password: string) => Promise<void>
  logout:        () => Promise<void>
  fetchMe:       () => Promise<void>
  fetchBalance:  () => Promise<void>
  setUser:       (user: User) => void
  setBalance:    (balance: WalletBalance) => void
  clearSession:  () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:       null,
      balance:    null,
      isLoading:  false,
      isHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login(email, password)
          const { accessToken, refreshToken, user } = data.data
          localStorage.setItem('salnaj_access_token',  accessToken)
          localStorage.setItem('salnaj_refresh_token', refreshToken)
          set({ user, isLoading: false })
          // Fetch wallet balance after login
          get().fetchBalance().catch(() => {})
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch { /* ignore */ }
        get().clearSession()
      },

      fetchMe: async () => {
        try {
          const { data } = await authApi.me()
          set({ user: data.data })
        } catch { /* session expired — will be handled by axios interceptor */ }
      },

      fetchBalance: async () => {
        try {
          const { data } = await walletApi.getBalance()
          set({ balance: data.data })
        } catch { /* silent */ }
      },

      setUser:    (user)    => set({ user }),
      setBalance: (balance) => set({ balance }),

      clearSession: () => {
        localStorage.removeItem('salnaj_access_token')
        localStorage.removeItem('salnaj_refresh_token')
        set({ user: null, balance: null })
        window.location.href = '/login'
      },
    }),
    {
      name:    'salnaj-auth',
      // Only persist user profile, not sensitive tokens
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true
      },
    }
  )
)
