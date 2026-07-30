import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id:      string
  type:    ToastType
  title:   string
  message?: string
  duration?: number
}

interface ToastContextValue {
  success: (title: string, message?: string) => void
  error:   (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info:    (title: string, message?: string) => void
}

// ─── Context ──────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, type, title, message, duration }])
  }, [])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ctx: ToastContextValue = {
    success: (t, m) => add('success', t, m),
    error:   (t, m) => add('error',   t, m, 6000),
    warning: (t, m) => add('warning', t, m),
    info:    (t, m) => add('info',    t, m),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
        style={{ maxWidth: '380px', width: 'calc(100vw - 32px)' }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ─── Individual Toast ─────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onRemove])

  const styles: Record<ToastType, {
    bg: string; border: string; icon: typeof CheckCircle2; iconColor: string
  }> = {
    success: { bg: 'var(--color-surface)',   border: 'var(--color-success)',  icon: CheckCircle2, iconColor: 'var(--color-success)'  },
    error:   { bg: 'var(--color-surface)',   border: 'var(--color-error)',    icon: XCircle,      iconColor: 'var(--color-error)'    },
    warning: { bg: 'var(--color-surface)',   border: 'var(--color-warning)',  icon: AlertCircle,  iconColor: 'var(--color-warning)'  },
    info:    { bg: 'var(--color-surface)',   border: 'var(--color-primary)',  icon: Info,         iconColor: 'var(--color-primary)'  },
  }

  const style = styles[toast.type]
  const Icon  = style.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.92  }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg"
      style={{
        background:  style.bg,
        borderLeft:  `4px solid ${style.border}`,
        boxShadow:   'var(--shadow-lg)',
      }}
    >
      <Icon size={19} style={{ color: style.iconColor, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm font-700"
           style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs mt-0.5 leading-relaxed"
             style={{ color: 'var(--color-text-secondary)' }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
      >
        <X size={15} />
      </button>
    </motion.div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>')
  return ctx
}
