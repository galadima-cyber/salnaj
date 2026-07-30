import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, Zap, X, Clock, CheckCircle2, Pause, Trash2 } from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { useAuth } from '@/context/AuthContext'
import { formatNaira }  from '@/utils'

// Mock schedules — replace with real API
const MOCK_SCHEDULES = [
  {
    id: '1', network: 'MTN',    plan: 'MTN 2GB',  price: 580,
    phone: '08012345678', frequency: 'Weekly',  day: 'Monday',  time: '07:00',
    isActive: true,  lastRun: '2026-07-21', nextRun: '2026-07-28', runCount: 4,
  },
  {
    id: '2', network: 'AIRTEL', plan: 'Airtel 1GB', price: 280,
    phone: '08123456789', frequency: 'Monthly', day: '1st',    time: '06:00',
    isActive: false, lastRun: '2026-07-01', nextRun: '2026-08-01', runCount: 2,
  },
]

const NETWORKS   = ['MTN', 'AIRTEL', 'GLO', '9MOBILE']
const FREQS      = ['Daily', 'Weekly', 'Monthly']
const DAYS_WEEK  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMES      = ['06:00', '07:00', '08:00', '09:00', '12:00', '18:00', '21:00']

interface NewSchedule {
  network: string; plan: string; price: string
  phone: string; frequency: string; day: string; time: string
}

export default function AutopilotPage() {
  const { balance } = useAuth()
  const [schedules,   setSchedules]  = useState(MOCK_SCHEDULES)
  const [showForm,    setShowForm]   = useState(false)
  const [form,        setForm]       = useState<NewSchedule>({
    network: 'MTN', plan: '', price: '', phone: '', frequency: 'Weekly', day: 'Monday', time: '07:00',
  })
  const [error, setError] = useState('')

  const update = (k: keyof NewSchedule, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = () => {
    if (!form.plan)  { setError('Enter a plan name'); return }
    if (!form.price) { setError('Enter the plan price'); return }
    if (!form.phone) { setError('Enter a phone number'); return }
    setError('')

    const next = {
      id:        String(Date.now()),
      network:   form.network,
      plan:      form.plan,
      price:     parseFloat(form.price),
      phone:     form.phone,
      frequency: form.frequency,
      day:       form.day,
      time:      form.time,
      isActive:  true,
      lastRun:   '—',
      nextRun:   'Scheduled',
      runCount:  0,
    }
    setSchedules(s => [next, ...s])
    setShowForm(false)
    setForm({ network: 'MTN', plan: '', price: '', phone: '', frequency: 'Weekly', day: 'Monday', time: '07:00' })
  }

  const toggleSchedule = (id: string) =>
    setSchedules(s => s.map(sc => sc.id === id ? { ...sc, isActive: !sc.isActive } : sc))

  const deleteSchedule = (id: string) =>
    setSchedules(s => s.filter(sc => sc.id !== id))

  return (
    <DashLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-secondary-muted)' }}>
              <Calendar size={21} style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div>
              <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Data Autopilot</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Never run out of data again</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> New Schedule
          </button>
        </div>

        {/* What is Autopilot */}
        {schedules.length === 0 && (
          <div className="card p-8 flex flex-col items-center gap-4 text-center" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-secondary-muted)' }}>
              <Calendar size={30} style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Set it. Forget it.</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', maxWidth: '320px' }}>
                Autopilot automatically buys your data plan on a schedule you set — daily, weekly, or monthly.
                Your wallet is charged and data delivered without lifting a finger.
              </p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn btn-secondary">
              <Plus size={17} /> Create First Schedule
            </button>
          </div>
        )}

        {/* Active schedules */}
        {schedules.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
              Your Schedules ({schedules.length})
            </p>
            {schedules.map((sc, i) => (
              <motion.div key={sc.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card p-5" style={{ borderRadius: 'var(--radius-xl)', opacity: sc.isActive ? 1 : 0.65 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Network badge */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-800 text-sm text-white shrink-0"
                         style={{ fontWeight: 800, background: sc.network === 'MTN' ? '#FFCC00' : sc.network === 'AIRTEL' ? '#DC2626' : sc.network === 'GLO' ? '#16A34A' : '#059669', color: sc.network === 'MTN' ? '#554400' : 'white' }}>
                      {sc.network[0]}
                    </div>
                    <div>
                      <p className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{sc.plan}</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{sc.phone}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <Clock size={11} /> {sc.frequency} · {sc.day} · {sc.time}
                        </span>
                        <span className="badge" style={{ background: sc.isActive ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)', color: sc.isActive ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '0.65rem' }}>
                          {sc.isActive ? '● Active' : '⏸ Paused'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading text-base font-800" style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{formatNaira(sc.price)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{sc.runCount}× run</p>
                  </div>
                </div>

                {/* Next run + actions */}
                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--color-secondary)' }} />
                    Next: <strong style={{ color: 'var(--color-text-secondary)' }}>{sc.nextRun}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSchedule(sc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-700 transition-all"
                      style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: sc.isActive ? 'var(--color-warning-subtle)' : 'var(--color-success-subtle)', color: sc.isActive ? 'var(--color-warning)' : 'var(--color-success)', border: 'none', cursor: 'pointer' }}>
                      {sc.isActive ? <><Pause size={12} /> Pause</> : <><Zap size={12} fill="currentColor" /> Resume</>}
                    </button>
                    <button onClick={() => deleteSchedule(sc.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: 'var(--color-error-subtle)', color: 'var(--color-error)', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-4" style={{ fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem' }}>How Autopilot works</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '⚡', text: 'At your set time, Salnaj checks your wallet balance automatically' },
              { icon: '💳', text: 'If balance is sufficient, the plan is purchased and data delivered instantly' },
              { icon: '📱', text: 'You receive an SMS confirmation — no action needed on your end' },
              { icon: '🔔', text: 'If balance is low, you\'ll get a notification to top up before the next cycle' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base shrink-0">{item.icon}</span>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Schedule Form — Slide-up modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[92vh] overflow-y-auto"
              style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0', boxShadow: 'var(--shadow-xl)' }}>
              <div className="flex items-center justify-between p-5 sticky top-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="font-heading text-base font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>New Autopilot Schedule</h2>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Network */}
                <div>
                  <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Network</p>
                  <div className="grid grid-cols-4 gap-2">
                    {NETWORKS.map(n => (
                      <button key={n} onClick={() => update('network', n)}
                        className="py-2.5 rounded-xl text-xs font-700 border-2 transition-all"
                        style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: form.network === n ? 'var(--color-primary-muted)' : 'var(--color-surface-elevated)', borderColor: form.network === n ? 'var(--color-primary)' : 'var(--color-border)', color: form.network === n ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan & Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Plan Name</p>
                    <input value={form.plan} onChange={e => update('plan', e.target.value)} className="input" placeholder="e.g. MTN 2GB" />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Price (₦)</p>
                    <input type="number" value={form.price} onChange={e => update('price', e.target.value)} className="input" placeholder="580" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone Number</p>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="input" placeholder="0801 234 5678" />
                </div>

                {/* Frequency */}
                <div>
                  <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Frequency</p>
                  <div className="grid grid-cols-3 gap-2">
                    {FREQS.map(f => (
                      <button key={f} onClick={() => update('frequency', f)}
                        className="py-2.5 rounded-xl text-sm font-700 border-2 transition-all"
                        style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: form.frequency === f ? 'var(--color-secondary-muted)' : 'var(--color-surface-elevated)', borderColor: form.frequency === f ? 'var(--color-secondary)' : 'var(--color-border)', color: form.frequency === f ? 'var(--color-secondary)' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day (weekly) */}
                {form.frequency === 'Weekly' && (
                  <div>
                    <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Day of Week</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {DAYS_WEEK.map(d => (
                        <button key={d} onClick={() => update('day', d)}
                          className="px-3 py-2 rounded-xl text-xs font-700 shrink-0 border-2 transition-all"
                          style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', background: form.day === d ? 'var(--color-secondary-muted)' : 'var(--color-surface-elevated)', borderColor: form.day === d ? 'var(--color-secondary)' : 'var(--color-border)', color: form.day === d ? 'var(--color-secondary)' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time */}
                <div>
                  <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Time</p>
                  <div className="flex gap-2 flex-wrap">
                    {TIMES.map(t => (
                      <button key={t} onClick={() => update('time', t)}
                        className="px-3 py-2 rounded-xl text-xs font-700 border-2 transition-all"
                        style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', background: form.time === t ? 'var(--color-primary-muted)' : 'var(--color-surface-elevated)', borderColor: form.time === t ? 'var(--color-primary)' : 'var(--color-border)', color: form.time === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {form.plan && form.phone && (
                  <div className="p-4 rounded-xl" style={{ background: 'var(--color-secondary-subtle)' }}>
                    <p className="text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                      ✅ Every {form.frequency === 'Daily' ? 'day' : form.frequency === 'Weekly' ? form.day : 'month'} at {form.time},
                      Salnaj will buy <strong>{form.plan}</strong> for <strong>{form.phone}</strong>
                      {form.price && ` for ${formatNaira(parseFloat(form.price))}`}.
                    </p>
                  </div>
                )}

                {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}

                <button onClick={handleCreate} className="btn btn-secondary w-full justify-center">
                  <Calendar size={17} /> Create Schedule
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashLayout>
  )
}
