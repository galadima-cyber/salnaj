import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, CheckCircle2, ArrowRight, Zap } from 'lucide-react'
import { api, getErrorMessage } from '@/services/api'
import { brandConfig } from '@/config/brand.config'

export default function VerifyEmailPage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const userId      = params.get('userId') || ''
  const email       = params.get('email')  || ''

  const [otp,       setOtp]       = useState(['', '', '', '', '', ''])
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [success,   setSuccess]   = useState(false)
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  useEffect(() => { refs[0].current?.focus() }, [])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next); setError('')
    if (val && i < 5) refs[i + 1].current?.focus()
    if (val && i === 5) handleVerify([...next])
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus()
    if (e.key === 'Enter') handleVerify()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const digits = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setOtp(digits)
    refs[Math.min(pasted.length, 5)].current?.focus()
    if (pasted.length === 6) handleVerify(digits)
  }

  const handleVerify = async (digits = otp) => {
    const code = digits.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    if (!userId)         { setError('Invalid verification link. Please register again.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/verify-email', { userId, otp: code })
      setSuccess(true)
      setTimeout(() => navigate('/login?verified=1'), 2500)
    } catch (err) {
      setError(getErrorMessage(err))
      setOtp(['', '', '', '', '', ''])
      refs[0].current?.focus()
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setResending(true); setResendMsg('')
    try {
      await api.post('/auth/send-otp', { userId, purpose: 'EMAIL_VERIFY' })
      setResendMsg('New OTP sent! Check your inbox.')
    } catch (err) {
      setResendMsg(getErrorMessage(err))
    } finally { setResending(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
           style={{ background: 'var(--color-bg)' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-elevated w-full max-w-sm p-10 flex flex-col items-center gap-5 text-center"
          style={{ borderRadius: 'var(--radius-2xl)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
               style={{ background: 'var(--color-success-subtle)' }}>
            <CheckCircle2 size={42} style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-800 mb-2"
                style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Email Verified!</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Your account is now active. Redirecting you to login...
            </p>
          </div>
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md animate-fadeInUp">
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'var(--color-primary)' }}>
            <Zap size={20} color="white" fill="white" />
          </div>
          <span className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {brandConfig.app.logoText}
          </span>
        </Link>

        <div className="card-elevated p-8 flex flex-col items-center gap-6 text-center"
             style={{ borderRadius: 'var(--radius-2xl)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
               style={{ background: 'var(--color-primary-muted)' }}>
            <Mail size={28} style={{ color: 'var(--color-primary)' }} />
          </div>

          <div>
            <h1 className="font-heading text-2xl font-800 mb-2"
                style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Verify your email
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              We sent a 6-digit code to{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {email || 'your email address'}
              </strong>
              . Enter it below.
            </p>
          </div>

          {/* OTP inputs */}
          <div className="flex gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-800 rounded-2xl border-2 outline-none transition-all"
                style={{
                  fontWeight: 800, fontFamily: 'var(--font-heading)',
                  background:  'var(--color-surface-elevated)',
                  borderColor: error ? 'var(--color-error)' : d ? 'var(--color-primary)' : 'var(--color-border)',
                  color:       'var(--color-text-primary)',
                  boxShadow:   d ? '0 0 0 3px var(--color-primary-muted)' : 'none',
                }}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
          )}

          <button
            onClick={() => handleVerify()}
            disabled={loading || otp.join('').length < 6}
            className="btn btn-primary w-full justify-center"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Verifying...</>
              : <>Verify Email <ArrowRight size={18} /></>
            }
          </button>

          <div className="flex flex-col gap-2 w-full">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Didn't receive it?{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                className="hover:underline font-600"
                style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {resending ? 'Resending...' : 'Resend code'}
              </button>
            </p>
            {resendMsg && (
              <p className="text-xs"
                 style={{ color: resendMsg.includes('sent') ? 'var(--color-success)' : 'var(--color-error)' }}>
                {resendMsg}
              </p>
            )}
          </div>

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Wrong email?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Start over
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
