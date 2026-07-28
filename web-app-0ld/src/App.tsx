import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── Lazy page imports (code splitting) ───────────────────────
const LandingPage       = lazy(() => import('@/pages/LandingPage'))
const LoginPage         = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage      = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage'))
const BuyDataPage       = lazy(() => import('@/pages/services/BuyDataPage'))
const BuyAirtimePage    = lazy(() => import('@/pages/services/BuyAirtimePage'))
const ElectricityPage   = lazy(() => import('@/pages/services/ElectricityPage'))
const CableTvPage       = lazy(() => import('@/pages/services/CableTvPage'))
const WalletPage        = lazy(() => import('@/pages/wallet/WalletPage'))
const TransactionsPage  = lazy(() => import('@/pages/dashboard/TransactionsPage'))
const ReferralPage      = lazy(() => import('@/pages/referral/ReferralPage'))
const AutopilotPage     = lazy(() => import('@/pages/dashboard/AutopilotPage'))

// ─── Page loader ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse-glow"
             style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
             style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )
}

// ─── Query client ─────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2, refetchOnWindowFocus: false },
  },
})

// ─── Auth guard ───────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('salnaj_access_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ──────────────────────────────────── */}
            <Route path="/"              element={<LandingPage />} />
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/register"      element={<RegisterPage />} />

            {/* ── Protected ───────────────────────────────── */}
            <Route path="/dashboard"     element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/buy-data"      element={<RequireAuth><BuyDataPage /></RequireAuth>} />
            <Route path="/buy-airtime"   element={<RequireAuth><BuyAirtimePage /></RequireAuth>} />
            <Route path="/electricity"   element={<RequireAuth><ElectricityPage /></RequireAuth>} />
            <Route path="/cable-tv"      element={<RequireAuth><CableTvPage /></RequireAuth>} />
            <Route path="/wallet"        element={<RequireAuth><WalletPage /></RequireAuth>} />
            <Route path="/transactions"  element={<RequireAuth><TransactionsPage /></RequireAuth>} />
            <Route path="/referrals"     element={<RequireAuth><ReferralPage /></RequireAuth>} />
            <Route path="/autopilot"     element={<RequireAuth><AutopilotPage /></RequireAuth>} />

            {/* ── Catch-all ───────────────────────────────── */}
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
