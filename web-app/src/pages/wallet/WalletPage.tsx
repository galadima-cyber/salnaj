import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, Plus, Eye, EyeOff, ArrowUpRight,
  ArrowDownLeft, Loader2, AlertCircle, ExternalLink,
} from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { walletApi, Transaction } from '@/services/endpoints'
import { useAuthStore } from '@/store/auth.store'
import { getErrorMessage } from '@/services/api'
import { formatNaira }  from '@/utils'

const FUND_PRESETS = [500, 1000, 2000, 5000, 10000, 20000]

const TX_TYPE_LABELS: Record<string, string> = {
  DATA: 'Data Purchase', AIRTIME: 'Airtime', ELECTRICITY: 'Electricity',
  CABLE_TV: 'Cable TV', EDUCATION: 'Education', BETTING: 'Betting Wallet',
  WALLET_FUND: 'Wallet Funded', REFERRAL_BONUS: 'Referral Bonus',
  BULK_SMS: 'Bulk SMS', RECHARGE_CARD: 'Recharge Cards',
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const map = {
    success:  { bg: 'var(--color-success-subtle)', color: 'var(--color-success)',  label: 'Success'  },
    failed:   { bg: 'var(--color-error-subtle)',   color: 'var(--color-error)',    label: 'Failed'   },
    pending:  { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)',  label: 'Pending'  },
    reversed: { bg: 'var(--color-info-subtle)',    color: 'var(--color-info)',     label: 'Reversed' },
  }
  const style = map[s as keyof typeof map] || map.pending
  return (
    <span className="badge text-xs" style={{ background: style.bg, color: style.color, fontSize: '0.68rem' }}>
      {style.label}
    </span>
  )
}

export default function WalletPage() {
  const { balance, fetchBalance } = useAuthStore()

  const [balanceVisible, setBalanceVisible] = useState(true)
  const [fundAmount,     setFundAmount]     = useState('')
  const [funding,        setFunding]        = useState(false)
  const [fundError,      setFundError]      = useState('')
  const [transactions,   setTransactions]   = useState<Transaction[]>([])
  const [txLoading,      setTxLoading]      = useState(true)
  const [txError,        setTxError]        = useState('')
  const [page,           setPage]           = useState(1)
  const [totalPages,     setTotalPages]     = useState(1)
  const [filterStatus,   setFilterStatus]   = useState('all')

  useEffect(() => { fetchBalance() }, [])

  useEffect(() => {
    const load = async () => {
      setTxLoading(true); setTxError('')
      try {
        const res = await walletApi.getHistory(page, 15)
        setTransactions(res.data.data || [])
        const meta = res.data.meta as Record<string, number>
        setTotalPages(meta?.totalPages || 1)
      } catch (e) { setTxError(getErrorMessage(e)) }
      finally { setTxLoading(false) }
    }
    load()
  }, [page])

  const handleFund = async () => {
    const amt = parseFloat(fundAmount)
    if (!amt || amt < 100) { setFundError('Minimum funding is ₦100'); return }
    if (amt > 500_000)     { setFundError('Maximum funding is ₦500,000 per transaction'); return }
    setFunding(true); setFundError('')
    try {
      const res = await walletApi.initiateFunding(amt)
      // Redirect to Paystack checkout
      window.location.href = res.data.data.authorizationUrl
    } catch (e) {
      setFundError(getErrorMessage(e))
      setFunding(false)
    }
  }

  const filteredTx = filterStatus === 'all'
    ? transactions
    : transactions.filter(t => t.status.toLowerCase() === filterStatus)

  return (
    <DashLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Wallet balance card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-primary-gradient rounded-3xl p-7 relative overflow-hidden"
          style={{ borderRadius: 'var(--radius-2xl)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} color="rgba(255,255,255,0.7)" />
                <p className="text-white/70 text-sm">Main Balance</p>
                <button onClick={() => setBalanceVisible(v => !v)} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {balanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              <p className="font-heading text-4xl text-white mb-1" style={{ fontWeight: 800 }}>
                {balanceVisible ? (balance ? formatNaira(balance.main) : '---') : '₦ ••••••'}
              </p>
              {balance && balance.bonus > 0 && (
                <span className="badge text-xs" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  🎁 Bonus: {balanceVisible ? formatNaira(balance.bonus) : '₦ ••••'}
                </span>
              )}
            </div>

            {/* Quick fund form */}
            <div className="flex flex-col gap-3 md:w-72">
              <div className="flex gap-2 flex-wrap">
                {FUND_PRESETS.slice(0, 4).map(p => (
                  <button key={p} onClick={() => setFundAmount(String(p))}
                    className="px-3 py-1.5 rounded-full text-xs font-700 transition-all"
                    style={{
                      fontWeight: 700, fontFamily: 'var(--font-heading)',
                      background:  fundAmount === String(p) ? 'white' : 'rgba(255,255,255,0.15)',
                      color:       fundAmount === String(p) ? 'var(--color-primary)' : 'white',
                      border: 'none', cursor: 'pointer',
                    }}>
                    ₦{p.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 font-700" style={{ fontWeight: 700 }}>₦</span>
                  <input
                    type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                    className="input pl-8 py-2.5 text-sm text-white placeholder-white/40"
                    style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)' }}
                    placeholder="Enter amount" min={100}
                  />
                </div>
                <button onClick={handleFund} disabled={funding}
                  className="btn btn-sm shrink-0"
                  style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 700 }}>
                  {funding ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Fund</>}
                </button>
              </div>
              {fundError && <p className="text-xs text-white/80">{fundError}</p>}
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        {balance && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Main Balance',  value: formatNaira(balance.main),                      color: 'var(--color-primary)'    },
              { label: 'Bonus Balance', value: formatNaira(balance.bonus),                     color: 'var(--color-accent-dark)' },
              { label: 'Total',         value: formatNaira(balance.main + balance.bonus),       color: 'var(--color-secondary)'  },
            ].map(s => (
              <div key={s.label} className="card p-4 flex flex-col gap-1" style={{ borderRadius: 'var(--radius-xl)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                <p className="font-heading text-lg font-800" style={{ fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Transaction history */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {/* Header + filter */}
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Transaction History
            </h2>
          </div>

          {/* Status filters */}
          <div className="flex gap-2 px-5 pt-4 pb-3 overflow-x-auto">
            {['all', 'success', 'pending', 'failed'].map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className="px-4 py-1.5 rounded-full text-xs font-700 capitalize shrink-0 transition-all"
                style={{
                  fontWeight: 700, fontFamily: 'var(--font-heading)',
                  background:  filterStatus === f ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                  color:       filterStatus === f ? 'white' : 'var(--color-text-secondary)',
                  border: 'none', cursor: 'pointer',
                }}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {txLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : txError ? (
              <div className="flex items-center gap-3 m-5 p-4 rounded-xl" style={{ background: 'var(--color-error-subtle)' }}>
                <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{txError}</p>
              </div>
            ) : filteredTx.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>No transactions yet</p>
            ) : filteredTx.map(tx => {
              const isCredit = tx.type === 'WALLET_FUND' || tx.type === 'REFERRAL_BONUS'
              return (
                <motion.div key={tx.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-4 px-5 py-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: isCredit ? 'var(--color-success-subtle)' : 'var(--color-primary-muted)' }}>
                    {isCredit
                      ? <ArrowDownLeft size={18} style={{ color: 'var(--color-success)' }} />
                      : <ArrowUpRight  size={18} style={{ color: 'var(--color-primary)' }} />
                    }
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-700 truncate" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {TX_TYPE_LABELS[tx.type] || tx.type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {tx.phone || tx.reference}
                      </p>
                      <StatusBadge status={tx.status} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Amount */}
                  <p className="font-heading text-base font-800 shrink-0"
                     style={{ fontWeight: 800, color: isCredit ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                    {isCredit ? '+' : '-'}{formatNaira(Number(tx.amount))}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn btn-ghost btn-sm" style={{ opacity: page === 1 ? 0.4 : 1 }}>
                ← Previous
              </button>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn btn-ghost btn-sm" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Security note */}
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Wallet funding is secured by Paystack. Your card details are never stored on Salnaj. <ExternalLink size={10} className="inline" />
        </p>
      </div>
    </DashLayout>
  )
}
