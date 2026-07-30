import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { PinModal }     from '@/components/ui/PinModal'
import { ReceiptModal } from '@/components/ui/ReceiptModal'
import { bettingApi }   from '@/services/endpoints'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { formatNaira }  from '@/utils'

const PLATFORMS = [
  { id: 'bet9ja',       label: 'Bet9ja',    color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  minAmount: 100  },
  { id: 'sportybet',    label: 'Sportybet', color: '#DC2626', bg: 'rgba(220,38,38,0.10)',  minAmount: 100  },
  { id: '1xbet',        label: '1xBet',     color: '#1D4ED8', bg: 'rgba(29,78,216,0.10)',  minAmount: 100  },
  { id: 'betking',      label: 'BetKing',   color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', minAmount: 100  },
  { id: 'merrybet',     label: 'MerryBet',  color: '#D97706', bg: 'rgba(217,119,6,0.10)',  minAmount: 100  },
  { id: 'naijabet',     label: 'NaijaBet',  color: '#059669', bg: 'rgba(5,150,105,0.10)',  minAmount: 100  },
]

const PRESETS = [500, 1000, 2000, 5000, 10000]

export default function BettingPage() {
  const { balance, refreshBalance } = useAuth()
  const toast = useToast()

  const [platform,   setPlatform]  = useState('bet9ja')
  const [userId,     setUserId]    = useState('')
  const [phone,      setPhone]     = useState('')
  const [amount,     setAmount]    = useState('')
  const [verifiedName, setVerifiedName] = useState('')
  const [verifying,  setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [pinOpen,    setPinOpen]   = useState(false)
  const [error,      setError]     = useState('')
  const [receipt,    setReceipt]   = useState<{
    open: boolean; status: 'success'|'failed'; ref: string
  } | null>(null)

  const plat = PLATFORMS.find(p => p.id === platform)!

  const handleVerify = async () => {
    if (!userId.trim()) { setVerifyError('Enter your betting user ID'); return }
    setVerifyError(''); setVerifying(true); setVerifiedName('')
    try {
      const res = await bettingApi.verifyUser(userId, platform)
      setVerifiedName(res.data.data.name)
    } catch (e) { setVerifyError(getErrorMessage(e)) }
    finally { setVerifying(false) }
  }

  const handleBuy = () => {
    const amt = parseFloat(amount)
    if (!verifiedName)       { setError('Verify your betting user ID first'); return }
    if (!phone.trim())       { setError('Enter a phone number'); return }
    if (!amt || amt < plat.minAmount) { setError(`Minimum is ${formatNaira(plat.minAmount)}`); return }
    if (balance && amt > balance.main + balance.bonus) { setError('Insufficient balance'); return }
    setError(''); setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    const res = await bettingApi.fund({
      serviceId: platform, bettingId: userId,
      amount: parseFloat(amount), phone, pin,
    })
    setPinOpen(false)
    const ok = res.data.data?.status === 'SUCCESS'
    setReceipt({ open: true, status: ok ? 'success' : 'failed', ref: res.data.data?.reference || '' })
    if (ok) refreshBalance()
  }

  return (
    <DashLayout>
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(220,38,38,0.10)' }}>
            <Target size={21} style={{ color: '#DC2626' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Betting Wallet</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Balance: {balance ? formatNaira(balance.main + balance.bonus) : '---'}
            </p>
          </div>
        </div>

        {/* Platform grid */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Platform</p>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map(p => (
              <button key={p.id}
                onClick={() => { setPlatform(p.id); setVerifiedName(''); setUserId('') }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                style={{
                  background:  platform === p.id ? p.bg : 'var(--color-surface-elevated)',
                  borderColor: platform === p.id ? p.color : 'var(--color-border)',
                  cursor: 'pointer',
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-800"
                     style={{ background: p.color, fontWeight: 800 }}>
                  {p.label.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-700 truncate w-full text-center"
                      style={{ fontWeight: 700, color: platform === p.id ? p.color : 'var(--color-text-secondary)' }}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User ID + verify */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {plat.label} User ID
          </p>
          <div className="flex gap-3">
            <input type="text" value={userId}
              onChange={e => { setUserId(e.target.value); setVerifiedName('') }}
              className="input flex-1" placeholder={`Enter your ${plat.label} ID`} />
            <button onClick={handleVerify} disabled={verifying || !userId}
              className="btn btn-outline shrink-0" style={{ borderRadius: 'var(--radius-md)' }}>
              {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
            </button>
          </div>

          {verifiedName && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'var(--color-success-subtle)' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <p className="font-heading text-sm font-700"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{verifiedName}</p>
            </motion.div>
          )}

          {verifyError && (
            <div className="mt-3 flex items-center gap-2">
              <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />
              <p className="text-xs" style={{ color: 'var(--color-error)' }}>{verifyError}</p>
            </div>
          )}
        </div>

        {/* Amount + phone */}
        {verifiedName && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-5 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div>
              <p className="font-heading text-sm font-700 mb-3"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Amount</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setAmount(String(p))}
                    className="px-4 py-2 rounded-full text-xs font-700 border-2 transition-all"
                    style={{
                      fontWeight: 700, fontFamily: 'var(--font-heading)',
                      background:  amount === String(p) ? plat.bg : 'var(--color-surface-elevated)',
                      borderColor: amount === String(p) ? plat.color : 'var(--color-border)',
                      color:       amount === String(p) ? plat.color : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}>
                    ₦{p.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-700"
                      style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>₦</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="input pl-9" placeholder={`Min ₦${plat.minAmount}`} min={plat.minAmount} />
              </div>
            </div>

            <div>
              <p className="font-heading text-sm font-700 mb-2"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone Number</p>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input" placeholder="0801 234 5678" />
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}

            <button onClick={handleBuy}
              className="btn w-full justify-center text-white"
              style={{ background: plat.color, boxShadow: `0 4px 15px ${plat.color}44` }}>
              <Target size={17} />
              Fund {plat.label} — {amount ? formatNaira(parseFloat(amount)) : '₦0'}
            </button>
          </motion.div>
        )}
      </div>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handleConfirmPin}
        description={verifiedName ? `${verifiedName} — ${plat.label} ${formatNaira(parseFloat(amount || '0'))}` : undefined} />

      {receipt && (
        <ReceiptModal
          isOpen={receipt.open} status={receipt.status}
          title={`${plat.label} Wallet Funded`} amount={parseFloat(amount)} reference={receipt.ref}
          details={[
            { label: 'Platform', value: plat.label },
            { label: 'User',     value: verifiedName },
            { label: 'User ID',  value: userId },
          ]}
          onClose={() => setReceipt(null)}
          onRetry={() => { setReceipt(null); setPinOpen(true) }}
        />
      )}
    </DashLayout>
  )
}
