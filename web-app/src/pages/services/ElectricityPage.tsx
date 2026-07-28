import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { DashLayout }    from '@/components/layout/DashLayout'
import { PinModal }      from '@/components/ui/PinModal'
import { ReceiptModal }  from '@/components/ui/ReceiptModal'
import { electricityApi, MeterInfo } from '@/services/endpoints'
import { useAuthStore }  from '@/store/auth.store'
import { getErrorMessage } from '@/services/api'
import { formatNaira }   from '@/utils'

const DISCOS = [
  { id: 'ikeja-electric',    label: 'Ikeja Electric',     region: 'Lagos (Mainland)' },
  { id: 'eko-electric',      label: 'Eko Electric',       region: 'Lagos (Island)' },
  { id: 'abuja-electric',    label: 'Abuja AEDC',         region: 'Abuja / FCT' },
  { id: 'phed',              label: 'PHED',               region: 'Port Harcourt' },
  { id: 'enugu-electric',    label: 'Enugu EEDC',         region: 'Enugu / S-East' },
  { id: 'ibadan-electric',   label: 'Ibadan IBEDC',       region: 'Ibadan / S-West' },
  { id: 'kano-electric',     label: 'Kano KEDC',          region: 'Kano / North' },
  { id: 'benin-electric',    label: 'Benin BEDC',         region: 'Benin / Edo' },
  { id: 'jos-electric',      label: 'Jos JED',            region: 'Jos / Plateau' },
  { id: 'kaduna-electric',   label: 'Kaduna KAEDCO',      region: 'Kaduna' },
]
const PRESETS = [1000, 2000, 5000, 10000, 20000]

export default function ElectricityPage() {
  const { balance, fetchBalance } = useAuthStore()

  const [disco,      setDisco]      = useState('')
  const [meterType,  setMeterType]  = useState<'prepaid'|'postpaid'>('prepaid')
  const [meterNum,   setMeterNum]   = useState('')
  const [phone,      setPhone]      = useState('')
  const [amount,     setAmount]     = useState('')
  const [meterInfo,  setMeterInfo]  = useState<MeterInfo | null>(null)
  const [verifying,  setVerifying]  = useState(false)
  const [error,      setError]      = useState('')
  const [pinOpen,    setPinOpen]    = useState(false)
  const [receipt,    setReceipt]    = useState<{
    open: boolean; status: 'success'|'failed'; ref: string; token?: string
  } | null>(null)

  const handleVerify = async () => {
    if (!disco)            { setError('Select your DISCO'); return }
    if (!meterNum.trim())  { setError('Enter your meter number'); return }
    setError(''); setVerifying(true); setMeterInfo(null)
    try {
      const res = await electricityApi.verifyMeter(meterNum, disco, meterType)
      setMeterInfo(res.data.data)
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setVerifying(false) }
  }

  const handleBuy = () => {
    const amt = parseFloat(amount)
    if (!meterInfo)        { setError('Verify your meter first'); return }
    if (!phone.trim())     { setError('Enter a phone number for SMS token'); return }
    if (!amt || amt < 500) { setError('Minimum electricity payment is ₦500'); return }
    if (balance && amt > balance.main + balance.bonus) { setError('Insufficient wallet balance'); return }
    setError(''); setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    const res = await electricityApi.purchase({
      disco, meterNumber: meterNum, meterType,
      amount: parseFloat(amount), phone, pin,
    })
    setPinOpen(false)
    const ok    = res.data.data?.status === 'SUCCESS'
    const token = res.data.data?.token
    setReceipt({ open: true, status: ok ? 'success' : 'failed', ref: res.data.data?.reference || '', token })
    if (ok) fetchBalance()
  }

  return (
    <DashLayout>
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.10)' }}>
            <Zap size={21} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Pay Electricity Bill</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance: {balance ? formatNaira(balance.main + balance.bonus) : '---'}</p>
          </div>
        </div>

        {/* DISCO selector */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Electricity Provider (DISCO)</p>
          <div className="grid grid-cols-2 gap-2">
            {DISCOS.map(d => (
              <button key={d.id} onClick={() => { setDisco(d.id); setMeterInfo(null) }}
                className="text-left p-3 rounded-xl border-2 transition-all"
                style={{
                  background:  disco === d.id ? 'rgba(124,58,237,0.08)' : 'var(--color-surface-elevated)',
                  borderColor: disco === d.id ? '#7C3AED' : 'var(--color-border)',
                  cursor: 'pointer',
                }}>
                <p className="font-heading text-xs font-700 truncate" style={{ fontWeight: 700, color: disco === d.id ? '#7C3AED' : 'var(--color-text-primary)' }}>{d.label}</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{d.region}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Meter Type */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Meter Type</p>
          <div className="grid grid-cols-2 gap-3">
            {(['prepaid', 'postpaid'] as const).map(t => (
              <button key={t} onClick={() => setMeterType(t)}
                className="py-3 rounded-xl font-heading font-700 text-sm border-2 transition-all capitalize"
                style={{
                  fontWeight:  700,
                  background:  meterType === t ? 'rgba(124,58,237,0.08)' : 'var(--color-surface-elevated)',
                  borderColor: meterType === t ? '#7C3AED' : 'var(--color-border)',
                  color:       meterType === t ? '#7C3AED' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Meter number + verify */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Meter Number</p>
          <div className="flex gap-3">
            <input type="text" value={meterNum} onChange={e => { setMeterNum(e.target.value); setMeterInfo(null) }}
              className="input flex-1" placeholder="e.g. 45012345678" />
            <button onClick={handleVerify} disabled={verifying || !disco || !meterNum}
              className="btn btn-outline shrink-0" style={{ borderRadius: 'var(--radius-md)' }}>
              {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
            </button>
          </div>

          {/* Customer info */}
          {meterInfo && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl flex items-start gap-3"
              style={{ background: 'var(--color-success-subtle)' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{meterInfo.customerName}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{meterInfo.customerAddress}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Min: {formatNaira(meterInfo.minAmount)}</p>
              </div>
            </motion.div>
          )}
          {error && (
            <div className="mt-3 flex items-center gap-2">
              <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />
              <p className="text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>
            </div>
          )}
        </div>

        {/* Amount */}
        {meterInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-5 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
            <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Amount</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p} onClick={() => setAmount(String(p))}
                  className="px-4 py-2 rounded-full text-xs font-700 border-2 transition-all"
                  style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: amount === String(p) ? 'rgba(124,58,237,0.10)' : 'var(--color-surface-elevated)', borderColor: amount === String(p) ? '#7C3AED' : 'var(--color-border)', color: amount === String(p) ? '#7C3AED' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  ₦{p.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-700" style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>₦</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="input pl-9" placeholder="Custom amount (min ₦500)" min={500} />
            </div>

            {/* Phone for token SMS */}
            <div>
              <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone for Token SMS</p>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input" placeholder="0801 234 5678" />
            </div>

            <button onClick={handleBuy} className="btn w-full justify-center" style={{ background: '#7C3AED', color: '#fff', boxShadow: '0 4px 15px rgba(124,58,237,0.35)' }}>
              <Zap size={17} fill="white" />
              Pay {amount ? formatNaira(parseFloat(amount)) : 'Electricity Bill'}
            </button>
          </motion.div>
        )}
      </div>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handleConfirmPin}
        description={meterInfo ? `${meterInfo.customerName} — ${formatNaira(parseFloat(amount || '0'))}` : undefined} />

      {receipt && (
        <ReceiptModal
          isOpen={receipt.open} status={receipt.status}
          title="Electricity Token" amount={parseFloat(amount)} reference={receipt.ref} token={receipt.token}
          details={[
            { label: 'Provider',     value: DISCOS.find(d => d.id === disco)?.label || disco },
            { label: 'Meter',        value: meterNum },
            { label: 'Customer',     value: meterInfo?.customerName || '' },
            { label: 'Meter Type',   value: meterType },
          ]}
          onClose={() => setReceipt(null)} onRetry={() => { setReceipt(null); setPinOpen(true) }}
        />
      )}
    </DashLayout>
  )
}
