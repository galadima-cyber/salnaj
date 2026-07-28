import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Loader2, Minus, Plus } from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { PinModal }     from '@/components/ui/PinModal'
import { ReceiptModal } from '@/components/ui/ReceiptModal'
import { educationApi } from '@/services/endpoints'
import { useAuthStore } from '@/store/auth.store'
import { formatNaira }  from '@/utils'

const SERVICES = [
  {
    id: 'waec',
    label: 'WAEC',
    fullName: 'West African Examinations Council',
    color: '#059669', bg: 'rgba(5,150,105,0.10)',
    plans: [
      { code: 'waec-registrations', name: 'WAEC Result Checker', price: 1000 },
      { code: 'waec-scratch-card',  name: 'WAEC Scratch Card',   price: 1000 },
    ],
  },
  {
    id: 'neco',
    label: 'NECO',
    fullName: 'National Examinations Council',
    color: '#7C3AED', bg: 'rgba(124,58,237,0.10)',
    plans: [
      { code: 'neco-result-checker', name: 'NECO Result Checker', price: 800 },
    ],
  },
  {
    id: 'jamb',
    label: 'JAMB',
    fullName: 'Joint Admissions & Matriculation Board',
    color: '#1D4ED8', bg: 'rgba(29,78,216,0.10)',
    plans: [
      { code: 'jamb-mock',         name: 'JAMB Mock Profile Code',    price: 700  },
      { code: 'jamb-application',  name: 'JAMB Application / CAPS',   price: 5500 },
      { code: 'jamb-correction',   name: 'JAMB Data Correction',      price: 2500 },
    ],
  },
]

export default function EducationPage() {
  const { balance, fetchBalance } = useAuthStore()
  const [service,  setService]   = useState('waec')
  const [planCode, setPlanCode]  = useState('')
  const [phone,    setPhone]     = useState('')
  const [quantity, setQuantity]  = useState(1)
  const [pinOpen,  setPinOpen]   = useState(false)
  const [error,    setError]     = useState('')
  const [receipt,  setReceipt]   = useState<{
    open: boolean; status: 'success'|'failed'; ref: string; pins?: string[]
  } | null>(null)

  const svc  = SERVICES.find(s => s.id === service)!
  const plan = svc.plans.find(p => p.code === planCode)
  const total = plan ? plan.price * quantity : 0

  const handleBuy = () => {
    if (!planCode)   { setError('Select a plan'); return }
    if (!phone.trim()) { setError('Enter a phone number'); return }
    if (balance && total > balance.main + balance.bonus) { setError('Insufficient wallet balance'); return }
    setError(''); setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    if (!plan) return
    const res = await educationApi.purchase({
      serviceId: service, variationCode: planCode,
      amount: plan.price, phone, quantity, pin,
    })
    setPinOpen(false)
    const ok   = res.data.data?.status === 'SUCCESS'
    const pins = res.data.data?.pins || []
    setReceipt({ open: true, status: ok ? 'success' : 'failed', ref: res.data.data?.reference || '', pins })
    if (ok) { fetchBalance() }
  }

  return (
    <DashLayout>
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'var(--color-accent-subtle)' }}>
            <GraduationCap size={21} style={{ color: 'var(--color-accent-dark)' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Education Pins</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Balance: {balance ? formatNaira(balance.main + balance.bonus) : '---'}
            </p>
          </div>
        </div>

        {/* Service selector */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Exam Body</p>
          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map(s => (
              <button key={s.id}
                onClick={() => { setService(s.id); setPlanCode('') }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                style={{
                  background:  service === s.id ? s.bg : 'var(--color-surface-elevated)',
                  borderColor: service === s.id ? s.color : 'var(--color-border)',
                  cursor: 'pointer',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-800 text-sm text-white"
                     style={{ background: s.color, fontWeight: 800 }}>
                  {s.label.slice(0, 2)}
                </div>
                <span className="text-xs font-700"
                      style={{ fontWeight: 700, color: service === s.id ? s.color : 'var(--color-text-secondary)' }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>{svc.fullName}</p>
        </div>

        {/* Plan */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Plan</p>
          <div className="flex flex-col gap-2">
            {svc.plans.map(p => (
              <button key={p.code}
                onClick={() => setPlanCode(p.code)}
                className="flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left w-full"
                style={{
                  background:  planCode === p.code ? svc.bg : 'var(--color-surface-elevated)',
                  borderColor: planCode === p.code ? svc.color : 'var(--color-border)',
                  cursor: 'pointer',
                }}>
                <p className="font-heading text-sm font-700"
                   style={{ fontWeight: 700, color: planCode === p.code ? svc.color : 'var(--color-text-primary)' }}>
                  {p.name}
                </p>
                <p className="font-heading text-base font-800"
                   style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {formatNaira(p.price)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        {planCode && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
            <p className="font-heading text-sm font-700 mb-3"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Quantity</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)', cursor: 'pointer', border: 'none' }}>
                <Minus size={16} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <div className="flex-1 text-center">
                <p className="font-heading text-3xl font-800"
                   style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{quantity}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {quantity} pin{quantity > 1 ? 's' : ''} × {plan ? formatNaira(plan.price) : ''}
                </p>
              </div>
              <button onClick={() => setQuantity(q => Math.min(50, q + 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'var(--color-primary)', cursor: 'pointer', border: 'none' }}>
                <Plus size={16} color="white" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Phone + buy */}
        {planCode && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card p-5 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div>
              <p className="font-heading text-sm font-700 mb-2"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone for SMS delivery</p>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input" placeholder="0801 234 5678" />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 rounded-xl"
                 style={{ background: 'var(--color-surface-elevated)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {quantity} × {plan?.name}
              </p>
              <p className="font-heading text-xl font-800"
                 style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                {formatNaira(total)}
              </p>
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}

            <button onClick={handleBuy}
              className="btn w-full justify-center text-white"
              style={{ background: svc.color, boxShadow: `0 4px 15px ${svc.color}44` }}>
              <GraduationCap size={17} />
              Buy {quantity} {svc.label} Pin{quantity > 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </div>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handleConfirmPin}
        description={plan ? `${quantity}× ${plan.name} — ${formatNaira(total)}` : undefined} />

      {receipt && (
        <ReceiptModal
          isOpen={receipt.open} status={receipt.status}
          title={`${svc.label} Pin${(receipt.pins?.length || 0) > 1 ? 's' : ''}`}
          amount={total} reference={receipt.ref}
          token={receipt.pins?.join(' | ')}
          details={[
            { label: 'Service',  value: svc.fullName },
            { label: 'Plan',     value: plan?.name || '' },
            { label: 'Quantity', value: String(quantity) },
            { label: 'Phone',    value: phone },
          ]}
          onClose={() => setReceipt(null)}
          onRetry={() => { setReceipt(null); setPinOpen(true) }}
        />
      )}
    </DashLayout>
  )
}
