import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'

interface AccountCreatedProps {
  userId:   string
  email:    string
  fullName: string
}

export function AccountCreatedScreen({ userId, email, fullName }: AccountCreatedProps) {
  const [resending, setResending]   = useState(false)
  const [resendMsg, setResendMsg]   = useState('')

  const handleResend = async () => {
    setResending(true); setResendMsg('')
    try {
      await api.post('/auth/send-otp', { purpose: 'EMAIL_VERIFY' })
      setResendMsg('OTP resent! Check your inbox.')
    } catch {
      setResendMsg('Could not resend. Please try again in a minute.')
    } finally {
      setResending(false)
    }
  }

  const name = fullName.split(' ')[0] // First name only

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'var(--color-bg)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="card-elevated w-full max-w-md p-10 flex flex-col items-center text-center gap-6"
        style={{ borderRadius: 'var(--radius-2xl)' }}
      >
        {/* Animated check */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-success-subtle)' }}
        >
          <CheckCircle2 size={40} style={{ color: 'var(--color-success)' }} />
        </motion.div>

        {/* Text */}
        <div>
          <h1 className="font-heading text-2xl font-800 mb-2"
              style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Welcome to Salnaj, {name}! 🎉
          </h1>
          <p className="text-base leading-relaxed"
             style={{ color: 'var(--color-text-secondary)' }}>
            Your account has been created successfully.
          </p>
        </div>

        {/* Email info */}
        <div className="w-full p-4 rounded-2xl flex items-start gap-3"
             style={{ background: 'var(--color-primary-muted)' }}>
          <Mail size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
          <div className="text-left">
            <p className="font-heading text-sm font-700 mb-0.5"
               style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              Verify your email to continue
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              We sent a 6-digit OTP to <strong>{email}</strong>.
              Enter it on the next screen to activate your account.
            </p>
          </div>
        </div>

        {/* What's next */}
        <div className="w-full flex flex-col gap-2">
          {[
            '✅ Account created',
            '📧 Verify your email (next step)',
            '💳 Fund your wallet',
            '⚡ Buy data, airtime & pay bills',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl text-left"
                 style={{ background: i === 0 ? 'var(--color-success-subtle)' : 'var(--color-surface-elevated)' }}>
              <p className="text-sm" style={{ color: i === 0 ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to={`/verify-email?userId=${userId}&email=${encodeURIComponent(email)}`}
          className="btn btn-primary btn-lg w-full justify-center"
        >
          Verify Email Now <ArrowRight size={18} />
        </Link>

        {/* Resend */}
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Didn't receive the email?{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            className="hover:underline inline-flex items-center gap-1"
            style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {resending ? <><Loader2 size={13} className="animate-spin" /> Resending...</> : 'Resend OTP'}
          </button>
        </p>
        {resendMsg && (
          <p className="text-sm" style={{ color: resendMsg.includes('resent') ? 'var(--color-success)' : 'var(--color-error)' }}>
            {resendMsg}
          </p>
        )}

        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Already verified?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Log in</Link>
        </p>
      </motion.div>
    </div>
  )
}
