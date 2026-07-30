import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wifi, Phone, Bolt, Tv, GraduationCap, Wallet,
  RefreshCw, Target, MessageSquare, CreditCard, Users, Code2,
  Plus, Eye, EyeOff, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, XCircle, Clock, TrendingUp, Calendar,
  Gift, BarChart3, ChevronRight, Sparkles, Search, Loader2,
} from 'lucide-react'
import { DashLayout }  from '@/components/layout/DashLayout'
import { useAuth }     from '@/context/AuthContext'
import { txApi, dataApi, Transaction, SmartBuyResult } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { formatNaira }  from '@/utils'

const QUICK_ACTIONS = [
  { icon: Wifi,          label: 'Buy Data',        href: '/buy-data',      color: 'var(--color-primary)',    bg: 'var(--color-primary-muted)'   },
  { icon: Phone,         label: 'Buy Airtime',     href: '/buy-airtime',   color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
  { icon: Bolt,          label: 'Electricity',     href: '/electricity',   color: '#7C3AED',                  bg: 'rgba(124,58,237,0.10)'        },
  { icon: Tv,            label: 'Cable TV',        href: '/cable-tv',      color: '#DB2777',                  bg: 'rgba(219,39,119,0.10)'        },
  { icon: GraduationCap, label: 'Education',       href: '/education',     color: 'var(--color-accent-dark)', bg: 'var(--color-accent-subtle)'   },
  { icon: RefreshCw,     label: 'Airtime→Cash',    href: '/airtime-cash',  color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
  { icon: Target,        label: 'Betting',         href: '/betting',       color: '#DC2626',                  bg: 'rgba(220,38,38,0.10)'         },
  { icon: MessageSquare, label: 'Bulk SMS',        href: '/bulk-sms',      color: 'var(--color-primary)',    bg: 'var(--color-primary-muted)'   },
  { icon: CreditCard,    label: 'Recharge Cards',  href: '/recharge-cards',color: '#7C3AED',                 bg: 'rgba(124,58,237,0.10)'        },
  { icon: Users,         label: 'Referrals',       href: '/referrals',     color: 'var(--color-accent-dark)',bg: 'var(--color-accent-subtle)'   },
  { icon: Code2,         label: 'API Access',      href: '/api-access',    color: '#0891B2',                  bg: 'rgba(8,145,178,0.10)'         },
  { icon: Wallet,        label: 'Fund Wallet',     href: '/wallet',        color: 'var(--color-secondary)',  bg: 'var(--color-secondary-muted)' },
]

const TX_TYPE_LABELS: Record<string, string> = {
  DATA: 'Data', AIRTIME: 'Airtime', ELECTRICITY: 'Electricity',
  CABLE_TV: 'Cable TV', EDUCATION: 'Education', BETTING: 'Betting',
  WALLET_FUND: 'Wallet Funded', REFERRAL_BONUS: 'Referral Bonus',
  BULK_SMS: 'Bulk SMS', RECHARGE_CARD: 'Recharge Cards',
}

function TxRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'WALLET_FUND' || tx.type === 'REFERRAL_BONUS'
  const statusIcon = tx.status === 'SUCCESS'
    ? <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
    : tx.status === 'FAILED'
    ? <XCircle size={12} style={{ color: 'var(--color-error)' }} />
    : <Clock size={12} style={{ color: 'var(--color-warning)' }} />

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: isCredit ? 'var(--color-success-subtle)' : 'var(--color-primary-muted)' }}>
        {isCredit
          ? <ArrowDownLeft size={17} style={{ color: 'var(--color-success)' }} />
          : <ArrowUpRight  size={17} style={{ color: 'var(--color-primary)' }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm font-700 truncate"
           style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {TX_TYPE_LABELS[tx.type] || tx.type}
          {tx.planName ? ` — ${tx.planName}` : ''}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {statusIcon}
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <p className="font-heading text-sm font-800 shrink-0"
         style={{ fontWeight: 800, color: isCredit ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
        {isCredit ? '+' : '-'}{formatNaira(Number(tx.amount))}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, balance, refreshBalance } = useAuth()

  const [balanceVisible, setBalanceVisible] = useState(true)
  const [transactions,   setTransactions]   = useState<Transaction[]>([])
  const [txLoading,      setTxLoading]      = useState(true)
  const [smartBudget,    setSmartBudget]    = useState('1000')
  const [smartResults,   setSmartResults]   = useState<SmartBuyResult[]>([])
  const [smartInsight,   setSmartInsight]   = useState('')
  const [smartLoading,   setSmartLoading]   = useState(false)
  const [smartError,     setSmartError]     = useState('')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Load recent transactions
  useEffect(() => {
    const load = async () => {
      setTxLoading(true)
      try {
        const res = await txApi.getAll({ limit: 6 })
        setTransactions(res.data.data || [])
      } catch { /* silent on dashboard */ }
      finally { setTxLoading(false) }
    }
    load()
    // Default smart buy on mount
    handleSmartBuy('1000')
  }, [])

  const handleSmartBuy = async (budget = smartBudget) => {
    const b = parseFloat(budget)
    if (!b || b < 100) return
    setSmartLoading(true); setSmartError('')
    try {
      const res = await dataApi.smartBuy(b)
      setSmartResults(res.data.data.results || [])
      setSmartInsight(res.data.data.insight || '')
    } catch (e) {
      setSmartError(getErrorMessage(e))
    } finally { setSmartLoading(false) }
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User'

  return (
    <DashLayout>
      <div className="flex flex-col gap-6 max-w-6xl">

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-primary-gradient rounded-3xl p-6 md:p-8 relative overflow-hidden"
          style={{ borderRadius: 'var(--radius-2xl)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-white/70 text-sm mb-1">
                {greeting()}, <strong className="text-white">{firstName}</strong> 👋
              </p>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white/70 text-sm">Wallet Balance</p>
                <button
                  onClick={() => setBalanceVisible(v => !v)}
                  style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {balanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              <p className="font-heading text-4xl md:text-5xl text-white mb-1" style={{ fontWeight: 800 }}>
                {balanceVisible
                  ? (balance ? formatNaira(balance.main) : '₦ ---')
                  : '₦ ••••••'
                }
              </p>
              {balance && balance.bonus > 0 && (
                <span className="badge text-xs"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  🎁 Bonus: {balanceVisible ? formatNaira(balance.bonus) : '₦ ••••'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/wallet" className="btn btn-sm"
                    style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 700 }}>
                <Plus size={16} /> Fund Wallet
              </Link>
              <Link to="/transactions"
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                View History
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div>
          <p className="font-heading text-base font-700 mb-4"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Quick Actions</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3">
            {QUICK_ACTIONS.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="col-span-1 md:col-span-2">
                <Link
                  to={a.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl card group transition-all"
                  style={{ textDecoration: 'none', borderRadius: 'var(--radius-lg)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                       style={{ background: a.bg }}>
                    <a.icon size={19} style={{ color: a.color }} />
                  </div>
                  <span className="text-xs text-center leading-tight"
                        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {a.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Smart Buy + Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Smart Buy */}
          <div className="lg:col-span-2">
            <div className="card p-5 h-full flex flex-col" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'var(--color-primary-muted)' }}>
                  <Sparkles size={15} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-700"
                      style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Smart Buy</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Best deal for your budget</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-700"
                        style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>₦</span>
                  <input
                    type="number" value={smartBudget}
                    onChange={e => setSmartBudget(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSmartBuy()}
                    className="input pl-8 py-2.5 text-sm"
                    placeholder="Enter budget" min={100}
                  />
                </div>
                <button onClick={() => handleSmartBuy()} disabled={smartLoading}
                        className="btn btn-primary btn-sm shrink-0">
                  {smartLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </button>
              </div>

              {smartError && (
                <p className="text-xs mb-3" style={{ color: 'var(--color-error)' }}>{smartError}</p>
              )}

              {smartInsight && (
                <p className="text-xs mb-3 p-2 rounded-lg"
                   style={{ color: 'var(--color-secondary)', background: 'var(--color-secondary-subtle)' }}>
                  💡 {smartInsight}
                </p>
              )}

              <div className="flex flex-col gap-2 flex-1">
                {smartLoading ? (
                  <div className="flex-1 flex items-center justify-center py-6">
                    <Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  </div>
                ) : smartResults.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-6">
                    <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                      Enter a budget to see the best deals
                    </p>
                  </div>
                ) : smartResults.map((r, i) => (
                  <motion.div
                    key={r.planId}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--color-surface-elevated)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{'🥇🥈🥉🏅🏅'[i]}</span>
                      <div>
                        <p className="font-heading text-sm font-700"
                           style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {r.network} — {r.sizeLabel}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {r.validityDays} days · {formatNaira(r.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {i === 0 && (
                        <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Best</span>
                      )}
                      <Link to="/buy-data" className="text-xs font-600"
                            style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Buy</Link>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link to="/buy-data?tab=smart"
                    className="mt-4 flex items-center gap-1 text-xs font-600"
                    style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Full Smart Buy <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-3">
            <div className="card p-5 h-full" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-700"
                    style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Recent Transactions
                </h3>
                <Link to="/transactions"
                      className="text-xs font-600 flex items-center gap-1"
                      style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  See all <ChevronRight size={13} />
                </Link>
              </div>

              {txLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                       style={{ background: 'var(--color-surface-elevated)' }}>
                    <Wallet size={22} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <p className="font-heading text-sm font-700"
                     style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    No transactions yet
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Fund your wallet and make your first purchase
                  </p>
                  <Link to="/wallet" className="btn btn-primary btn-sm">
                    <Plus size={15} /> Fund Wallet
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                  {transactions.map(tx => (
                    <TxRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Calendar, href: '/autopilot',
              title: 'Data Autopilot',
              sub:   'Auto-buy on schedule',
              desc:  'Never run out of data — set a schedule and Salnaj buys it for you automatically.',
              color: 'var(--color-secondary)', bg: 'var(--color-secondary-muted)',
            },
            {
              icon: Gift, href: '/gift-data',
              title: 'Gift Data',
              sub:   'Share data as a gift',
              desc:  'Buy data and generate a shareable code — the recipient redeems it instantly.',
              color: '#7C3AED', bg: 'rgba(124,58,237,0.10)',
            },
            {
              icon: TrendingUp, href: '/analytics',
              title: 'Spending Analytics',
              sub:   'See where your money goes',
              desc:  'Monthly charts and AI insights showing your top services and savings opportunities.',
              color: 'var(--color-accent-dark)', bg: 'var(--color-accent-subtle)',
            },
          ].map(card => (
            <Link
              key={card.title} to={card.href}
              className="card p-5 flex flex-col gap-3 group"
              style={{ borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: card.bg }}>
                  <card.icon size={17} style={{ color: card.color }} />
                </div>
                <ArrowUpRight size={15}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: card.color }} />
              </div>
              <div>
                <p className="font-heading text-sm font-700 mb-0.5"
                   style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {card.title}
                </p>
                <p className="text-xs font-600 mb-1"
                   style={{ color: card.color, fontWeight: 600 }}>
                  {card.sub}
                </p>
                <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashLayout>
  )
}
