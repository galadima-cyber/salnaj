import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Copy, CheckCheck, Share2, Gift,
  TrendingUp, ChevronRight, Sparkles,
} from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { useAuth } from '@/context/AuthContext'
import { brandConfig }  from '@/config/brand.config'
import { formatNaira }  from '@/utils'

// Mock earnings — replace with real API call
const MOCK_EARNINGS = [
  { name: 'Fatimah A.',  phone: '0801***678', earned: 150, date: '2 days ago',  type: 'Signup Bonus' },
  { name: 'Emeka O.',    phone: '0812***901', earned: 150, date: '5 days ago',  type: 'Signup Bonus' },
  { name: 'Rashida M.',  phone: '0903***234', earned: 150, date: '1 week ago',  type: 'Signup Bonus' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Share your link', desc: 'Copy your unique referral link and share it with friends on WhatsApp, Instagram, or anywhere.' },
  { step: '02', title: 'Friend signs up', desc: 'Your friend creates an account using your referral code.' },
  { step: '03', title: 'Both earn!', desc: `Your friend gets ₦${brandConfig.limits.minWalletFunding} bonus. You earn ₦150 when they fund their wallet.` },
]

export default function ReferralPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const referralCode = user?.referralCode || 'SNJ-XXXXX'
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`
  const totalEarned  = MOCK_EARNINGS.reduce((s, e) => s + e.earned, 0)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const text = `🚀 Join me on Salnaj — Nigeria's smartest VTU platform!\n\nBuy data, airtime, and pay bills instantly. Use my referral link and get a ₦100 bonus:\n\n${referralLink}`
    if (navigator.share) {
      navigator.share({ title: 'Join Salnaj', text, url: referralLink })
    } else {
      handleCopy(text)
    }
  }

  return (
    <DashLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-secondary-muted)' }}>
            <Users size={21} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Referral Program</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Invite friends — both of you earn</p>
          </div>
        </div>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-7 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--color-secondary-dark), var(--color-secondary))', borderRadius: 'var(--radius-2xl)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Gift size={26} color="white" />
            </div>
            <p className="font-heading text-4xl text-white mb-1" style={{ fontWeight: 800 }}>
              {formatNaira(totalEarned)}
            </p>
            <p className="text-white/70 text-sm">Total referral earnings</p>
            <div className="flex justify-center gap-6 mt-5">
              <div>
                <p className="font-heading text-2xl text-white font-800" style={{ fontWeight: 800 }}>{MOCK_EARNINGS.length}</p>
                <p className="text-white/60 text-xs">Referrals</p>
              </div>
              <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <p className="font-heading text-2xl text-white font-800" style={{ fontWeight: 800 }}>₦150</p>
                <p className="text-white/60 text-xs">Per referral</p>
              </div>
              <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <p className="font-heading text-2xl text-white font-800" style={{ fontWeight: 800 }}>₦100</p>
                <p className="text-white/60 text-xs">Friend gets</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Referral code + link */}
        <div className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Your Referral Code</p>

          {/* Code */}
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--color-surface-elevated)' }}>
            <p className="font-mono text-xl font-800 flex-1" style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              {referralCode}
            </p>
            <button onClick={() => handleCopy(referralCode)}
              className="btn btn-primary btn-sm shrink-0">
              {copied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>

          {/* Link */}
          <div>
            <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Referral Link</p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-xl text-xs truncate" style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {referralLink}
              </div>
              <button onClick={() => handleCopy(referralLink)} className="btn btn-outline btn-sm shrink-0">
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* Share button */}
          <button onClick={handleShare} className="btn btn-secondary w-full justify-center">
            <Share2 size={17} /> Share on WhatsApp / Social
          </button>
        </div>

        {/* How it works */}
        <div className="card p-6" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={16} style={{ color: 'var(--color-accent-dark)' }} />
            <h2 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>How it works</h2>
          </div>
          <div className="flex flex-col gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="flex gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-heading font-800 text-sm"
                     style={{ fontWeight: 800, background: i === 0 ? 'var(--color-secondary)' : 'var(--color-secondary-muted)', color: i === 0 ? 'white' : 'var(--color-secondary)' }}>
                  {step.step}
                </div>
                <div>
                  <p className="font-heading text-sm font-700 mb-0.5" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{step.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings list */}
        <div className="card overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: 'var(--color-secondary)' }} />
              <h2 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Referral Earnings</h2>
            </div>
          </div>

          {MOCK_EARNINGS.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
              <Users size={36} style={{ color: 'var(--color-border-strong)' }} />
              <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>No referrals yet</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Share your link above to start earning</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {MOCK_EARNINGS.map((e, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-700 shrink-0"
                       style={{ background: 'var(--color-secondary)', fontWeight: 700 }}>
                    {e.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-700 truncate" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{e.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.phone} · {e.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading text-base font-800" style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>+{formatNaira(e.earned)}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.type}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashLayout>
  )
}
