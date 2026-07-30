import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2, Wallet, ArrowRight } from 'lucide-react'
import { walletApi } from '@/services/endpoints'
import { useAuth } from '@/context/AuthContext'
import { DashLayout } from '@/components/layout/DashLayout'

export default function WalletCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refreshBalance } = useAuth()

  const reference = params.get('reference') || params.get('trxref') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('Verifying your payment with Paystack...')

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference provided.')
      return
    }

    const verify = async () => {
      try {
        const res = await walletApi.verifyFunding(reference)
        if (res.data.success) {
          setStatus('success')
          setMessage(res.data.message || 'Payment successful! Your wallet has been credited.')
          await refreshBalance()
        } else {
          setStatus('failed')
          setMessage(res.data.message || 'Unable to verify payment.')
        }
      } catch (err: any) {
        setStatus('failed')
        setMessage(err.response?.data?.message || 'Payment verification failed. If your account was debited, your wallet will be updated shortly.')
      }
    }

    verify()
  }, [reference, refreshBalance])

  return (
    <DashLayout>
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border flex flex-col items-center text-center animate-fadeInUp"
           style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-sm text-secondary mb-6">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2 text-primary">Payment Successful! 🎉</h2>
            <p className="text-sm text-secondary mb-6">{message}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate('/wallet')}
                className="btn btn-primary flex-1 justify-center gap-2"
              >
                <Wallet size={18} /> View Wallet
              </button>
              <Link
                to="/dashboard"
                className="btn btn-secondary flex-1 justify-center gap-2"
              >
                Dashboard <ArrowRight size={18} />
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
              <AlertCircle size={36} className="text-rose-500" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">Verification Notice</h2>
            <p className="text-sm text-secondary mb-6">{message}</p>
            <button
              onClick={() => navigate('/wallet')}
              className="btn btn-primary w-full justify-center gap-2"
            >
              Return to Wallet
            </button>
          </>
        )}

      </div>
    </DashLayout>
  )
}
