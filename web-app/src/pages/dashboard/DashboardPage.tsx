import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wifi, Phone, Zap, Tv, GraduationCap, Wallet,
  RefreshCw, Target, MessageSquare, CreditCard, Users,
  Code2, Plus, Eye, EyeOff, ArrowUpRight, ArrowDownLeft,
  Bell, Search, ChevronRight, TrendingUp, Calendar,
  Gift, BarChart3, CheckCircle2, XCircle, Clock,
  Settings, LogOut, Menu, X, Home, History,
  Sparkles
} from 'lucide-react'
import { brandConfig } from '@/config/brand.config'
import { formatNaira } from '@/utils'
import { useTheme } from '@/hooks/useTheme'

// ─── Mock data ───────────────────────────────────────────────
const MOCK_BALANCE = 12450.00
const MOCK_BONUS   = 350.00

const quickActions = [
  { icon: Wifi,         label: 'Buy Data',      href: '/buy-data',      color: 'var(--color-primary)',    bg: 'var(--color-primary-muted)' },
  { icon: Phone,        label: 'Buy Airtime',   href: '/buy-airtime',   color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
  { icon: Zap,          label: 'Electricity',   href: '/electricity',   color: '#7C3AED',                  bg: 'rgba(124,58,237,0.10)' },
  { icon: Tv,           label: 'Cable TV',      href: '/cable-tv',      color: '#DB2777',                  bg: 'rgba(219,39,119,0.10)' },
  { icon: GraduationCap,label: 'Education',     href: '/education',     color: 'var(--color-accent-dark)', bg: 'var(--color-accent-subtle)' },
  { icon: RefreshCw,    label: 'Airtime→Cash',  href: '/airtime-cash',  color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
  { icon: Target,       label: 'Betting',       href: '/betting',       color: '#DC2626',                  bg: 'rgba(220,38,38,0.10)' },
  { icon: MessageSquare,label: 'Bulk SMS',      href: '/bulk-sms',      color: 'var(--color-primary)',    bg: 'var(--color-primary-muted)' },
  { icon: CreditCard,   label: 'Recharge Cards',href: '/recharge-cards',color: '#7C3AED',                 bg: 'rgba(124,58,237,0.10)' },
  { icon: Users,        label: 'Referrals',     href: '/referrals',     color: 'var(--color-accent-dark)',bg: 'var(--color-accent-subtle)' },
  { icon: Code2,        label: 'API Access',    href: '/api',           color: '#0891B2',                  bg: 'rgba(8,145,178,0.10)' },
  { icon: Wallet,       label: 'Fund Wallet',   href: '/wallet/fund',   color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
]

const recentTransactions = [
  { id: '1', type: 'data',        label: 'MTN 2GB Data',     phone: '0812345678', amount: -500,   status: 'success', time: '2 hours ago' },
  { id: '2', type: 'cable',       label: 'DSTV Compact',     phone: '12345678901',amount: -9000,  status: 'success', time: 'Yesterday' },
  { id: '3', type: 'wallet',      label: 'Wallet Funded',    phone: '',            amount: +20000, status: 'success', time: 'Yesterday' },
  { id: '4', type: 'electricity', label: 'IKEDC Prepaid',    phone: '45012345678',amount: -5000,  status: 'success', time: '2 days ago' },
  { id: '5', type: 'airtime',     label: 'Airtel Airtime',   phone: '0901234567', amount: -200,   status: 'failed',  time: '3 days ago' },
  { id: '6', type: 'data',        label: 'Glo 10GB Data',    phone: '0805678901', amount: -2000,  status: 'pending', time: '3 days ago' },
]

const smartBuyResults = [
  { rank: '🥇', network: 'Airtel', plan: '6GB',  price: 1000, validity: '7 days',  badge: 'Best Value',      color: '#DC2626' },
  { rank: '🥈', network: 'Glo',    plan: '5GB',  price: 1000, validity: '14 days', badge: 'Longest Validity', color: '#059669' },
  { rank: '🥉', network: 'MTN',    plan: '4GB',  price: 1000, validity: '30 days', badge: 'Most Flexible',    color: '#F59E0B' },
]

const navItems = [
  { icon: Home,     label: 'Dashboard',   href: '/dashboard' },
  { icon: Wifi,     label: 'Buy Data',    href: '/buy-data' },
  { icon: History,  label: 'History',     href: '/transactions' },
  { icon: Users,    label: 'Referrals',   href: '/referrals' },
  { icon: Settings, label: 'Settings',    href: '/settings' },
]

function TxIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    data:        { icon: Wifi,          color: 'var(--color-primary)',    bg: 'var(--color-primary-muted)' },
    airtime:     { icon: Phone,         color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
    electricity: { icon: Zap,           color: '#7C3AED',                 bg: 'rgba(124,58,237,0.10)' },
    cable:       { icon: Tv,            color: '#DB2777',                 bg: 'rgba(219,39,119,0.10)' },
    wallet:      { icon: Wallet,        color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
    education:   { icon: GraduationCap, color: 'var(--color-accent-dark)',bg: 'var(--color-accent-subtle)' },
  }
  const { icon: Icon, color, bg } = map[type] || map.data
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
      <Icon size={18} style={{ color }} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
    success: { bg: 'var(--color-success-subtle)', color: 'var(--color-success)', icon: CheckCircle2, label: 'Success' },
    failed:  { bg: 'var(--color-error-subtle)',   color: 'var(--color-error)',   icon: XCircle,      label: 'Failed'  },
    pending: { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)', icon: Clock,        label: 'Pending' },
  }
  const { bg, color, icon: Icon, label } = styles[status] || styles.pending
  return (
    <span className="badge flex items-center gap-1" style={{ background: bg, color, fontSize: '0.7rem' }}>
      <Icon size={10} />
      {label}
    </span>
  )
}

// ─── Dashboard ────────────────────────────────────────────────
export default function DashboardPage() {
  const { isDark, toggleTheme } = useTheme()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [smartBuyBudget, setSmartBuyBudget] = useState('1000')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className="fixed top-0 left-0 bottom-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0"
        style={{
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <span className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {brandConfig.app.logoText}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map(item => {
            const active = window.location.pathname === item.href
            return (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: active ? 'var(--color-primary-muted)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}

          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            {[
              { icon: Gift,     label: 'Gift Data',     href: '/gift-data' },
              { icon: Calendar, label: 'Autopilot',     href: '/autopilot' },
              { icon: BarChart3,label: 'Analytics',     href: '/analytics' },
              { icon: Sparkles, label: 'Smart Buy',     href: '/smart-buy' },
            ].map(item => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm"
                style={{
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom: user + logout */}
        <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-elevated)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-700 shrink-0"
                 style={{ background: 'var(--color-primary)', fontWeight: 700 }}>
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm font-700 truncate" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Musa Ibrahim
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>musa@example.com</p>
            </div>
            <Link to="/login" className="shrink-0" style={{ color: 'var(--color-text-muted)' }}>
              <LogOut size={15} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '0' }}>
        {/* We use padding-left on desktop to offset sidebar */}
        <div className="lg:pl-64 flex-1 flex flex-col">
          {/* Top Bar */}
          <header
            className="sticky top-0 z-20 px-4 sm:px-6 py-4 flex items-center justify-between gap-4"
            style={{
              background: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="font-heading text-base md:text-lg font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {greeting()}, Musa 👋
                </p>
                <p className="text-xs hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                <Search size={16} />
              </button>
              {/* Notifications */}
              <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}>
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--color-error)' }} />
              </button>
              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          {/* Page Body */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6">
            {/* Wallet Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-primary-gradient rounded-3xl p-6 md:p-8 relative overflow-hidden"
              style={{ borderRadius: 'var(--radius-2xl)' }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>

              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-white/70 text-sm">Main wallet</p>
                    <button
                      onClick={() => setBalanceVisible(v => !v)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      {balanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                  <p className="font-heading text-4xl md:text-5xl text-white mb-1" style={{ fontWeight: 800 }}>
                    {balanceVisible ? formatNaira(MOCK_BALANCE) : '₦ ••••••'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="badge text-xs" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      🎁 Bonus: {balanceVisible ? formatNaira(MOCK_BONUS) : '₦ ••••'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link to="/wallet/fund" className="btn btn-sm" style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 700 }}>
                    <Plus size={16} /> Fund Wallet
                  </Link>
                  <Link to="/transactions" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <History size={16} /> History
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Quick Actions</h2>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3">
                {quickActions.map(action => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="col-span-1 md:col-span-2 flex flex-col items-center gap-2 p-3 rounded-2xl card group transition-all"
                    style={{ textDecoration: 'none', borderRadius: 'var(--radius-lg)' }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: action.bg }}
                    >
                      <action.icon size={19} style={{ color: action.color }} />
                    </div>
                    <span className="text-xs text-center leading-tight" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Smart Buy + Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Smart Buy */}
              <div className="lg:col-span-2">
                <div className="card p-5 h-full" style={{ borderRadius: 'var(--radius-xl)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-muted)' }}>
                      <Sparkles size={15} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Smart Buy</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Best deal for your budget</p>
                    </div>
                  </div>

                  {/* Budget input */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-heading font-700 text-sm" style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>₦</span>
                      <input
                        type="number"
                        value={smartBuyBudget}
                        onChange={e => setSmartBuyBudget(e.target.value)}
                        className="input pl-8 py-2.5 text-sm"
                        placeholder="1000"
                        min={100}
                      />
                    </div>
                    <button className="btn btn-primary btn-sm shrink-0">Find</button>
                  </div>

                  {/* Results */}
                  <div className="flex flex-col gap-2">
                    {smartBuyResults.map((r, i) => (
                      <motion.div
                        key={r.network}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'var(--color-surface-elevated)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{r.rank}</span>
                          <div>
                            <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {r.network} — {r.plan}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.validity} · ₦{r.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {i === 0 && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Best</span>}
                          <button className="text-xs font-600 hover:underline" style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                            Buy
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <Link to="/smart-buy" className="mt-4 flex items-center gap-1 text-xs font-600" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                    Full Smart Buy <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="lg:col-span-3">
                <div className="card p-5 h-full" style={{ borderRadius: 'var(--radius-xl)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent Transactions</h3>
                    <Link to="/transactions" className="text-xs font-600 flex items-center gap-1" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                      See all <ChevronRight size={13} />
                    </Link>
                  </div>

                  <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
                    {recentTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center gap-3 py-3">
                        <TxIcon type={tx.type} />
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-sm font-600 truncate" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {tx.label}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {tx.phone || 'Wallet'} · {tx.time}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className="font-heading text-sm font-700"
                            style={{
                              fontWeight: 700,
                              color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-text-primary)',
                            }}
                          >
                            {tx.amount > 0 ? '+' : ''}{formatNaira(Math.abs(tx.amount))}
                          </span>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Unique Features Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Calendar,
                  title: 'Data Autopilot',
                  sub: '1 schedule active',
                  desc: 'Next: Airtel 2GB — Monday 7:00 AM',
                  color: 'var(--color-secondary)',
                  bg: 'var(--color-secondary-muted)',
                  href: '/autopilot',
                },
                {
                  icon: Gift,
                  title: 'Gift Data',
                  sub: '2 codes sent this month',
                  desc: 'Share data with anyone — they redeem it their way.',
                  color: '#7C3AED',
                  bg: 'rgba(124,58,237,0.10)',
                  href: '/gift-data',
                },
                {
                  icon: TrendingUp,
                  title: 'Spending Analytics',
                  sub: 'July 2026',
                  desc: 'You\'ve spent ₦16,700 this month. View breakdown.',
                  color: 'var(--color-accent-dark)',
                  bg: 'var(--color-accent-subtle)',
                  href: '/analytics',
                },
              ].map(card => (
                <Link
                  key={card.title}
                  to={card.href}
                  className="card p-5 flex flex-col gap-3 group"
                  style={{ borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                      <card.icon size={17} style={{ color: card.color }} />
                    </div>
                    <ArrowUpRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-700 mb-0.5" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{card.title}</p>
                    <p className="text-xs font-600 mb-1" style={{ color: card.color, fontWeight: 600 }}>{card.sub}</p>
                    <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
