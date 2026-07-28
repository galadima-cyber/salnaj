import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Copy, CheckCheck, Share2, QrCode, ArrowRight, Ticket } from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { PinModal }     from '@/components/ui/PinModal'
import { useAuthStore } from '@/store/auth.store'
import { formatNaira }  from '@/utils'

// Mock gift codes history
const MOCK_SENT = [
  { code: 'GIFT-X4K2-MTN2G', network: 'MTN',   plan: '2GB',  price: 580,  message: 'Happy birthday! 🎂', redeemed: false, expires: '2026-08-26' },
  { code: 'GIFT-R9T1-AIR1G', network: 'Airtel', plan: '1GB',  price: 280,  message: '',                    redeemed: true,  expires: '2026-07-10' },
]

const MOCK_RECEIVED = [
  { code: 'GIFT-B3M7-GLO5G', network: 'Glo', plan: '5GB', price: 1350, from: 'Fatimah A.', message: '🎁 Enjoy!', redeemed: false, expires: '2026-08-01' },
]

const PLANS = [
  { id: '1', network: 'MTN',    sizeLabel: '1GB',  price: 300,  validityDays: 30 },
  { id: '2', network: 'MTN',    sizeLabel: '2GB',  price: 580,  validityDays: 30 },
  { id: '3', network: 'AIRTEL', sizeLabel: '2GB',  price: 550,  validityDays: 30 },
  { id: '4', network: 'AIRTEL', sizeLabel: '6GB',  price: 1650, validityDays: 7  },
  { id: '5', network: 'GLO',    sizeLabel: '5GB',  price: 1350, validityDays: 14 },
  { id: '6', network: 'MTN',    sizeLabel: '5GB',  price: 1450, validityDays: 30 },
]

const NET_COLORS: Record<string, string> = {
  MTN: '#FFCC00', AIRTEL: '#DC2626', GLO: '#16A34A', ETISALAT: '#059669',
}

const TABS = ['Send Gift', 'Sent', 'Received']

export default function GiftDataPage() {
  const { balance, fetchBalance } = useAuthStore()
  const [tab,        setTab]        = useState(0)
  const [selectedPlan, setSelected] = useState<typeof PLANS[0] | null>(null)
  const [giftMessage,  setMessage]  = useState('')
  const [redeemCode,   setRedeem]   = useState('')
  const [redeemPhone,  setRedeemPhone] = useState('')
  const [pinOpen,    setPinOpen]    = useState(false)
  const [copiedCode, setCopied]     = useState<string | null>(null)
  const [newGiftCode, setNewGiftCode] = useState<string | null>(null)
  const [error,      setError]      = useState('')

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleShare = (code: string, plan: string) => {
    const text = `🎁 I'm gifting you ${plan} data on Salnaj!\n\nRedeem code: ${code}\n\nVisit: ${window.location.origin}/redeem to claim it.`
    if (navigator.share) {
      navigator.share({ title: 'Data Gift from Salnaj', text })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  const handleBuyGift = () => {
    if (!selectedPlan) { setError('Select a data plan'); return }
    if (balance && selectedPlan.price > balance.main + balance.bonus) {
      setError('Insufficient balance'); return
    }
    setError(''); setPinOpen(true)
  }

  const handleConfirmPin = async (_pin: string) => {
    // TODO: wire to POST /api/gifts/create
    await new Promise(r => setTimeout(r, 1200))
    const code = `GIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${selectedPlan!.network.slice(0, 3)}${selectedPlan!.sizeLabel.replace(/[^0-9A-Z]/gi, '').toUpperCase()}`
    setPinOpen(false)
    setNewGiftCode(code)
    fetchBalance()
  }

  const handleRedeem = () => {
    if (!redeemCode.trim()) { setError('Enter a gift code'); return }
    if (!redeemPhone.trim()) { setError('Enter the phone number to receive the data'); return }
    setError('')
    // TODO: wire to POST /api/gifts/redeem
    alert(`✅ Redeeming ${redeemCode} to ${redeemPhone}…`)
  }

  return (
    <DashLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(124,58,237,0.10)' }}>
            <Gift size={21} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Gift Data</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Buy data, share a code — they redeem it their way
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--color-surface)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className="flex-1 py-2.5 rounded-xl font-heading text-sm font-700 transition-all"
              style={{ fontWeight: 700, background: tab === i ? '#7C3AED' : 'transparent', color: tab === i ? 'white' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Send Gift tab ─────────────────────────────── */}
        {tab === 0 && (
          <div className="flex flex-col gap-4">
            {/* New gift code banner */}
            <AnimatePresence>
              {newGiftCode && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="p-5 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 'var(--radius-xl)' }}>
                  <p className="text-white/70 text-sm mb-2">🎉 Gift code created!</p>
                  <p className="font-mono text-2xl font-800 text-white mb-4"
                     style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                    {newGiftCode}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleCopy(newGiftCode)}
                      className="btn btn-sm"
                      style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
                      {copiedCode === newGiftCode ? <><CheckCheck size={14}/> Copied!</> : <><Copy size={14}/> Copy</>}
                    </button>
                    <button onClick={() => handleShare(newGiftCode, selectedPlan?.sizeLabel || '')}
                      className="btn btn-sm"
                      style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                  <p className="text-white/50 text-xs mt-3">Valid for 30 days</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Plan selector */}
            <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
              <p className="font-heading text-sm font-700 mb-3"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Plan to Gift</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PLANS.map(plan => (
                  <motion.button key={plan.id} whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelected(plan); setNewGiftCode(null) }}
                    className="text-left p-4 rounded-2xl border-2 transition-all"
                    style={{
                      background:  selectedPlan?.id === plan.id ? 'rgba(124,58,237,0.08)' : 'var(--color-surface-elevated)',
                      borderColor: selectedPlan?.id === plan.id ? '#7C3AED' : 'var(--color-border)',
                      cursor: 'pointer',
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-800 text-white mb-2"
                         style={{ background: NET_COLORS[plan.network] || '#666', fontWeight: 800,
                                  color: plan.network === 'MTN' ? '#554400' : 'white' }}>
                      {plan.network[0]}
                    </div>
                    <p className="font-heading text-lg font-800"
                       style={{ fontWeight: 800, color: selectedPlan?.id === plan.id ? '#7C3AED' : 'var(--color-text-primary)' }}>
                      {plan.sizeLabel}
                    </p>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {plan.validityDays}d · {plan.network}
                    </p>
                    <p className="font-heading text-sm font-800" style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {formatNaira(plan.price)}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Gift message */}
            {selectedPlan && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card p-5 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div>
                  <p className="font-heading text-sm font-700 mb-2"
                     style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Personal message <span className="font-400 text-xs" style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
                  </p>
                  <textarea value={giftMessage} onChange={e => setMessage(e.target.value.slice(0, 100))}
                    className="input resize-none" rows={2}
                    placeholder={`e.g. "Happy birthday! 🎂" (max 100 chars)`} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl"
                     style={{ background: 'rgba(124,58,237,0.06)' }}>
                  <div>
                    <p className="font-heading text-sm font-700"
                       style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {selectedPlan.network} {selectedPlan.sizeLabel} Gift
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {selectedPlan.validityDays}-day validity · Code valid 30 days
                    </p>
                  </div>
                  <p className="font-heading text-xl font-800"
                     style={{ fontWeight: 800, color: '#7C3AED' }}>
                    {formatNaira(selectedPlan.price)}
                  </p>
                </div>

                {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}

                <button onClick={handleBuyGift}
                  className="btn w-full justify-center text-white"
                  style={{ background: '#7C3AED', boxShadow: '0 4px 15px rgba(124,58,237,0.35)' }}>
                  <Gift size={17} /> Create Gift Code — {formatNaira(selectedPlan.price)}
                </button>
              </motion.div>
            )}

            {/* Redeem section */}
            <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)', borderStyle: 'dashed' }}>
              <div className="flex items-center gap-2 mb-4">
                <Ticket size={16} style={{ color: 'var(--color-secondary)' }} />
                <p className="font-heading text-sm font-700"
                   style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Redeem a Gift Code</p>
              </div>
              <div className="flex flex-col gap-3">
                <input value={redeemCode} onChange={e => setRedeem(e.target.value.toUpperCase())}
                  className="input font-mono" placeholder="e.g. GIFT-X4K2-MTN2G"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }} />
                <input type="tel" value={redeemPhone} onChange={e => setRedeemPhone(e.target.value)}
                  className="input" placeholder="Phone number to receive data" />
                <button onClick={handleRedeem} className="btn btn-secondary w-full justify-center">
                  <ArrowRight size={16} /> Redeem Gift
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sent tab ──────────────────────────────────── */}
        {tab === 1 && (
          <div className="flex flex-col gap-3">
            {MOCK_SENT.length === 0 ? (
              <div className="card p-10 flex flex-col items-center gap-3 text-center" style={{ borderRadius: 'var(--radius-xl)' }}>
                <Gift size={36} style={{ color: 'var(--color-border-strong)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No gift codes sent yet</p>
              </div>
            ) : MOCK_SENT.map(g => (
              <div key={g.code} className="card p-5" style={{ borderRadius: 'var(--radius-xl)', opacity: g.redeemed ? 0.65 : 1 }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-heading text-base font-700"
                       style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {g.network} {g.plan}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {formatNaira(g.price)} · Expires {g.expires}
                    </p>
                    {g.message && (
                      <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-secondary)' }}>"{g.message}"</p>
                    )}
                  </div>
                  <span className="badge shrink-0 text-xs"
                        style={{ background: g.redeemed ? 'var(--color-success-subtle)' : 'var(--color-primary-muted)', color: g.redeemed ? 'var(--color-success)' : 'var(--color-primary)', fontSize: '0.68rem' }}>
                    {g.redeemed ? 'Redeemed' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl"
                     style={{ background: 'var(--color-surface-elevated)' }}>
                  <p className="font-mono text-sm font-700 flex-1"
                     style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#7C3AED', letterSpacing: '0.05em' }}>
                    {g.code}
                  </p>
                  {!g.redeemed && (
                    <div className="flex gap-1">
                      <button onClick={() => handleCopy(g.code)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--color-primary-muted)', border: 'none', cursor: 'pointer' }}>
                        {copiedCode === g.code ? <CheckCheck size={13} style={{ color: 'var(--color-primary)' }} /> : <Copy size={13} style={{ color: 'var(--color-primary)' }} />}
                      </button>
                      <button onClick={() => handleShare(g.code, g.plan)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(124,58,237,0.10)', border: 'none', cursor: 'pointer' }}>
                        <Share2 size={13} style={{ color: '#7C3AED' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Received tab ──────────────────────────────── */}
        {tab === 2 && (
          <div className="flex flex-col gap-3">
            {MOCK_RECEIVED.map(g => (
              <div key={g.code} className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading text-base font-700"
                       style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {g.network} {g.plan} Gift
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>From {g.from}</p>
                    {g.message && (
                      <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-secondary)' }}>"{g.message}"</p>
                    )}
                  </div>
                  <p className="font-heading text-base font-800" style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>
                    {formatNaira(g.price)}
                  </p>
                </div>
                <div className="font-mono text-sm font-700 mb-3 p-3 rounded-xl"
                     style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,0.06)', letterSpacing: '0.05em' }}>
                  {g.code}
                </div>
                <button className="btn btn-secondary w-full justify-center btn-sm">
                  <ArrowRight size={15} /> Redeem Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handleConfirmPin}
        description={selectedPlan ? `Create ${selectedPlan.network} ${selectedPlan.sizeLabel} gift — ${formatNaira(selectedPlan.price)}` : undefined} />
    </DashLayout>
  )
}
