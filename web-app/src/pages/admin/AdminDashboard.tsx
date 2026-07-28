import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Receipt, DollarSign,
  Settings, BarChart3, Shield, Bell, Search,
  TrendingUp, TrendingDown, Zap, Wifi, Phone,
  CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronRight, Ban, Eye, RefreshCw, Download,
  ToggleLeft, ToggleRight, Filter,
} from 'lucide-react'
import { useTheme }    from '@/hooks/useTheme'
import { brandConfig } from '@/config/brand.config'
import { formatNaira } from '@/utils'

// ─── Mock data ────────────────────────────────────────────────
const STATS = [
  { label: 'Total Revenue',   value: '₦2,847,500', change: +18.4, icon: DollarSign, color: 'var(--color-secondary)'  },
  { label: 'Transactions',    value: '14,382',      change: +23.1, icon: Receipt,    color: 'var(--color-primary)'    },
  { label: 'Active Users',    value: '3,294',       change: +9.7,  icon: Users,      color: '#7C3AED'                  },
  { label: 'Failed Txns',     value: '47',          change: -12.3, icon: XCircle,    color: 'var(--color-error)'      },
]

const RECENT_USERS = [
  { id: 'u1', name: 'Fatimah Abdullahi', email: 'fatimah@mail.com', phone: '0801234***', balance: 4250,  role: 'USER',  status: 'active',  joined: '2 hours ago'  },
  { id: 'u2', name: 'Emeka Okafor',      email: 'emeka@mail.com',   phone: '0812345***', balance: 12800, role: 'AGENT', status: 'active',  joined: '5 hours ago'  },
  { id: 'u3', name: 'Rashida Musa',      email: 'rashida@mail.com', phone: '0901234***', balance: 750,   role: 'USER',  status: 'blocked', joined: '1 day ago'    },
  { id: 'u4', name: 'Chukwudi Eze',      email: 'chukwudi@mail.com',phone: '0803456***', balance: 6400,  role: 'USER',  status: 'active',  joined: '2 days ago'   },
]

const RECENT_TRANSACTIONS = [
  { ref: 'SNJ-DATA-1721900001', user: 'Fatimah A.', type: 'DATA',        amount: 580,   status: 'SUCCESS', time: '2m ago' },
  { ref: 'SNJ-ELEC-1721900002', user: 'Emeka O.',   type: 'ELECTRICITY', amount: 5000,  status: 'SUCCESS', time: '8m ago' },
  { ref: 'SNJ-DATA-1721900003', user: 'Ali M.',      type: 'DATA',        amount: 1450,  status: 'FAILED',  time: '15m ago'},
  { ref: 'SNJ-FUND-1721900004', user: 'Grace O.',    type: 'WALLET_FUND', amount: 20000, status: 'SUCCESS', time: '22m ago'},
  { ref: 'SNJ-AIR-1721900005',  user: 'Rashida M.',  type: 'AIRTIME',     amount: 200,   status: 'PENDING', time: '31m ago'},
]

const SERVICE_STATUS = [
  { name: 'MTN Data',    ok: true  },
  { name: 'Airtel Data', ok: true  },
  { name: 'Glo Data',    ok: false },
  { name: '9mobile',     ok: true  },
  { name: 'Electricity', ok: true  },
  { name: 'Cable TV',    ok: true  },
  { name: 'WAEC/NECO',   ok: true  },
  { name: 'Paystack',    ok: true  },
  { name: 'VTPass',      ok: true  },
]

const PRICING = [
  { network: 'MTN',      plan: 'MTN 1GB',    cost: 255, selling: 300, margin: 45  },
  { network: 'MTN',      plan: 'MTN 2GB',    cost: 510, selling: 580, margin: 70  },
  { network: 'AIRTEL',   plan: 'Airtel 1GB', cost: 240, selling: 280, margin: 40  },
  { network: 'AIRTEL',   plan: 'Airtel 6GB', cost: 1440,selling: 1650,margin: 210 },
  { network: 'GLO',      plan: 'Glo 2GB',    cost: 425, selling: 500, margin: 75  },
]

const AUDIT_LOG = [
  { who: 'Admin', action: 'Updated MTN 2GB price from ₦550 → ₦580', time: '1 hour ago'  },
  { who: 'Admin', action: 'Blocked user rashida@mail.com',            time: '3 hours ago' },
  { who: 'Admin', action: 'Manually credited ₦2,000 to emeka@mail.com', time: '5 hours ago'},
  { who: 'System', action: 'Auto-reversed failed transaction SNJ-DATA-1721900003', time: '6 hours ago'},
]

const NAV_SECTIONS = [
  { id: 'overview',  label: 'Overview',      icon: LayoutDashboard },
  { id: 'users',     label: 'Users',         icon: Users           },
  { id: 'txns',      label: 'Transactions',  icon: Receipt         },
  { id: 'pricing',   label: 'Pricing',       icon: DollarSign      },
  { id: 'services',  label: 'Services',      icon: Wifi            },
  { id: 'audit',     label: 'Audit Log',     icon: Shield          },
]

// ─── Sub-components ───────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase()
  const map: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--color-success-subtle)', color: 'var(--color-success)' },
    failed:  { bg: 'var(--color-error-subtle)',   color: 'var(--color-error)'   },
    pending: { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)' },
    active:  { bg: 'var(--color-success-subtle)', color: 'var(--color-success)' },
    blocked: { bg: 'var(--color-error-subtle)',   color: 'var(--color-error)'   },
  }
  const style = map[s] || map.pending
  return (
    <span className="badge text-xs capitalize" style={{ background: style.bg, color: style.color, fontSize: '0.68rem' }}>
      {status}
    </span>
  )
}

function StatCard({ stat }: { stat: typeof STATS[0] }) {
  const up = stat.change > 0
  return (
    <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: `${stat.color}18` }}>
          <stat.icon size={19} style={{ color: stat.color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-700`}
             style={{ fontWeight: 700, color: up ? 'var(--color-success)' : 'var(--color-error)' }}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(stat.change)}%
        </div>
      </div>
      <p className="font-heading text-2xl font-800 mb-0.5" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
        {stat.value}
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function AdminDashboard() {
  const { isDark, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('overview')
  const [userSearch,    setUserSearch]    = useState('')
  const [editingPrice,  setEditingPrice]  = useState<string | null>(null)
  const [prices,        setPrices]        = useState(PRICING)
  const [serviceStatus, setServiceStatus] = useState(SERVICE_STATUS)

  const filteredUsers = RECENT_USERS.filter(u =>
    !userSearch ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 fixed top-0 left-0 bottom-0 z-30"
             style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>
        <div className="p-5 flex items-center gap-2.5"
             style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'var(--color-primary)' }}>
            <Zap size={17} color="white" fill="white" />
          </div>
          <div>
            <p className="font-heading text-sm font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {brandConfig.app.logoText}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-error)', fontWeight: 700 }}>ADMIN</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {NAV_SECTIONS.map(sec => (
            <button key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all"
              style={{
                background:     activeSection === sec.id ? 'var(--color-primary-muted)' : 'transparent',
                color:          activeSection === sec.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontFamily:     'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem',
                border: 'none', cursor: 'pointer',
              }}>
              <sec.icon size={17} />
              {sec.label}
            </button>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 px-6 h-16 flex items-center justify-between"
                style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <p className="font-heading font-700 text-base" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {NAV_SECTIONS.find(s => s.id === activeSection)?.label}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}>
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--color-error)' }} />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-700"
                 style={{ background: 'var(--color-primary)', fontWeight: 700 }}>A</div>
          </div>
        </header>

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* ── Overview ─────────────────────────────────── */}
          {activeSection === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(s => <StatCard key={s.label} stat={s} />)}
              </div>

              {/* VTPass balance alert */}
              <div className="card p-4 flex items-center gap-3" style={{ borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--color-warning)' }}>
                <AlertCircle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                <p className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <strong style={{ color: 'var(--color-warning)' }}>VTPass wallet balance low:</strong>{' '}
                  ₦8,420 remaining. Consider topping up to avoid service disruption.
                </p>
                <button className="btn btn-sm shrink-0" style={{ background: 'var(--color-warning)', color: 'white', border: 'none' }}>
                  Top Up
                </button>
              </div>

              {/* Recent transactions + service status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transactions */}
                <div className="lg:col-span-2 card overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                  <div className="flex items-center justify-between p-5">
                    <p className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent Transactions</p>
                    <button onClick={() => setActiveSection('txns')}
                      className="text-xs font-600 flex items-center gap-1"
                      style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      View all <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {RECENT_TRANSACTIONS.map(tx => (
                      <div key={tx.ref} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-sm font-700 truncate"
                             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {tx.user} — {tx.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {tx.ref} · {tx.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="font-heading text-sm font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                            {formatNaira(tx.amount)}
                          </p>
                          <StatusPill status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service status */}
                <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
                  <p className="font-heading text-base font-700 mb-4"
                     style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Service Status</p>
                  <div className="flex flex-col gap-2.5">
                    {serviceStatus.map(s => (
                      <div key={s.name} className="flex items-center justify-between">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{s.name}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full"
                               style={{ background: s.ok ? 'var(--color-success)' : 'var(--color-error)' }} />
                          <p className="text-xs font-600"
                             style={{ fontWeight: 600, color: s.ok ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {s.ok ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Users ────────────────────────────────────── */}
          {activeSection === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    className="input pl-9 py-2.5 text-sm" placeholder="Search users..." />
                </div>
                <button className="btn btn-outline btn-sm">
                  <Filter size={14} /> Filter
                </button>
                <button className="btn btn-primary btn-sm">
                  <Download size={14} /> Export
                </button>
              </div>

              <div className="card overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-elevated)' }}>
                      {['User', 'Phone', 'Balance', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-700 whitespace-nowrap"
                            style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td className="px-5 py-4">
                          <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{u.email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{u.phone}</td>
                        <td className="px-5 py-4 font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                          {formatNaira(u.balance)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="badge badge-primary text-xs" style={{ fontSize: '0.65rem' }}>{u.role}</span>
                        </td>
                        <td className="px-5 py-4"><StatusPill status={u.status} /></td>
                        <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>{u.joined}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button title="View" className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer' }}>
                              <Eye size={13} />
                            </button>
                            <button title={u.status === 'blocked' ? 'Unblock' : 'Block'}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: u.status === 'blocked' ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)', color: u.status === 'blocked' ? 'var(--color-success)' : 'var(--color-error)', border: 'none', cursor: 'pointer' }}>
                              <Ban size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── Transactions ─────────────────────────────── */}
          {activeSection === 'txns' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input className="input pl-9 py-2.5 text-sm" placeholder="Search by reference..." />
                </div>
                {['All', 'Success', 'Failed', 'Pending'].map(f => (
                  <button key={f} className="btn btn-ghost btn-sm">{f}</button>
                ))}
                <button className="btn btn-primary btn-sm ml-auto">
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="card overflow-x-auto" style={{ borderRadius: 'var(--radius-xl)' }}>
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-elevated)' }}>
                      {['Reference', 'User', 'Type', 'Amount', 'Status', 'Time', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-700 whitespace-nowrap"
                            style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_TRANSACTIONS.map(tx => (
                      <tr key={tx.ref} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td className="px-5 py-4 font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                          {tx.ref.slice(-12)}
                        </td>
                        <td className="px-5 py-4 text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{tx.user}</td>
                        <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{tx.type}</td>
                        <td className="px-5 py-4 font-heading text-sm font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                          {formatNaira(tx.amount)}
                        </td>
                        <td className="px-5 py-4"><StatusPill status={tx.status} /></td>
                        <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>{tx.time}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button title="View" className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer' }}>
                              <Eye size={13} />
                            </button>
                            {tx.status === 'FAILED' && (
                              <button title="Retry" className="w-7 h-7 rounded-lg flex items-center justify-center"
                                      style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)', border: 'none', cursor: 'pointer' }}>
                                <RefreshCw size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── Pricing ──────────────────────────────────── */}
          {activeSection === 'pricing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Click on a selling price to edit it. Changes apply immediately to all purchases.
              </p>
              <div className="card overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-elevated)' }}>
                      {['Network', 'Plan', 'Cost (VTPass)', 'Selling Price', 'Margin', ''].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-700"
                            style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((p, i) => (
                      <tr key={p.plan} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td className="px-5 py-4">
                          <span className="badge badge-primary text-xs" style={{ fontSize: '0.65rem' }}>{p.network}</span>
                        </td>
                        <td className="px-5 py-4 font-heading text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.plan}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatNaira(p.cost)}</td>
                        <td className="px-5 py-4">
                          {editingPrice === p.plan ? (
                            <input
                              type="number"
                              defaultValue={p.selling}
                              className="input py-1.5 text-sm w-28"
                              autoFocus
                              onBlur={e => {
                                const val = parseFloat(e.target.value)
                                if (val > p.cost) {
                                  setPrices(pr => pr.map((item, idx) => idx === i ? { ...item, selling: val, margin: val - item.cost } : item))
                                }
                                setEditingPrice(null)
                              }}
                              onKeyDown={e => e.key === 'Escape' && setEditingPrice(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingPrice(p.plan)}
                              className="font-heading text-sm font-800 hover:underline"
                              style={{ fontWeight: 800, color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                              {formatNaira(p.selling)}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="badge badge-success text-xs" style={{ fontSize: '0.65rem' }}>+{formatNaira(p.margin)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => setEditingPrice(p.plan)}
                            className="text-xs font-600 hover:underline"
                            style={{ fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── Service Toggle ───────────────────────────── */}
          {activeSection === 'services' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Toggle services on/off in real-time. Disabled services show an "unavailable" message to users.
              </p>
              <div className="card overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                {serviceStatus.map((s, i) => (
                  <div key={s.name}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full"
                           style={{ background: s.ok ? 'var(--color-success)' : 'var(--color-error)' }} />
                      <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.name}</p>
                    </div>
                    <button
                      onClick={() => setServiceStatus(ss => ss.map((item, idx) => idx === i ? { ...item, ok: !item.ok } : item))}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-700 transition-all"
                      style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: s.ok ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)', color: s.ok ? 'var(--color-success)' : 'var(--color-error)', border: 'none', cursor: 'pointer' }}>
                      {s.ok ? <><ToggleRight size={14} /> Enabled</> : <><ToggleLeft size={14} /> Disabled</>}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Audit Log ────────────────────────────────── */}
          {activeSection === 'audit' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <div className="card overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <p className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Audit Trail
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Every admin action is logged immutably for compliance.
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {AUDIT_LOG.map((entry, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-4 px-5 py-4">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-700"
                           style={{ background: entry.who === 'System' ? 'var(--color-primary)' : '#7C3AED', fontWeight: 700 }}>
                        {entry.who[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          <strong style={{ fontWeight: 700 }}>{entry.who}</strong>: {entry.action}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{entry.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
