import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Share2, ArrowRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatNaira } from '@/utils'

interface ReceiptModalProps {
  isOpen:    boolean
  status:    'success' | 'failed'
  title:     string
  amount:    number
  reference: string
  details?:  Array<{ label: string; value: string }>
  token?:    string
  onClose:   () => void
  onRetry?:  () => void
}

export function ReceiptModal({
  isOpen, status, title, amount, reference, details = [], token, onClose, onRetry,
}: ReceiptModalProps) {
  const isSuccess = status === 'success'

  const handleShare = async () => {
    const text = [
      `${title} — ${isSuccess ? 'Successful ✅' : 'Failed ❌'}`,
      `Amount: ${formatNaira(amount)}`,
      `Reference: ${reference}`,
      token ? `Token: ${token}` : '',
      `\nPowered by Salnaj`,
    ].filter(Boolean).join('\n')

    if (navigator.share) {
      await navigator.share({ title: 'Salnaj Receipt', text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="card-elevated w-full max-w-sm flex flex-col items-center gap-5 overflow-hidden"
              style={{ borderRadius: 'var(--radius-2xl)' }}
            >
              {/* Color header */}
              <div
                className="w-full flex flex-col items-center gap-3 pt-8 pb-6 px-7"
                style={{
                  background: isSuccess
                    ? 'linear-gradient(135deg, var(--color-secondary-dark), var(--color-secondary))'
                    : 'linear-gradient(135deg, #B91C1C, #DC2626)',
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  {isSuccess
                    ? <CheckCircle2 size={36} color="white" />
                    : <XCircle      size={36} color="white" />
                  }
                </motion.div>
                <p className="font-heading text-xl text-white" style={{ fontWeight: 800 }}>
                  {isSuccess ? 'Transaction Successful!' : 'Transaction Failed'}
                </p>
                <p className="font-heading text-3xl text-white" style={{ fontWeight: 800 }}>
                  {formatNaira(amount)}
                </p>
                <p className="text-white/70 text-sm">{title}</p>
              </div>

              {/* Receipt details */}
              <div className="w-full px-7 flex flex-col gap-3">
                {/* Token highlight */}
                {token && (
                  <div
                    className="w-full p-4 rounded-2xl text-center"
                    style={{ background: 'var(--color-secondary-subtle)' }}
                  >
                    <p className="text-xs font-600 mb-1" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
                      Your Token / PIN
                    </p>
                    <p className="font-mono text-lg font-700 tracking-widest" style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                      {token}
                    </p>
                  </div>
                )}

                {/* Detail rows */}
                <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {[...details, { label: 'Reference', value: reference }].map(d => (
                    <div key={d.label} className="flex items-center justify-between py-2.5">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{d.label}</span>
                      <span className="text-sm font-600 text-right max-w-[55%] truncate" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="w-full px-7 pb-7 flex flex-col gap-3">
                <button onClick={handleShare} className="btn btn-outline w-full justify-center">
                  <Share2 size={16} /> Share Receipt
                </button>
                {isSuccess ? (
                  <Link to="/dashboard" onClick={onClose} className="btn btn-primary w-full justify-center">
                    <Home size={16} /> Back to Dashboard
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/dashboard" onClick={onClose} className="btn btn-ghost flex-1 justify-center">
                      <Home size={16} />
                    </Link>
                    {onRetry && (
                      <button onClick={onRetry} className="btn btn-primary flex-1 justify-center">
                        Retry <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
