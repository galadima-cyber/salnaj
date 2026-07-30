import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Search, Calendar, Zap, Loader2, AlertCircle } from 'lucide-react'
import { DashLayout }    from '@/components/layout/DashLayout'
import { PinModal }      from '@/components/ui/PinModal'
import { ReceiptModal }  from '@/components/ui/ReceiptModal'
import { dataApi, DataPlan, SmartBuyResult } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { formatNaira }   from '@/utils'

const NETWORKS = [
  { id: 'MTN',      label: 'MTN',     color: '#FFCC00', bg: 'rgba(255,204,0,0.12)',  textColor: '#996600' },
  { id: 'AIRTEL',   label: 'Airtel',  color: '#DC2626', bg: 'rgba(220,38,38,0.10)',  textColor: '#DC2626' },
  { id: 'GLO',      label: 'Glo',     color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  textColor: '#16A34A' },
  { id: 'ETISALAT', label: '9mobile', color: '#16A34A', bg: 'rgba(5,150,105,0.10)',  textColor: '#059669' },
]
const CATEGORIES = ['ALL', 'SME', 'DAILY', 'WEEKLY', 'CORPORATE']
const TABS = ['Data Plans', 'Smart Buy']

export default function BuyDataPage() {
  const { balance, refreshBalance } = useAuth()
  const toast = useToast()

  const [tab,          setTab]         = useState(0)
  const [network,      setNetwork]     = useState('MTN')
  const [category,     setCategory]    = useState('ALL')
  const [plans,        setPlans]       = useState<DataPlan[]>([])
  const [loading,      setLoading]     = useState(true)
  const [error,        setError]       = useState('')
  const [search,       setSearch]      = useState('')
  const [phone,        setPhone]       = useState('')
  const [selectedPlan, setSelected]    = useState<DataPlan | null>(null)
  const [pinOpen,      setPinOpen]     = useState(false)
  const [receipt,      setReceipt]     = useState<{ open: boolean; status: 'success'|'failed'; ref: string; token?: string } | null>(null)

  // Smart Buy state
  const [budget,       setBudget]      = useState('1000')
  const [smartResults, setSmartResults]= useState<SmartBuyResult[]>([])
  const [smartInsight, setSmartInsight]= useState('')
  const [smartLoading, setSmartLoading]= useState(false)
  const [autopilot,    setAutopilot]   = useState(false)

  // Load plans when network changes
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('')
      try {
        const res = await dataApi.getPlans(network)
        setPlans(res.data.data.plans || [])
      } catch (e) {
        setError(getErrorMessage(e))
      } finally { setLoading(false) }
    }
    load()
  }, [network])

  const filteredPlans = plans.filter(p => {
    if (category !== 'ALL' && p.category !== category) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleSmartBuy = async () => {
    const b = parseFloat(budget)
    if (!b || b < 100) return
    setSmartLoading(true)
    try {
      const res = await dataApi.smartBuy(b)
      setSmartResults(res.data.data.results)
      setSmartInsight(res.data.data.insight)
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setSmartLoading(false) }
  }

  const selectPlan = (plan: DataPlan) => {
    setSelected(plan)
    // Pre-fill network
    setNetwork(plan.network)
  }

  const handleBuy = () => {
    if (!phone.trim()) { setError('Enter the phone number to receive data'); return }
    if (!selectedPlan) { setError('Select a data plan'); return }
    setError('')
    setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    if (!selectedPlan) return
    const res = await dataApi.purchase({ planId: selectedPlan.id, phone, pin })
    setPinOpen(false)
    const ok = res.data.data?.status === 'SUCCESS'
    setReceipt({ open: true, status: ok ? 'success' : 'failed', ref: res.data.data?.reference || '' })
    if (ok) {
      refreshBalance(); setSelected(null)
      toast.success('Data Delivered!', `${selectedPlan?.sizeLabel} sent to ${phone}`)
    } else {
      toast.error('Transaction Failed', 'Your wallet has been refunded automatically')
    }
  }

  const netObj = NETWORKS.find(n => n.id === network)

  return (
    <DashLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary-muted)' }}>
            <Wifi size={21} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Buy Data</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance: {balance ? formatNaira(balance.main + balance.bonus) : '---'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: 'var(--color-surface)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className="flex-1 py-2.5 rounded-xl font-heading text-sm transition-all"
              style={{ fontWeight: 700, background: tab === i ? 'var(--color-primary)' : 'transparent', color: tab === i ? '#fff' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 ? (
          <div className="flex flex-col gap-5">
            {/* Network selector */}
            <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
              <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Network</p>
              <div className="grid grid-cols-4 gap-3">
                {NETWORKS.map(n => (
                  <button key={n.id} onClick={() => setNetwork(n.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all"
                    style={{
                      background:   network === n.id ? n.bg : 'var(--color-surface-elevated)',
                      borderColor:  network === n.id ? n.color : 'var(--color-border)',
                      cursor:       'pointer',
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-800 text-sm"
                         style={{ background: n.bg, color: n.textColor, fontWeight: 800 }}>
                      {n.label[0]}
                    </div>
                    <span className="text-xs font-600" style={{ color: network === n.id ? n.textColor : 'var(--color-text-secondary)', fontWeight: 600 }}>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone input */}
            <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
              <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone Number</p>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input" placeholder="e.g. 0801 234 5678"
                maxLength={11}
              />
            </div>

            {/* Category filter + Search */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className="px-4 py-2 rounded-full text-xs font-600 whitespace-nowrap transition-all shrink-0"
                    style={{
                      fontWeight:  700,
                      fontFamily:  'var(--font-heading)',
                      background:  category === c ? 'var(--color-primary)' : 'var(--color-surface)',
                      color:       category === c ? '#fff' : 'var(--color-text-secondary)',
                      border:      `1px solid ${category === c ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      cursor:      'pointer',
                    }}>
                    {c === 'ALL' ? 'All Plans' : c}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  className="input pl-9 py-2.5 text-sm" placeholder={`Search ${network} plans...`} />
              </div>
            </div>

            {/* Plans grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--color-error-subtle)' }}>
                <AlertCircle size={18} style={{ color: 'var(--color-error)' }} />
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlans.length === 0 ? (
                  <p className="col-span-2 text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>No plans found</p>
                ) : filteredPlans.map(plan => {
                  const isSelected = selectedPlan?.id === plan.id
                  return (
                    <motion.button
                      key={plan.id}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={() => selectPlan(plan)}
                      className="text-left p-4 rounded-2xl border-2 transition-all w-full"
                      style={{
                        background:  isSelected ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        cursor:      'pointer',
                      }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-heading text-lg font-800" style={{ fontWeight: 800, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                            {plan.sizeLabel}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{plan.validityDays} day{plan.validityDays !== 1 ? 's' : ''} validity</p>
                        </div>
                        <div className="text-right">
                          <p className="font-heading text-lg font-800" style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>
                            {formatNaira(plan.price)}
                          </p>
                          <span className="badge badge-primary text-xs">{plan.category}</span>
                        </div>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{plan.name}</p>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Selected plan + buy */}
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="card p-5 sticky bottom-4" style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Selected Plan</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selectedPlan.name} · {selectedPlan.validityDays}days</p>
                  </div>
                  <p className="font-heading text-xl font-800" style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                    {formatNaira(selectedPlan.price)}
                  </p>
                </div>

                {/* Autopilot toggle */}
                <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: 'var(--color-surface-elevated)' }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={15} style={{ color: 'var(--color-secondary)' }} />
                    <div>
                      <p className="text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Enable Autopilot</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Auto-buy this plan on schedule</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutopilot(a => !a)}
                    className="w-11 h-6 rounded-full transition-all relative shrink-0"
                    style={{ background: autopilot ? 'var(--color-secondary)' : 'var(--color-border)', border: 'none', cursor: 'pointer' }}>
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
                          style={{ left: autopilot ? 'calc(100% - 22px)' : '2px' }} />
                  </button>
                </div>

                {error && <p className="text-xs mb-3" style={{ color: 'var(--color-error)' }}>{error}</p>}
                <button onClick={handleBuy} className="btn btn-primary w-full justify-center">
                  <Zap size={17} fill="white" /> Buy {selectedPlan.sizeLabel} for {formatNaira(selectedPlan.price)}
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          /* ── Smart Buy tab ─────────────────────────────────── */
          <div className="flex flex-col gap-5">
            <div className="card p-6" style={{ borderRadius: 'var(--radius-xl)' }}>
              <p className="font-heading text-base font-700 mb-1" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>What's your budget?</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                We'll find the best data plan across all networks for your budget.
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-700" style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>₦</span>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                    className="input pl-9" placeholder="1000" min={100} />
                </div>
                <button onClick={handleSmartBuy} className="btn btn-primary shrink-0" disabled={smartLoading}>
                  {smartLoading ? <Loader2 size={17} className="animate-spin" /> : 'Find Best Deal'}
                </button>
              </div>
              {/* Quick budget buttons */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {[200, 500, 1000, 2000, 5000].map(b => (
                  <button key={b} onClick={() => setBudget(String(b))}
                    className="px-3 py-1.5 rounded-full text-xs font-600 transition-all"
                    style={{ fontWeight: 600, fontFamily: 'var(--font-heading)', background: budget === String(b) ? 'var(--color-primary-muted)' : 'var(--color-surface-elevated)', color: budget === String(b) ? 'var(--color-primary)' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}>
                    ₦{b.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {smartInsight && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--color-secondary-subtle)' }}>
                <p className="text-sm font-600" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>💡 {smartInsight}</p>
              </div>
            )}

            {smartResults.length > 0 && (
              <div className="flex flex-col gap-3">
                {smartResults.map((r, i) => (
                  <motion.div
                    key={r.planId}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="card p-5 flex items-center justify-between gap-4 cursor-pointer"
                    style={{ borderRadius: 'var(--radius-xl)', border: i === 0 ? '2px solid var(--color-secondary)' : undefined }}
                    onClick={() => { setTab(0); setNetwork(r.network); }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{'🥇🥈🥉🏅🏅'[i]}</span>
                      <div>
                        <p className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {r.network} — {r.sizeLabel}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {r.validityDays} days · Score: {r.valueScore}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="font-heading font-800 text-lg" style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>{formatNaira(r.price)}</p>
                      {r.badge && <span className="badge badge-success text-xs">{r.badge}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <PinModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={handleConfirmPin}
        description={selectedPlan ? `${selectedPlan.name} → ${phone}` : undefined}
      />

      {receipt && (
        <ReceiptModal
          isOpen={receipt.open}
          status={receipt.status}
          title={`${network} ${selectedPlan?.sizeLabel || ''} Data`}
          amount={selectedPlan?.price || 0}
          reference={receipt.ref}
          token={receipt.token}
          details={[
            { label: 'Network', value: network },
            { label: 'Phone',   value: phone },
            { label: 'Plan',    value: selectedPlan?.name || '' },
          ]}
          onClose={() => setReceipt(null)}
          onRetry={() => { setReceipt(null); setPinOpen(true) }}
        />
      )}
    </DashLayout>
  )
}
