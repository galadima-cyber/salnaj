import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw, Phone, ArrowRight, Copy, CheckCircle2,
  Clock, AlertCircle, Info, ChevronRight, XCircle, ShieldCheck,
} from 'lucide-react'
import { DashLayout } from '@/components/layout/DashLayout'
import { PinModal } from '@/components/ui/PinModal'
import { airtimeCashApi, AirtimeCashItem, AirtimeCashRate } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { formatNaira } from '@/utils'
import { MtnLogo, AirtelLogo, GloLogo, NineMobileLogo } from '@/components/ui/ProviderIcons'

const NETWORK_CARDS = [
  { id: 'MTN',      name: 'MTN',     color: '#FFCC00', icon: MtnLogo,        defaultRate: 80 },
  { id: 'AIRTEL',   name: 'Airtel',  color: '#DC2626', icon: AirtelLogo,     defaultRate: 75 },
  { id: 'GLO',      name: 'Glo',     color: '#16A34A', icon: GloLogo,        defaultRate: 70 },
  { id: 'ETISALAT', name: '9mobile', color: '#059669', icon: NineMobileLogo, defaultRate: 70 },
]

const AMOUNT_PRESETS = [1000, 2000, 5000, 10000, 20000]

export default function AirtimeToCashPage() {
  const { user, refreshBalance } = useAuth()
  const toast = useToast()

  const [activeTab,   setActiveTab]   = useState<'convert' | 'history'>('convert')
  const [network,     setNetwork]     = useState('MTN')
  const [amount,      setAmount]      = useState('2000')
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '')
  const [rates,       setRates]       = useState<Record<string, AirtimeCashRate>>({})
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [pinOpen,     setPinOpen]     = useState(false)
  const [history,     setHistory]     = useState<AirtimeCashItem[]>([])
  const [copiedCode,  setCopiedCode]  = useState(false)
  const [successInfo, setSuccessInfo] = useState<{
    reference: string
    ussdCode: string
    instructions: string
    cashPayout: number
  } | null>(null)

  // Fetch rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await airtimeCashApi.getRates()
        if (res.data.data?.rates) {
          setRates(res.data.data.rates)
        }
      } catch {
        // Fallback to default rates
      }
    }
    fetchRates()
  }, [])

  // Fetch history when tab is opened
  useEffect(() => {
    if (activeTab === 'history') {
      const fetchHistory = async () => {
        try {
          const res = await airtimeCashApi.getHistory()
          setHistory(res.data.data?.items || [])
        } catch {
          // silent error on history
        }
      }
      fetchHistory()
    }
  }, [activeTab])

  const currentRate = rates[network]?.rate || NETWORK_CARDS.find(n => n.id === network)?.defaultRate || 75
  const merchantPhone = rates[network]?.merchantPhone || '08149652233'
  const numAmount = parseFloat(amount) || 0
  const cashPayout = (numAmount * currentRate) / 100
  const feeAmount = numAmount - cashPayout

  const handleStartConversion = () => {
    setError('')
    if (numAmount < 1000) {
      setError('Minimum airtime conversion is ₦1,000')
      return
    }
    if (numAmount > 50000) {
      setError('Maximum airtime conversion per request is ₦50,000')
      return
    }
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setError('Please provide your sender phone number')
      return
    }
    setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await airtimeCashApi.submit({
        network,
        phoneNumber,
        airtimeAmount: numAmount,
        pin,
      })
      setPinOpen(false)
      const data = res.data.data
      setSuccessInfo({
        reference: data.reference,
        ussdCode: data.ussdCode,
        instructions: data.instructions,
        cashPayout: data.cashPayout,
      })
      toast.success('Conversion Request Created!', 'Follow the USSD instruction to transfer airtime.')
      refreshBalance()
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error('Conversion Failed', msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
    toast.success('Copied to clipboard!', text)
  }

  return (
    <DashLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-muted)' }}
            >
              <RefreshCw size={21} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="font-heading text-xl font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Airtime to Cash
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Convert excess SIM airtime directly to wallet cash
              </p>
            </div>
          </div>

          {/* Tab Pill */}
          <div className="flex p-1 rounded-xl" style={{ background: 'var(--color-surface)' }}>
            <button
              onClick={() => setActiveTab('convert')}
              className="px-3 py-1.5 rounded-lg text-xs font-700 transition-all"
              style={{
                background: activeTab === 'convert' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'convert' ? 'white' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Convert
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-3 py-1.5 rounded-lg text-xs font-700 transition-all"
              style={{
                background: activeTab === 'history' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'history' ? 'white' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              History
            </button>
          </div>
        </div>

        {activeTab === 'convert' ? (
          successInfo ? (
            /* Success & Transfer Instructions Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 flex flex-col gap-5 text-center"
              style={{ borderRadius: 'var(--radius-xl)' }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: 'var(--color-success-subtle)' }}
              >
                <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
              </div>

              <div>
                <h2 className="font-heading text-lg font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  Request Generated Successfully!
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Reference: <span className="font-mono font-700">{successInfo.reference}</span>
                </p>
              </div>

              <div
                className="p-5 rounded-2xl text-left flex flex-col gap-3"
                style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <Info size={16} style={{ color: 'var(--color-primary)' }} />
                  <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Step 2: Transfer Airtime via USSD
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Dial the code below from your <strong>{network}</strong> SIM (<strong>{phoneNumber}</strong>) to complete the transfer:
                </p>

                <div
                  className="flex items-center justify-between p-3 rounded-xl font-mono text-sm font-700 select-all"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                >
                  <span className="truncate">{successInfo.ussdCode}</span>
                  <button
                    onClick={() => handleCopy(successInfo.ussdCode)}
                    className="btn btn-outline btn-sm shrink-0 ml-2"
                  >
                    <Copy size={13} /> {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Expected Cash Payout:</span>
                  <span className="font-heading font-800 text-sm" style={{ fontWeight: 800, color: 'var(--color-success)' }}>
                    {formatNaira(successInfo.cashPayout)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSuccessInfo(null)}
                  className="btn btn-outline flex-1 justify-center"
                >
                  New Conversion
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="btn btn-primary flex-1 justify-center"
                >
                  View Status
                </button>
              </div>
            </motion.div>
          ) : (
            /* Conversion Form */
            <div className="flex flex-col gap-5">
              {/* Network Selector with Authentic Brand Badges */}
              <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
                <p className="font-heading text-xs font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  1. Select Network
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {NETWORK_CARDS.map(net => {
                    const active = network === net.id
                    const rate = rates[net.id]?.rate || net.defaultRate
                    const IconComponent = net.icon

                    return (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setNetwork(net.id)}
                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all text-center relative"
                        style={{
                          background: active ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
                          border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          cursor: 'pointer',
                        }}
                      >
                        <IconComponent size={40} />
                        <div>
                          <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {net.name}
                          </p>
                          <span
                            className="inline-block mt-0.5 text-xs font-700 px-2 py-0.5 rounded-full"
                            style={{
                              background: 'var(--color-success-subtle)',
                              color: 'var(--color-success)',
                              fontSize: '0.68rem',
                            }}
                          >
                            {rate}% Cash
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Amount & Sender Phone */}
              <div className="card p-5 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
                <p className="font-heading text-xs font-700" style={{ fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  2. Airtime Details
                </p>

                {/* Amount input */}
                <div>
                  <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Airtime Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Min ₦1,000"
                    min={1000}
                    max={50000}
                    step={500}
                    className="input text-lg font-heading font-700"
                  />
                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {AMOUNT_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        className="px-2.5 py-1 rounded-lg text-xs font-600 transition-all"
                        style={{
                          background: numAmount === preset ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                          color: numAmount === preset ? 'white' : 'var(--color-text-secondary)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        ₦{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sender phone number */}
                <div>
                  <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Your {network} SIM Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="input pl-10"
                    />
                    <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    The airtime will be transferred from this line.
                  </p>
                </div>
              </div>

              {/* Live Payout Breakdown Card */}
              <div
                className="p-5 rounded-2xl flex flex-col gap-3"
                style={{
                  background: 'linear-gradient(135deg, var(--color-surface-elevated), var(--color-surface))',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--color-text-muted)' }}>Conversion Rate:</span>
                  <span className="font-700 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                    {currentRate}% Payout ({100 - currentRate}% Processing Fee)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--color-text-muted)' }}>Airtime Value:</span>
                  <span className="font-600" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatNaira(numAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--color-text-muted)' }}>Service Fee:</span>
                  <span className="font-600 text-red-500">
                    -{formatNaira(feeAmount)}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center pt-2.5"
                  style={{ borderTop: '1px dashed var(--color-border)' }}
                >
                  <span className="font-heading font-700 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    You Receive (Wallet Cash):
                  </span>
                  <span className="font-heading font-800 text-xl" style={{ color: 'var(--color-success)', fontWeight: 800 }}>
                    {formatNaira(cashPayout)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--color-error-subtle)' }}>
                  <AlertCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                  <p className="text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="button"
                onClick={handleStartConversion}
                disabled={loading || numAmount < 1000}
                className="btn btn-primary w-full justify-center py-3.5 text-base font-700"
              >
                Convert to {formatNaira(cashPayout)} Now
                <ArrowRight size={17} />
              </button>

              {/* Safety notice */}
              <div className="flex items-center gap-2 justify-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
                <span>Zero hidden fees. Instant wallet credit upon SIM verification.</span>
              </div>
            </div>
          )
        ) : (
          /* Conversion History Tab */
          <div className="flex flex-col gap-3">
            {history.length === 0 ? (
              <div className="card p-10 text-center flex flex-col items-center gap-3" style={{ borderRadius: 'var(--radius-xl)' }}>
                <Clock size={32} style={{ color: 'var(--color-text-muted)' }} />
                <p className="font-heading font-700 text-base" style={{ color: 'var(--color-text-primary)' }}>
                  No conversion requests yet
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Your airtime to cash requests will appear here with live tracking.
                </p>
              </div>
            ) : (
              history.map(item => {
                const isSuccess = item.status === 'SUCCESS'
                const isPending = item.status === 'PENDING' || item.status === 'PROCESSING'

                return (
                  <div
                    key={item.id}
                    className="card p-4 flex items-center justify-between gap-3"
                    style={{ borderRadius: 'var(--radius-xl)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: isSuccess
                            ? 'var(--color-success-subtle)'
                            : isPending
                            ? 'var(--color-warning-subtle)'
                            : 'var(--color-error-subtle)',
                        }}
                      >
                        {isSuccess ? (
                          <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                        ) : isPending ? (
                          <Clock size={18} style={{ color: 'var(--color-warning)' }} />
                        ) : (
                          <XCircle size={18} style={{ color: 'var(--color-error)' }} />
                        )}
                      </div>
                      <div>
                        <p className="font-heading text-sm font-700" style={{ color: 'var(--color-text-primary)' }}>
                          {item.network} Airtime ({formatNaira(Number(item.airtimeAmount))})
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {item.reference} · {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-heading text-sm font-800" style={{ color: 'var(--color-success)' }}>
                        +{formatNaira(Number(item.cashAmount))}
                      </p>
                      <span
                        className="inline-block text-xs font-700 px-2 py-0.5 rounded-full"
                        style={{
                          background: isSuccess
                            ? 'var(--color-success-subtle)'
                            : isPending
                            ? 'var(--color-warning-subtle)'
                            : 'var(--color-error-subtle)',
                          color: isSuccess
                            ? 'var(--color-success)'
                            : isPending
                            ? 'var(--color-warning)'
                            : 'var(--color-error)',
                          fontSize: '0.65rem',
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* PIN Confirmation Modal */}
      <PinModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={handleConfirmPin}
        title="Confirm Airtime Conversion"
        description={`Convert ₦${numAmount.toLocaleString()} ${network} airtime for ₦${cashPayout.toLocaleString()} cash`}
      />
    </DashLayout>
  )
}
