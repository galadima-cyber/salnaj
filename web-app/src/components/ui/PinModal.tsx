import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Loader2 } from 'lucide-react'

interface PinModalProps {
  isOpen:      boolean
  onClose:     () => void
  onConfirm:   (pin: string) => Promise<void>
  title?:      string
  description?: string
}

export function PinModal({ isOpen, onClose, onConfirm, title = 'Enter Transaction PIN', description }: PinModalProps) {
  const [pin,       setPin]       = useState(['', '', '', ''])
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [shake,     setShake]     = useState(false)
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
                useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // Reset on open
  useEffect(() => {
    if (isOpen) { setPin(['','','','']); setError(''); setLoading(false); setTimeout(() => refs[0].current?.focus(), 100) }
  }, [isOpen])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...pin]; next[i] = val; setPin(next); setError('')
    if (val && i < 3) refs[i + 1].current?.focus()
    if (val && i === 3) handleSubmit([...next])
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) refs[i - 1].current?.focus()
  }

  const handleSubmit = async (digits = pin) => {
    const code = digits.join('')
    if (code.length < 4) { setError('Enter all 4 digits'); return }
    setLoading(true); setError('')
    try {
      await onConfirm(code)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Incorrect PIN'
      setError(msg); setPin(['','','',''])
      setShake(true); setTimeout(() => setShake(false), 500)
      refs[0].current?.focus()
    } finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="card-elevated w-full max-w-sm p-7 pointer-events-auto flex flex-col items-center gap-6"
              style={{ borderRadius: 'var(--radius-2xl)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-muted)' }}>
                    <Lock size={17} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</p>
                    {description && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>}
                  </div>
                </div>
                <button onClick={onClose} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* PIN inputs */}
              <motion.div
                animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex gap-3"
              >
                {pin.map((d, i) => (
                  <input
                    key={i}
                    ref={refs[i]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-14 h-14 text-center text-2xl font-800 rounded-2xl border-2 outline-none transition-all"
                    style={{
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      background: 'var(--color-surface-elevated)',
                      borderColor: d ? 'var(--color-primary)' : 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                      boxShadow: d ? '0 0 0 3px var(--color-primary-muted)' : 'none',
                    }}
                  />
                ))}
              </motion.div>

              {/* Error */}
              {error && (
                <p className="text-sm text-center" style={{ color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

              {/* Confirm button */}
              <button
                className="btn btn-primary w-full justify-center"
                onClick={() => handleSubmit()}
                disabled={loading || pin.join('').length < 4}
              >
                {loading ? <><Loader2 size={17} className="animate-spin" /> Processing...</> : 'Confirm Purchase'}
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Your PIN is encrypted and never stored in plain text.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
