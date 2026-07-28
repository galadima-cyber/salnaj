import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  History, Search, Filter, ArrowUpRight, ArrowDownLeft,
  Loader2, AlertCircle, ChevronRight, X,
} from 'lucide-react'
import { DashLayout }  from '@/components/layout/DashLayout'
import { txApi, Transaction } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { formatNaira } from '@/utils'

const TX_TYPES = ['ALL', 'DATA', 'AIRTIME', 'ELECTRICITY', 'CABLE_TV', 'EDUCATION', 'BETTING', 'WALLET_FUND']
const TX_TYPE_LABELS: Record<string, string> = {
  DATA: 'Data', AIRTIME: 'Airtime', ELECTRICITY: 'Electricity',
  CABLE_TV: 'Cable TV', EDUCATION: 'Education', BETTING: 'Betting',
  WALLET_FUND: 'Wallet Fund', REFERRAL_BONUS: 'Referral',
  BULK_SMS: 'Bulk SMS', RECHARGE_CARD: 'Recharge Cards',
}

function TxDetailDrawer({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  if (!tx) return null
  const isCredit = tx.type === 'WALLET_FUND' || tx.type === 'REFERRAL_BONUS'
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Transaction Detail</h3>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Amount */}
        <div className="p-6 flex flex-col items-center gap-2" style={{ background: 'var(--color-surface-elevated)' }}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center`}
               style={{ background: isCredit ? 'var(--color-success-subtle)' : 'var(--color-primary-muted)' }}>
            {isCredit ? <ArrowDownLeft size={24} style={{ color: 'var(--color-success)' }} /> : <ArrowUpRight size={24} style={{ color: 'var(--color-primary)' }} />}
          </div>
          <p className="font-heading text-3xl font-800 mt-1" style={{ fontWeight: 800, color: isCredit ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
            {isCredit ? '+' : '-'}{formatNaira(Number(tx.amount))}
          </p>
          <span className="badge" style={{
            background: tx.status === 'SUCCESS' ? 'var(--color-success-subtle)' : tx.status === 'FAILED' ? 'var(--color-error-subtle)' : 'var(--color-warning-subtle)',
            color:      tx.status === 'SUCCESS' ? 'var(--color-success)'        : tx.status === 'FAILED' ? 'var(--color-error)'        : 'var(--color-warning)',
          }}>{tx.status}</span>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-0">
          {[
            { label: 'Service',     value: TX_TYPE_LABELS[tx.type] || tx.type },
            { label: 'Reference',   value: tx.reference },
            tx.network   && { label: 'Network',  value: tx.network },
            tx.phone     && { label: 'Phone',    value: tx.phone },
            tx.planName  && { label: 'Plan',     value: tx.planName },
            tx.providerToken && { label: 'Token / PIN', value: tx.providerToken },
            tx.failureReason && { label: 'Reason', value: tx.failureReason },
            { label: 'Date',   value: new Date(tx.createdAt).toLocaleString('en-NG') },
            tx.completedAt && { label: 'Completed', value: new Date(tx.completedAt).toLocaleString('en-NG') },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex items-start justify-between py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-sm shrink-0 mr-4" style={{ color: 'var(--color-text-muted)', minWidth: '90px' }}>{row.label}</p>
              <p className="text-sm font-600 text-right break-all" style={{ fontWeight: 600, color: row.label === 'Token / PIN' ? 'var(--color-secondary)' : 'var(--color-text-primary)', fontFamily: row.label === 'Reference' || row.label === 'Token / PIN' ? 'var(--font-mono)' : undefined }}>
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected,     setSelected]     = useState<Transaction | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('')
      try {
        const params: Record<string, any> = { page, limit: 20 }
        if (typeFilter !== 'ALL') params.type = typeFilter
        if (statusFilter !== 'all') params.status = statusFilter.toUpperCase()
        const res = await txApi.getAll(params)
        setTransactions(res.data.data || [])
        const meta = res.data.meta as Record<string, number>
        setTotalPages(meta?.totalPages || 1)
      } catch (e) { setError(getErrorMessage(e)) }
      finally { setLoading(false) }
    }
    load()
  }, [page, typeFilter, statusFilter])

  const filtered = search
    ? transactions.filter(t =>
        t.reference.toLowerCase().includes(search.toLowerCase()) ||
        (t.phone || '').includes(search) ||
        (t.planName || '').toLowerCase().includes(search.toLowerCase())
      )
    : transactions

  const isCredit = (t: Transaction) => t.type === 'WALLET_FUND' || t.type === 'REFERRAL_BONUS'

  return (
    <DashLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary-muted)' }}>
            <History size={21} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Transaction History</h1>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col gap-3" style={{ borderRadius: 'var(--radius-xl)' }}>
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9 py-2.5 text-sm" placeholder="Search by reference, phone, plan..." />
          </div>

          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TX_TYPES.map(t => (
              <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
                className="px-3 py-1.5 rounded-full text-xs font-700 whitespace-nowrap shrink-0 transition-all"
                style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: typeFilter === t ? 'var(--color-primary)' : 'var(--color-surface-elevated)', color: typeFilter === t ? 'white' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}>
                {t === 'ALL' ? 'All Types' : TX_TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {['all', 'success', 'pending', 'failed', 'reversed'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                className="px-3 py-1.5 rounded-full text-xs font-700 capitalize shrink-0 transition-all"
                style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: statusFilter === s ? 'var(--color-secondary)' : 'var(--color-surface-elevated)', color: statusFilter === s ? 'white' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Transaction list */}
        <div className="card overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={26} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 m-5 p-4 rounded-xl" style={{ background: 'var(--color-error-subtle)' }}>
              <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14">
              <History size={40} style={{ color: 'var(--color-border-strong)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No transactions found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
              {filtered.map((tx, i) => (
                <motion.button
                  key={tx.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(tx)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-elevated)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: isCredit(tx) ? 'var(--color-success-subtle)' : 'var(--color-primary-muted)' }}>
                    {isCredit(tx)
                      ? <ArrowDownLeft size={17} style={{ color: 'var(--color-success)' }} />
                      : <ArrowUpRight  size={17} style={{ color: 'var(--color-primary)' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-700 truncate" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {TX_TYPE_LABELS[tx.type] || tx.type}
                      {tx.planName && ` — ${tx.planName}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="badge text-xs" style={{
                        background: tx.status === 'SUCCESS' ? 'var(--color-success-subtle)' : tx.status === 'FAILED' ? 'var(--color-error-subtle)' : 'var(--color-warning-subtle)',
                        color:      tx.status === 'SUCCESS' ? 'var(--color-success)'        : tx.status === 'FAILED' ? 'var(--color-error)'        : 'var(--color-warning)',
                        fontSize: '0.65rem',
                      }}>{tx.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-heading text-sm font-800" style={{ fontWeight: 800, color: isCredit(tx) ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                      {isCredit(tx) ? '+' : '-'}{formatNaira(Number(tx.amount))}
                    </p>
                    <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn btn-outline btn-sm" style={{ opacity: page === 1 ? 0.4 : 1 }}>
              ← Previous
            </button>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Page {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn btn-outline btn-sm" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {selected && <TxDetailDrawer tx={selected} onClose={() => setSelected(null)} />}
    </DashLayout>
  )
}
