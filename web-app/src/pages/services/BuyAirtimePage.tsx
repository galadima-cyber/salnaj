import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Zap } from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { PinModal }     from '@/components/ui/PinModal'
import { ReceiptModal } from '@/components/ui/ReceiptModal'
import { useToast }     from '@/components/ui/Toast'
import { airtimeApi }   from '@/services/endpoints'
import { useAuth } from '@/context/AuthContext'
import { formatNaira, detectNetwork } from '@/utils'

const NETWORKS = [
  { id: 'MTN',      label: 'MTN',     color: '#FFCC00', bg: 'rgba(255,204,0,0.12)', textColor: '#997700' },
  { id: 'AIRTEL',   label: 'Airtel',  color: '#DC2626', bg: 'rgba(220,38,38,0.10)', textColor: '#DC2626' },
  { id: 'GLO',      label: 'Glo',     color: '#16A34A', bg: 'rgba(22,163,74,0.10)', textColor: '#16A34A' },
  { id: 'ETISALAT', label: '9mobile', color: '#059669', bg: 'rgba(5,150,105,0.10)', textColor: '#059669' },
]
const PRESETS = [50, 100, 200, 500, 1000, 2000]

export default function BuyAirtimePage() {
  const { balance, refreshBalance } = useAuth()
  const toast = useToast()
  const [network,  setNetwork]  = useState('MTN')
  const [phone,    setPhone]    = useState('')
  const [amount,   setAmount]   = useState('')
  const [error,    setError]    = useState('')
  const [pinOpen,  setPinOpen]  = useState(false)
  const [receipt,  setReceipt]  = useState<{ open: boolean; status: 'success' | 'failed'; ref: string } | null>(null)

  const handlePhoneChange = (val: string) => {
    setPhone(val)
    // Auto-detect network
    if (val.length >= 4) {
      const detected = detectNetwork(val)
      if (detected) setNetwork(detected)
    }
  }

  const handleBuy = () => {
    const amt = parseFloat(amount)
    if (!phone.trim()) { setError('Enter a phone number'); return }
    if (!amt || amt < 50) { setError('Minimum airtime is ₦50'); return }
    if (balance && amt > balance.main + balance.bonus) { setError('Insufficient wallet balance'); return }
    setError('')
    setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    const res = await airtimeApi.purchase({ network, phone, amount: parseFloat(amount), pin })
    setPinOpen(false)
    const ok = res.data.data?.status === 'SUCCESS'
    setReceipt({ open: true, status: ok ? 'success' : 'failed', ref: res.data.data?.reference || '' })
    if (ok) { refreshBalance(); toast.success('Airtime Sent!', `${amount} ${network} airtime delivered`) }
    else    { toast.error('Transaction Failed', 'Your wallet has been refunded') }
  }

  return (
    <DashLayout>
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-secondary-muted)' }}>
            <Phone size={21} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Buy Airtime</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance: {balance ? formatNaira(balance.main + balance.bonus) : '---'}</p>
          </div>
        </div>

        {/* Network */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Network</p>
          <div className="grid grid-cols-4 gap-3">
            {NETWORKS.map(n => (
              <button key={n.id} onClick={() => setNetwork(n.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all"
                style={{
                  background:  network === n.id ? n.bg : 'var(--color-surface-elevated)',
                  borderColor: network === n.id ? n.color : 'var(--color-border)',
                  cursor: 'pointer',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-800 text-sm"
                     style={{ background: n.bg, color: n.textColor, fontWeight: 800 }}>
                  {n.label[0]}
                </div>
                <span className="text-xs font-600" style={{ color: network === n.id ? n.textColor : 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {n.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone Number</p>
          <input type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)}
            className="input" placeholder="0801 234 5678" maxLength={11} />
          {phone.length >= 4 && detectNetwork(phone) && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>
              ✓ Detected: {detectNetwork(phone)} — switched automatically
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Amount</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {PRESETS.map(p => (
              <motion.button
                key={p} whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(String(p))}
                className="py-3 rounded-2xl font-heading font-700 text-sm border-2 transition-all"
                style={{
                  fontWeight:  700,
                  background:  amount === String(p) ? 'var(--color-primary-muted)' : 'var(--color-surface-elevated)',
                  borderColor: amount === String(p) ? 'var(--color-primary)' : 'var(--color-border)',
                  color:       amount === String(p) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor:      'pointer',
                }}>
                ₦{p.toLocaleString()}
              </motion.button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-700" style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>₦</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="input pl-9" placeholder="Custom amount" min={50} />
          </div>
        </div>

        {/* Summary + Buy */}
        {phone && amount && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Sending to</p>
                <p className="font-heading font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{phone}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>via {network}</p>
              </div>
              <p className="font-heading text-2xl font-800" style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                {amount ? formatNaira(parseFloat(amount)) : '₦0'}
              </p>
            </div>
            {error && <p className="text-xs mb-3" style={{ color: 'var(--color-error)' }}>{error}</p>}
            <button onClick={handleBuy} className="btn btn-secondary w-full justify-center">
              <Zap size={17} fill="white" /> Send Airtime
            </button>
          </motion.div>
        )}
        {error && !phone && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      </div>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handleConfirmPin}
        description={phone && amount ? `₦${parseFloat(amount).toLocaleString()} ${network} airtime → ${phone}` : undefined} />

      {receipt && (
        <ReceiptModal
          isOpen={receipt.open} status={receipt.status}
          title={`${network} Airtime`} amount={parseFloat(amount)} reference={receipt.ref}
          details={[{ label: 'Network', value: network }, { label: 'Phone', value: phone }]}
          onClose={() => setReceipt(null)} onRetry={() => { setReceipt(null); setPinOpen(true) }}
        />
      )}
    </DashLayout>
  )
}
