import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { brandConfig } from '@/config/brand.config'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/services/api'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate       = useNavigate()
  const location       = useLocation()
  const { login }      = useAuth()
  const [showPass, setShowPass]     = useState(false)
  const [serverError, setServerError] = useState('')

  // Redirect to where user came from, or dashboard
  const from = (location.state as { from?: string })?.from || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full"
               style={{ background: 'rgba(255,255,255,0.06)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full"
               style={{ background: 'rgba(255,255,255,0.04)', filter: 'blur(60px)' }} />
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
          <h2 className="font-heading text-4xl text-white mb-4" style={{ fontWeight: 800, lineHeight: 1.15 }}>
            Welcome back to<br />smarter top-ups.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            Buy data, pay bills, and manage everything
            from one powerful platform.
          </p>
          <div className="flex flex-col gap-3">
            {[
              'Instant data delivery — under 8 seconds',
              'All networks: MTN, Airtel, Glo, 9mobile',
              'Auto-reversed if delivery fails',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} color="white" />
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          © {brandConfig.app.year} {brandConfig.app.name}. All rights reserved.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fadeInUp">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'var(--color-primary)' }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <span className="font-heading text-lg" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {brandConfig.app.logoText}
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="font-heading text-2xl md:text-3xl mb-2"
                style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Log in to your account
            </h1>
            <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-600 hover:underline"
                    style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Sign up free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-3 p-4 rounded-xl"
                   style={{ background: 'var(--color-error-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <AlertCircle size={17} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{serverError}</p>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-600"
                     style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-600"
                       style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs hover:underline"
                      style={{ color: 'var(--color-primary)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center mt-1"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <><Loader2 size={18} className="animate-spin" /> Logging in...</>
                : <>Log in <ArrowRight size={18} /></>
              }
            </button>
          </form>

          <div className="mt-8 pt-6 flex items-center gap-3"
               style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Protected by 256-bit encryption. Your account and wallet are secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
