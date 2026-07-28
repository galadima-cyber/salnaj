import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { brandConfig } from '@/config/brand.config'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z
    .string()
    .regex(/^(0[789][01]\d{8}|(\+234)[789][01]\d{8})$/, 'Enter a valid Nigerian phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  referralCode: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to continue' }) }),
})
type FormData = z.infer<typeof schema>

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number',      ok: /\d/.test(password) },
    { label: 'Contains uppercase',     ok: /[A-Z]/.test(password) },
    { label: 'Contains a symbol',      ok: /[^a-zA-Z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const strengthColor = [
    '',
    'var(--color-error)',
    'var(--color-warning)',
    'var(--color-accent)',
    'var(--color-success)',
  ][score]

  if (!password) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= score ? strengthColor : 'var(--color-border)' }}
            />
          ))}
        </div>
        {score > 0 && (
          <span className="text-xs font-600" style={{ color: strengthColor, fontWeight: 600 }}>
            {strengthLabel}
          </span>
        )}
      </div>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.ok
              ? <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
              : <XCircle size={12} style={{ color: 'var(--color-border-strong)' }} />
            }
            <span style={{ color: c.ok ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const defaultRef = params.get('ref') || ''
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')
  const [watchedPass, setWatchedPass] = useState('')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { referralCode: defaultRef },
  })

  // Watch password for strength indicator
  const passwordValue = watch('password', '')

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      await new Promise(r => setTimeout(r, 1400))
      console.log('Register:', data)
      navigate('/verify-email')
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-primary-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-0 w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', filter: 'blur(50px)' }} />
          <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', filter: 'blur(60px)' }} />
        </div>

        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap size={20} color="white" fill="white" />
          </div>
          <span className="font-heading text-xl text-white" style={{ fontWeight: 800 }}>
            {brandConfig.app.logoText}
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-heading text-3xl text-white mb-4" style={{ fontWeight: 800, lineHeight: 1.2 }}>
            Join 50,000+ Nigerians already saving on data.
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Create your account in 60 seconds and start buying data, airtime, and paying bills smarter.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-4">
            {[
              { emoji: '⚡', title: '< 8 second delivery', sub: 'Fastest in Nigeria' },
              { emoji: '🧠', title: 'Smart Buy engine', sub: 'Best deal, every time' },
              { emoji: '🔒', title: 'Auto-reversal protection', sub: 'Your money is safe' },
              { emoji: '🎁', title: 'Earn on referrals', sub: 'Invite friends, earn cash' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base shrink-0">
                  {f.emoji}
                </div>
                <div>
                  <p className="text-white text-sm font-600" style={{ fontWeight: 600 }}>{f.title}</p>
                  <p className="text-white/60 text-xs">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          © {brandConfig.app.year} {brandConfig.app.name}
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-fadeInUp">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <span className="font-heading text-lg" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {brandConfig.app.logoText}
            </span>
          </Link>

          <div className="mb-7">
            <h1 className="font-heading text-2xl md:text-3xl mb-2" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Create your account
            </h1>
            <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-600 hover:underline" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {serverError && (
              <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--color-error-subtle)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)' }}>
                {serverError}
              </div>
            )}

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                Full name
              </label>
              <input {...register('fullName')} type="text" className="input" placeholder="Musa Ibrahim" autoComplete="name" autoFocus />
              {errors.fullName && <p className="text-xs" style={{ color: 'var(--color-error)' }}>{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                Email address
              </label>
              <input {...register('email')} type="email" className="input" placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p className="text-xs" style={{ color: 'var(--color-error)' }}>{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                Phone number
              </label>
              <div className="relative flex">
                <div className="flex items-center px-3 rounded-l-xl border-r-0 border shrink-0 gap-1.5"
                     style={{ background: 'var(--color-surface-elevated)', border: '1.5px solid var(--color-border)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  🇳🇬 +234
                </div>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input"
                  placeholder="0801 234 5678"
                  autoComplete="tel"
                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                />
              </div>
              {errors.phone && <p className="text-xs" style={{ color: 'var(--color-error)' }}>{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  onChange={e => setWatchedPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrength password={passwordValue || watchedPass} />
              {errors.password && <p className="text-xs" style={{ color: 'var(--color-error)' }}>{errors.password.message}</p>}
            </div>

            {/* Referral Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-600 flex items-center gap-1" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                Referral code
                <span className="text-xs font-400" style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input {...register('referralCode')} type="text" className="input" placeholder="e.g. SNJ-ABC123" />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <div className="relative mt-0.5">
                <input
                  {...register('terms')}
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                />
              </div>
              <label htmlFor="terms" className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                I agree to Salnaj's{' '}
                <Link to="/terms" className="hover:underline" style={{ color: 'var(--color-primary)' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="hover:underline" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs -mt-2" style={{ color: 'var(--color-error)' }}>{errors.terms.message}</p>}

            <button type="submit" className="btn btn-primary w-full justify-center mt-1" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                : <>Create account <ArrowRight size={18} /></>
              }
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--color-text-muted)' }}>
            By signing up, you agree to our terms. Your account is protected by
            256-bit encryption.
          </p>
        </div>
      </div>
    </div>
  )
}
