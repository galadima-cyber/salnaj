import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── Lazy-loaded pages ────────────────────────────────────────
// Public
const LandingPage       = lazy(() => import('@/pages/LandingPage'))
const LoginPage         = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage      = lazy(() => import('@/pages/auth/RegisterPage'))

// Dashboard
const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage'))
const TransactionsPage  = lazy(() => import('@/pages/dashboard/TransactionsPage'))
const AutopilotPage     = lazy(() => import('@/pages/dashboard/AutopilotPage'))

// Services
const BuyDataPage       = lazy(() => import('@/pages/services/BuyDataPage'))
const BuyAirtimePage    = lazy(() => import('@/pages/services/BuyAirtimePage'))
const ElectricityPage   = lazy(() => import('@/pages/services/ElectricityPage'))
const CableTvPage       = lazy(() => import('@/pages/services/CableTvPage'))
const EducationPage     = lazy(() => import('@/pages/services/EducationPage'))
const BettingPage       = lazy(() => import('@/pages/services/BettingPage'))
const BulkSmsPage       = lazy(() => import('@/pages/services/BulkSmsPage'))
const GiftDataPage      = lazy(() => import('@/pages/services/GiftDataPage'))

// Wallet + Referral
const WalletPage        = lazy(() => import('@/pages/wallet/WalletPage'))
const ReferralPage      = lazy(() => import('@/pages/referral/ReferralPage'))

// Analytics + Profile
const AnalyticsPage     = lazy(() => import('@/pages/analytics/AnalyticsPage'))
const ProfilePage       = lazy(() => import('@/pages/profile/ProfilePage'))

// Admin
const AdminDashboard    = lazy(() => import('@/pages/admin/AdminDashboard'))

// ─── Page loader ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'var(--color-bg)' }}>
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

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('salnaj_access_token')
  // TODO: decode token and check role
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

const P = ({ children }: { children: React.ReactNode }) =>
  <RequireAuth>{children}</RequireAuth>

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ──────────────────────────────────── */}
            <Route path="/"                element={<LandingPage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />

            {/* ── Dashboard ───────────────────────────────── */}
            <Route path="/dashboard"       element={<P><DashboardPage /></P>} />
            <Route path="/transactions"    element={<P><TransactionsPage /></P>} />
            <Route path="/autopilot"       element={<P><AutopilotPage /></P>} />
            <Route path="/analytics"       element={<P><AnalyticsPage /></P>} />
            <Route path="/settings"        element={<P><ProfilePage /></P>} />

            {/* ── Services ────────────────────────────────── */}
            <Route path="/buy-data"        element={<P><BuyDataPage /></P>} />
            <Route path="/buy-airtime"     element={<P><BuyAirtimePage /></P>} />
            <Route path="/electricity"     element={<P><ElectricityPage /></P>} />
            <Route path="/cable-tv"        element={<P><CableTvPage /></P>} />
            <Route path="/education"       element={<P><EducationPage /></P>} />
            <Route path="/betting"         element={<P><BettingPage /></P>} />
            <Route path="/bulk-sms"        element={<P><BulkSmsPage /></P>} />
            <Route path="/gift-data"       element={<P><GiftDataPage /></P>} />

            {/* ── Wallet + Referral ───────────────────────── */}
            <Route path="/wallet"          element={<P><WalletPage /></P>} />
            <Route path="/referrals"       element={<P><ReferralPage /></P>} />

            {/* ── Admin ───────────────────────────────────── */}
            <Route path="/admin"           element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

            {/* ── Catch-all ───────────────────────────────── */}
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
