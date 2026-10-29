import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Home, Wifi, Phone, Bolt, Tv, GraduationCap, Wallet,
  RefreshCw, MessageSquare, CreditCard, Users, Code2,
  Gift, Calendar, BarChart3, History, Settings, LogOut,
  Bell, Menu, X, ChevronRight, Sparkles, Moon, Sun,
} from 'lucide-react'
import { brandConfig } from '@/config/brand.config'
import { useAuth }     from '@/context/AuthContext'
import { useTheme }    from '@/hooks/useTheme'
import { formatNaira } from '@/utils'
import { NotificationDrawer } from '@/components/ui/NotificationDrawer'
import { notificationApi } from '@/services/endpoints'

const navSections = [
  {
    label: 'Main',
    items: [
      { icon: Home,     label: 'Dashboard',    href: '/dashboard'   },
      { icon: History,  label: 'Transactions', href: '/transactions' },
      { icon: Wallet,   label: 'Wallet',       href: '/wallet'      },
    ],
  },
  {
    label: 'Services',
    items: [
      { icon: Wifi,          label: 'Buy Data',        href: '/buy-data'     },
      { icon: Phone,         label: 'Buy Airtime',     href: '/buy-airtime'  },
      { icon: Bolt,          label: 'Electricity',     href: '/electricity'  },
      { icon: Tv,            label: 'Cable TV',        href: '/cable-tv'     },
      { icon: GraduationCap, label: 'Education',       href: '/education'    },
      { icon: RefreshCw,     label: 'Airtime to Cash', href: '/airtime-cash' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { icon: Sparkles,      label: 'Smart Buy',      href: '/smart-buy'       },
      { icon: Calendar,      label: 'Autopilot',      href: '/autopilot'       },
      { icon: Gift,          label: 'Gift Data',      href: '/gift-data'       },
      { icon: BarChart3,     label: 'Analytics',      href: '/analytics'       },
      { icon: MessageSquare, label: 'Bulk SMS',       href: '/bulk-sms'        },
      { icon: CreditCard,    label: 'Recharge Cards', href: '/recharge-cards'  },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: Users,    label: 'Referrals',  href: '/referrals' },
      { icon: Code2,    label: 'API Access', href: '/settings?tab=api' },
      { icon: Settings, label: 'Settings',   href: '/settings'  },
    ],
  },
]

interface DashLayoutProps { children: React.ReactNode }

export function DashLayout({ children }: DashLayoutProps) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, balance, logout, refreshBalance } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread count
  useEffect(() => {
    refreshBalance()
    notificationApi.getAll(1, 1).then(res => {
      if (res.data.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.data.unreadCount)
      }
    }).catch(() => {})
  }, [location.pathname])

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const firstLetter = user?.fullName?.[0]?.toUpperCase() || 'U'
  const firstName   = user?.fullName?.split(' ')[0] || 'User'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between shrink-0"
           style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'var(--color-primary)' }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <span className="font-heading text-lg" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {brandConfig.app.logoText}
          </span>
        </Link>
        <button className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
                style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Wallet mini-card */}
      <div className="mx-4 mt-4 p-4 rounded-2xl shrink-0"
           style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}>
        <p className="text-white/70 text-xs mb-1">
          {firstName}'s Wallet
        </p>
        <p className="text-white font-heading text-xl" style={{ fontWeight: 800 }}>
          {balance ? formatNaira(balance.main) : '₦ ---'}
        </p>
        {balance && balance.referral > 0 && (
          <p className="text-white/80 text-xs mt-0.5">
            + {formatNaira(balance.referral)} referral
          </p>
        )}
        <Link
          to="/wallet"
          className="mt-3 inline-flex items-center gap-1 text-white/90 text-xs font-600 hover:text-white transition-colors"
          style={{ fontWeight: 600 }}>
          Fund wallet <ChevronRight size={12} />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {navSections.map(section => (
          <div key={section.label}>
            <p className="text-xs font-700 mb-2 px-3"
               style={{ fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.68rem' }}>
              {section.label}
            </p>
            {section.items.map(item => {
              const active = location.pathname === item.href || (item.href.includes('?') && location.pathname + location.search === item.href)
              return (
                <Link key={item.label} to={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all"
                  style={{
                    background:     active ? 'var(--color-primary-muted)' : 'transparent',
                    color:          active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontFamily:     'var(--font-heading)',
                    fontWeight:     active ? 700 : 500,
                    fontSize:       '0.9rem',
                    textDecoration: 'none',
                  }}>
                  <item.icon size={17} />
                  {item.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full"
                         style={{ background: 'var(--color-primary)' }} />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3 p-3 rounded-xl"
             style={{ background: 'var(--color-surface-elevated)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-700 shrink-0"
               style={{ background: 'var(--color-primary)', fontWeight: 700 }}>
            {firstLetter}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-sm font-700 truncate"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {user?.fullName || 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 bottom-0 z-30"
        style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 lg:hidden"
              style={{ background: 'var(--color-surface)' }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 px-4 sm:px-6 h-16 flex items-center justify-between gap-4"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', backdropFilter: 'blur(12px)' }}>
          <button
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer' }}
            onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>

          <p className="font-heading font-700 text-base hidden sm:block"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {navSections.flatMap(s => s.items).find(i => i.href === location.pathname)?.label || 'Dashboard'}
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notification Bell with Dynamic Unread Badge */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}>
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-800 text-white animate-pulse"
                  style={{ background: 'var(--color-error)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <Link to="/settings">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-700"
                   style={{ background: 'var(--color-primary)', fontWeight: 700 }}>
                {firstLetter}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex-1 p-4 sm:p-6">
          {children}
        </motion.main>
      </div>

      {/* ── Mobile Bottom Navigation Bar (Standard Mobile Experience) ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-around px-2 shadow-lg"
        style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', backdropFilter: 'blur(16px)' }}
      >
        <Link
          to="/dashboard"
          className="flex flex-col items-center gap-1 py-1 px-3 text-xs font-600 transition-all"
          style={{ color: location.pathname === '/dashboard' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <Home size={19} />
          <span>Home</span>
        </Link>
        <Link
          to="/buy-data"
          className="flex flex-col items-center gap-1 py-1 px-3 text-xs font-600 transition-all"
          style={{ color: location.pathname === '/buy-data' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <Wifi size={19} />
          <span>Services</span>
        </Link>
        <Link
          to="/wallet"
          className="flex flex-col items-center gap-1 py-1 px-3 text-xs font-600 transition-all"
          style={{ color: location.pathname === '/wallet' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <Wallet size={19} />
          <span>Wallet</span>
        </Link>
        <button
          onClick={() => setNotifOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 text-xs font-600 transition-all relative"
          style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-4 w-2 h-2 rounded-full"
              style={{ background: 'var(--color-error)' }}
            />
          )}
          <span>Alerts</span>
        </button>
        <Link
          to="/settings"
          className="flex flex-col items-center gap-1 py-1 px-3 text-xs font-600 transition-all"
          style={{ color: location.pathname === '/settings' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <Settings size={19} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={count => setUnreadCount(count)}
      />
    </div>
  )
}
