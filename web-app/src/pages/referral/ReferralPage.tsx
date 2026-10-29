import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Copy, CheckCheck, Share2, Gift,
  ArrowRight, Clock, AlertCircle, Wallet, ArrowDownLeft,
} from 'lucide-react'
import { DashLayout } from '@/components/layout/DashLayout'
import { PinModal } from '@/components/ui/PinModal'
import { referralApi, ReferralStats } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { formatNaira } from '@/utils'

export default function ReferralPage() {
  const { user, refreshBalance } = useAuth()
  const toast = useToast()

  const [stats,       setStats]       = useState<ReferralStats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [copiedCode,  setCopiedCode]  = useState(false)
  const [copiedLink,  setCopiedLink]  = useState(false)
  const [withdrawOpen,setWithdrawOpen]= useState(false)
  const [withdrawAmt, setWithdrawAmt] = useState('500')
  const [withdrawErr, setWithdrawErr] = useState('')
  const [pinOpen,     setPinOpen]     = useState(false)

  const referralCode = stats?.referralCode || user?.referralCode || 'SALNAJ'
  const referralLink = stats?.referralLink || `${window.location.origin}/register?ref=${referralCode}`
  const referralBal  = stats?.referralBalance ?? 0

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await referralApi.getStats()
      if (res.data.data) {
        setStats(res.data.data)
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
    toast.success('Referral Code Copied!', referralCode)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    toast.success('Referral Link Copied!', referralLink)
  }

  const handleShare = () => {
    const text = `🚀 Join me on Salnaj — Nigeria's fastest & most reliable VTU platform!\n\nBuy data, airtime, and pay bills instantly. Sign up with my referral code ${referralCode} and get a ₦100 bonus on your first wallet funding:\n\n${referralLink}`
    if (navigator.share) {
      navigator.share({ title: 'Join Salnaj', text, url: referralLink }).catch(() => {})
    } else {
      handleCopyLink()
    }
  }

  const handleStartWithdraw = () => {
    const num = parseFloat(withdrawAmt) || 0
    if (num < 500) {
      setWithdrawErr('Minimum withdrawal is ₦500')
      return
    }
    if (num > referralBal) {
      setWithdrawErr('Amount exceeds your current referral balance')
      return
    }
    setWithdrawErr('')
    setWithdrawOpen(false)
    setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    const num = parseFloat(withdrawAmt) || 0
    try {
      const res = await referralApi.withdraw({ amount: num, pin })
      setPinOpen(false)
      toast.success('Funds Transferred!', res.data.message || `₦${num.toLocaleString()} transferred to your main wallet!`)
      refreshBalance()
      loadStats()
    } catch (err) {
      const msg = getErrorMessage(err)
      toast.error('Withdrawal Failed', msg)
      throw err
    }
  }

  return (
    <DashLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-secondary-muted)' }}
          >
            <Users size={21} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Referral Program & Earnings
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Invite friends — your earnings are securely kept in a dedicated referral balance
            </p>
          </div>
        </div>

        {/* ── Separate Referral Wallet Balance Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)',
          }}
        >
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gift size={16} />
                <p className="text-white/80 text-xs font-700 uppercase tracking-wider">
                  Separate Referral Balance
                </p>
              </div>
              <p className="font-heading text-4xl sm:text-5xl font-800 tracking-tight" style={{ fontWeight: 800 }}>
                {formatNaira(referralBal)}
              </p>
              <p className="text-white/70 text-xs mt-1.5 max-w-sm leading-relaxed">
                Referral bonuses are kept separate from your main wallet until you choose to transfer them.
              </p>
            </div>

            <div className="shrink-0 flex sm:flex-col gap-2">
              <button
                type="button"
                onClick={() => { setWithdrawAmt(String(Math.max(500, referralBal))); setWithdrawOpen(true); }}
                disabled={referralBal < 500}
                className="btn bg-white text-emerald-800 hover:bg-white/90 text-sm font-700 px-5 py-3 rounded-2xl shadow-md transition-all justify-center"
                style={{ opacity: referralBal < 500 ? 0.6 : 1 }}
              >
                <ArrowDownLeft size={16} /> Transfer to Main Wallet
              </button>
              {referralBal < 500 && (
                <p className="text-white/60 text-xs text-center">Min. transfer: ₦500</p>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div
            className="grid grid-cols-3 gap-3 mt-6 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div>
              <p className="text-white/70 text-xs">Total Earned</p>
              <p className="font-heading text-lg font-800 mt-0.5">
                {formatNaira(stats?.totalEarned ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-xs">Referred Users</p>
              <p className="font-heading text-lg font-800 mt-0.5">
                {stats?.totalReferred ?? 0}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-xs">Per Referral</p>
              <p className="font-heading text-lg font-800 mt-0.5">
                ₦150
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Share & Referral Link Section ── */}
        <div className="card p-6 flex flex-col gap-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div>
            <h2 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Your Unique Referral Details
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Give your friends this code or link. When they register and fund their wallet, you earn ₦150 instantly!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Referral Code Box */}
            <div
              className="p-4 rounded-2xl flex items-center justify-between"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
            >
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Referral Code</p>
                <p className="font-mono text-lg font-800" style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                  {referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn-outline btn-sm"
              >
                {copiedCode ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Native Share Box */}
            <div
              className="p-4 rounded-2xl flex items-center justify-between"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
            >
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Share Link</p>
                <p className="text-xs font-mono truncate max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {referralLink}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-outline btn-sm"
                  title="Copy Link"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="btn btn-primary btn-sm"
                >
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Referred Friends List ── */}
        <div className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
          <h2 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Referred Friends ({stats?.referredUsers?.length || 0})
          </h2>

          {(!stats?.referredUsers || stats.referredUsers.length === 0) ? (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No referred friends yet. Share your link above to start earning!
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {stats.referredUsers.map(u => (
                <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-heading font-700 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {u.name}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                      {u.phone} · Joined {new Date(u.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-700"
                    style={{
                      background: u.hasFunded ? 'var(--color-success-subtle)' : 'var(--color-surface-elevated)',
                      color: u.hasFunded ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
                  >
                    {u.hasFunded ? 'Wallet Funded ✓' : 'Registered'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Withdrawal to Main Wallet Modal ── */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-subtle)' }}>
                <Wallet size={18} style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <h3 className="font-heading text-base font-800" style={{ color: 'var(--color-text-primary)' }}>
                  Transfer to Main Wallet
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Available: {formatNaira(referralBal)}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                Amount to Transfer (₦)
              </label>
              <input
                type="number"
                value={withdrawAmt}
                onChange={e => setWithdrawAmt(e.target.value)}
                min={500}
                max={referralBal}
                step={100}
                className="input font-heading font-700 text-lg"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Min transfer: ₦500. Funds will be instantly available for spending.
              </p>
            </div>

            {withdrawErr && (
              <p className="text-xs" style={{ color: 'var(--color-error)' }}>{withdrawErr}</p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setWithdrawOpen(false)}
                className="btn btn-outline flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartWithdraw}
                className="btn btn-primary flex-1 justify-center"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PIN Confirmation */}
      <PinModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={handleConfirmPin}
        title="Confirm Transfer"
        description={`Transfer ${formatNaira(parseFloat(withdrawAmt) || 0)} from Referral to Main Wallet`}
      />
    </DashLayout>
  )
}
