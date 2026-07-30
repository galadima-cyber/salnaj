import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tv, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { PinModal }     from '@/components/ui/PinModal'
import { ReceiptModal } from '@/components/ui/ReceiptModal'
import { cableApi, DecoderInfo } from '@/services/endpoints'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { formatNaira }  from '@/utils'

const PROVIDERS = [
  {
    id: 'dstv', label: 'DSTV', color: '#1D4ED8', bg: 'rgba(29,78,216,0.10)',
    packages: [
      { code: 'dstv-padi',       name: 'Padi',             price: 2565  },
      { code: 'dstv-yanga',      name: 'Yanga',            price: 3365  },
      { code: 'dstv-confam',     name: 'Confam',           price: 6200  },
      { code: 'dstv-compact',    name: 'Compact',          price: 11200 },
      { code: 'dstv-compact-plus',name:'Compact Plus',     price: 16600 },
      { code: 'dstv-premium',    name: 'Premium',          price: 24500 },
    ],
  },
  {
    id: 'gotv', label: 'GOtv', color: '#047857', bg: 'rgba(4,120,87,0.10)',
    packages: [
      { code: 'gotv-smallie',    name: 'Smallie',          price: 1575  },
      { code: 'gotv-jinja',      name: 'Jinja',            price: 2715  },
      { code: 'gotv-jolli',      name: 'Jolli',            price: 4110  },
      { code: 'gotv-max',        name: 'Max',              price: 6200  },
      { code: 'gotv-supa',       name: 'Supa',             price: 9600  },
      { code: 'gotv-supa-plus',  name: 'Supa Plus',        price: 12800 },
    ],
  },
  {
    id: 'startimes', label: 'Startimes', color: '#B45309', bg: 'rgba(180,83,9,0.10)',
    packages: [
      { code: 'startimes-nova',  name: 'Nova',             price: 900   },
      { code: 'startimes-basic', name: 'Basic',            price: 1850  },
      { code: 'startimes-smart', name: 'Smart',            price: 2600  },
      { code: 'startimes-classic',name:'Classic',          price: 3100  },
      { code: 'startimes-super', name: 'Super',            price: 4900  },
    ],
  },
]

export default function CableTvPage() {
  const { balance, refreshBalance } = useAuth()
  const toast = useToast()

  const [provider,      setProvider]    = useState('dstv')
  const [decoder,       setDecoder]     = useState('')
  const [phone,         setPhone]       = useState('')
  const [selectedPkg,   setSelectedPkg] = useState<typeof PROVIDERS[0]['packages'][0] | null>(null)
  const [decoderInfo,   setDecoderInfo] = useState<DecoderInfo | null>(null)
  const [verifying,     setVerifying]   = useState(false)
  const [error,         setError]       = useState('')
  const [pinOpen,       setPinOpen]     = useState(false)
  const [receipt,       setReceipt]     = useState<{ open: boolean; status: 'success'|'failed'; ref: string } | null>(null)

  const providerObj = PROVIDERS.find(p => p.id === provider)!

  const handleVerify = async () => {
    if (!decoder.trim()) { setError('Enter your smart card / decoder number'); return }
    setError(''); setVerifying(true); setDecoderInfo(null)
    try {
      const res = await cableApi.verifyDecoder(decoder, provider)
      setDecoderInfo(res.data.data)
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setVerifying(false) }
  }

  const handleBuy = () => {
    if (!decoderInfo)   { setError('Verify your decoder first'); return }
    if (!selectedPkg)   { setError('Select a subscription package'); return }
    if (!phone.trim())  { setError('Enter a phone number'); return }
    setError(''); setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    if (!selectedPkg) return
    const res = await cableApi.purchase({
      provider, decoderNumber: decoder,
      variationCode: selectedPkg.code,
      amount: selectedPkg.price, phone, pin,
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
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(219,39,119,0.10)' }}>
            <Tv size={21} style={{ color: '#DB2777' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Cable TV</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance: {balance ? formatNaira(balance.main + balance.bonus) : '---'}</p>
          </div>
        </div>

        {/* Provider */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Select Provider</p>
          <div className="grid grid-cols-3 gap-3">
            {PROVIDERS.map(p => (
              <button key={p.id} onClick={() => { setProvider(p.id); setDecoderInfo(null); setSelectedPkg(null) }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                style={{
                  background:  provider === p.id ? p.bg : 'var(--color-surface-elevated)',
                  borderColor: provider === p.id ? p.color : 'var(--color-border)',
                  cursor: 'pointer',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-800 text-xs text-white"
                     style={{ background: p.color, fontWeight: 800 }}>
                  {p.label.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-700" style={{ fontWeight: 700, color: provider === p.id ? p.color : 'var(--color-text-secondary)' }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Decoder verification */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Smart Card / Decoder Number</p>
          <div className="flex gap-3">
            <input type="text" value={decoder} onChange={e => { setDecoder(e.target.value); setDecoderInfo(null) }}
              className="input flex-1" placeholder="Enter decoder number" />
            <button onClick={handleVerify} disabled={verifying || !decoder}
              className="btn btn-outline shrink-0" style={{ borderRadius: 'var(--radius-md)' }}>
              {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
            </button>
          </div>

          {decoderInfo && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl" style={{ background: 'var(--color-success-subtle)' }}>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{decoderInfo.customerName}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Current: {decoderInfo.currentPackage}</p>
                  {decoderInfo.dueDate && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Due: {decoderInfo.dueDate}</p>}
                </div>
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

        {/* Package selection */}
        {decoderInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-5 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
            <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Choose Package</p>
            <div className="flex flex-col gap-2">
              {providerObj.packages.map(pkg => (
                <button key={pkg.code} onClick={() => setSelectedPkg(pkg)}
                  className="flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left w-full"
                  style={{
                    background:  selectedPkg?.code === pkg.code ? providerObj.bg : 'var(--color-surface-elevated)',
                    borderColor: selectedPkg?.code === pkg.code ? providerObj.color : 'var(--color-border)',
                    cursor: 'pointer',
                  }}>
                  <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: selectedPkg?.code === pkg.code ? providerObj.color : 'var(--color-text-primary)' }}>
                    {providerObj.label} {pkg.name}
                  </p>
                  <p className="font-heading text-base font-800" style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>
                    {formatNaira(pkg.price)}
                  </p>
                </button>
              ))}
            </div>

            <div>
              <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone Number</p>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input" placeholder="0801 234 5678" />
            </div>

            {selectedPkg && (
              <button onClick={handleBuy}
                className="btn w-full justify-center text-white"
                style={{ background: '#DB2777', boxShadow: '0 4px 15px rgba(219,39,119,0.35)' }}>
                <Tv size={17} />
                Pay {formatNaira(selectedPkg.price)} for {providerObj.label} {selectedPkg.name}
              </button>
            )}
          </motion.div>
        )}
      </div>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handleConfirmPin}
        description={selectedPkg && decoderInfo ? `${decoderInfo.customerName} — ${providerObj.label} ${selectedPkg.name}` : undefined} />

      {receipt && (
        <ReceiptModal
          isOpen={receipt.open} status={receipt.status}
          title={`${providerObj.label} ${selectedPkg?.name || ''}`}
          amount={selectedPkg?.price || 0} reference={receipt.ref}
          details={[
            { label: 'Provider',  value: providerObj.label },
            { label: 'Decoder',   value: decoder },
            { label: 'Customer',  value: decoderInfo?.customerName || '' },
            { label: 'Package',   value: selectedPkg?.name || '' },
          ]}
          onClose={() => setReceipt(null)}
        />
      )}
    </DashLayout>
  )
}
