import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2, Wallet, ArrowRight, RefreshCw } from 'lucide-react'
import { walletApi } from '@/services/endpoints'
import { useAuth } from '@/context/AuthContext'
import { DashLayout } from '@/components/layout/DashLayout'

export default function WalletCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refreshBalance } = useAuth()

  const reference = params.get('reference') || params.get('trxref') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const [message, setMessage] = useState('Verifying your payment with Paystack...')
  const [attempt, setAttempt] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const maxAttempts = 5
  const retryDelay = 3000  // 3 seconds between retries
  const attemptRef = useRef(0)

  const verify = async (isManual = false) => {
    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference was provided.')
      return
    }

    if (isManual) setRetrying(true)

    try {
      const res = await walletApi.verifyFunding(reference)
      if (res.data.success && res.data.data?.status === 'success') {
        setStatus('success')
        setMessage(res.data.message || 'Payment verified! Your wallet has been credited.')
        await refreshBalance()
      } else {
        // Payment processed but status unclear — treat as success if message says so
        if (res.data.success) {
          setStatus('success')
          setMessage(res.data.message || 'Wallet credited successfully.')
          await refreshBalance()
        } else {
          throw new Error(res.data.message || 'Verification returned an unknown status.')
        }
      }
    } catch (err: any) {
      const currentAttempt = attemptRef.current + 1
      attemptRef.current = currentAttempt

      const serverMsg: string = err.response?.data?.message || ''

      // If Paystack itself says payment failed (not a connectivity issue), stop retrying
      if (serverMsg.toLowerCase().includes('failed') || serverMsg.toLowerCase().includes('abandoned')) {
        setStatus('failed')
        setMessage('This payment was not completed. No amount was deducted from your account.')
        if (isManual) setRetrying(false)
        return
      }

      // If we haven't exhausted retries and it's not a manual retry, try again
      if (currentAttempt < maxAttempts && !isManual) {
        setAttempt(currentAttempt)
        setMessage(`Verifying payment... (attempt ${currentAttempt + 1} of ${maxAttempts})`)
        setTimeout(() => verify(), retryDelay)
      } else {
        // Exhausted retries or manual — show pending state
        setStatus('pending')
        setMessage(
          'Your payment is being processed. If your bank account was debited, your wallet will be credited automatically within a few minutes. You can safely close this page.'
        )
      }
    } finally {
      if (isManual) setRetrying(false)
    }
  }

  useEffect(() => {
    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])

  return (
    <DashLayout>
      <div
        className="max-w-md mx-auto my-12 p-8 rounded-2xl border flex flex-col items-center text-center animate-fadeInUp"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Loading */}
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--color-primary-muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
            {attempt > 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                This may take a moment. Please do not close this page.
              </p>
            )}
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              Payment Successful! 🎉
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate('/wallet')}
                className="btn btn-primary flex-1 justify-center gap-2"
              >
                <Wallet size={18} /> View Wallet
              </button>
              <Link to="/dashboard" className="btn btn-secondary flex-1 justify-center gap-2">
                Dashboard <ArrowRight size={18} />
              </Link>
            </div>
          </>
        )}

        {/* Pending (retry exhausted but not definitively failed) */}
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(234,179,8,0.12)' }}>
              <Loader2 size={36} style={{ color: '#ca8a04' }} className="animate-spin" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">Payment Processing</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
            <div className="w-full p-4 rounded-xl mb-6" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <p className="text-xs font-medium" style={{ color: '#ca8a04' }}>
                📋 Reference: <span className="font-mono">{reference}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Keep this reference in case you need to contact support.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  setStatus('loading')
                  setMessage('Re-checking your payment...')
                  attemptRef.current = 0
                  verify(true)
                }}
                disabled={retrying}
                className="btn btn-primary w-full justify-center gap-2"
              >
                {retrying ? <><Loader2 size={17} className="animate-spin" /> Checking...</> : <><RefreshCw size={17} /> Check Again</>}
              </button>
              <button onClick={() => navigate('/wallet')} className="btn btn-secondary w-full justify-center">
                Go to Wallet
              </button>
            </div>
          </>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
              <AlertCircle size={36} className="text-rose-500" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">Payment Not Completed</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/wallet')}
                className="btn btn-primary w-full justify-center gap-2"
              >
                Try Again
              </button>
              <Link to="/dashboard" className="btn btn-secondary w-full justify-center">
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </DashLayout>
  )
}
