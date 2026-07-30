import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Wifi,
  Phone, Zap, Tv, GraduationCap, Target, MessageSquare,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { DashLayout }  from '@/components/layout/DashLayout'
import { formatNaira } from '@/utils'

// ─── Mock data — wire to /api/analytics when ready ───────────
const MONTHLY_SPEND = [
  { month: 'Feb', amount: 8400  },
  { month: 'Mar', amount: 12100 },
  { month: 'Apr', amount: 9800  },
  { month: 'May', amount: 15200 },
  { month: 'Jun', amount: 11300 },
  { month: 'Jul', amount: 16700 },
]

const CATEGORY_BREAKDOWN = [
  { name: 'Data',        value: 8200,  color: '#2D5BE3', icon: Wifi           },
  { name: 'Airtime',     value: 3100,  color: '#059669', icon: Phone          },
  { name: 'Electricity', value: 5000,  color: '#7C3AED', icon: Zap            },
  { name: 'Cable TV',    value: 0,     color: '#DB2777', icon: Tv             },
  { name: 'Education',   value: 400,   color: '#D97706', icon: GraduationCap  },
]

const NETWORK_BREAKDOWN = [
  { name: 'MTN',    value: 5200, color: '#FFCC00' },
  { name: 'Airtel', value: 3000, color: '#DC2626' },
]

const INSIGHTS = [
  { icon: TrendingUp,  color: 'var(--color-secondary)',  text: 'You spent ₦16,700 this month — 48% more than last month.' },
  { icon: Wifi,        color: 'var(--color-primary)',    text: 'Data is your biggest expense at ₦8,200 (49% of total spend).' },
  { icon: TrendingDown,color: 'var(--color-accent-dark)',text: 'Switching from MTN to Airtel could save you ~₦400/month.' },
]

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3" style={{ borderRadius: 'var(--radius-lg)', fontSize: '0.8rem', minWidth: 110 }}>
      <p className="font-700 mb-1" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{label}</p>
      <p style={{ color: 'var(--color-primary)' }}>{formatNaira(payload[0].value)}</p>
    </div>
  )
}

const PERIODS = ['3 months', '6 months', '12 months']

export default function AnalyticsPage() {
  const [period,   setPeriod]   = useState('6 months')
  const total     = CATEGORY_BREAKDOWN.reduce((s, c) => s + c.value, 0)
  const thisMonth = MONTHLY_SPEND[MONTHLY_SPEND.length - 1].amount
  const lastMonth = MONTHLY_SPEND[MONTHLY_SPEND.length - 2].amount
  const change    = ((thisMonth - lastMonth) / lastMonth) * 100

  const slicedData = period === '3 months'
    ? MONTHLY_SPEND.slice(-3)
    : period === '12 months'
    ? MONTHLY_SPEND
    : MONTHLY_SPEND.slice(-6)

  return (
    <DashLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                 style={{ background: 'var(--color-accent-subtle)' }}>
              <BarChart3 size={21} style={{ color: 'var(--color-accent-dark)' }} />
            </div>
            <div>
              <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Spending Analytics
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Your financial overview</p>
            </div>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface)' }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-700 transition-all"
                style={{
                  fontWeight: 700, fontFamily: 'var(--font-heading)',
                  background: period === p ? 'var(--color-primary)' : 'transparent',
                  color:      period === p ? 'white' : 'var(--color-text-secondary)',
                  border: 'none', cursor: 'pointer',
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'This Month',    value: formatNaira(thisMonth),  sub: `${change > 0 ? '+' : ''}${change.toFixed(0)}% vs last`, color: 'var(--color-primary)',    trend: change > 0 },
            { label: 'Total (6 mo)', value: formatNaira(MONTHLY_SPEND.reduce((s, m) => s + m.amount, 0)), sub: '6-month total', color: 'var(--color-secondary)', trend: null },
            { label: 'Avg / Month',  value: formatNaira(Math.round(MONTHLY_SPEND.reduce((s, m) => s + m.amount, 0) / MONTHLY_SPEND.length)), sub: 'rolling average', color: 'var(--color-accent-dark)', trend: null },
          ].map(k => (
            <div key={k.label} className="card p-4" style={{ borderRadius: 'var(--radius-xl)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{k.label}</p>
              <p className="font-heading text-xl font-800 mb-0.5"
                 style={{ fontWeight: 800, color: k.color }}>{k.value}</p>
              <div className="flex items-center gap-1">
                {k.trend !== null && (
                  k.trend
                    ? <TrendingUp size={11} style={{ color: 'var(--color-error)' }} />
                    : <TrendingDown size={11} style={{ color: 'var(--color-success)' }} />
                )}
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly bar chart */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-base font-700 mb-5"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Monthly Spending</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={slicedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                     tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CUSTOM_TOOLTIP />} cursor={{ fill: 'var(--color-primary-muted)' }} />
              <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Donut */}
          <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
            <p className="font-heading text-base font-700 mb-4"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>By Category</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={CATEGORY_BREAKDOWN.filter(c => c.value > 0)}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {CATEGORY_BREAKDOWN.filter(c => c.value > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatNaira(Number(v) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* List */}
          <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
            <p className="font-heading text-base font-700 mb-4"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Breakdown</p>
            <div className="flex flex-col gap-3">
              {CATEGORY_BREAKDOWN.filter(c => c.value > 0).map(cat => {
                const pct = Math.round((cat.value / total) * 100)
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                             style={{ background: `${cat.color}18` }}>
                          <cat.icon size={13} style={{ color: cat.color }} />
                        </div>
                        <p className="font-heading text-sm font-700"
                           style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{cat.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-sm font-800"
                           style={{ fontWeight: 800, color: cat.color }}>{formatNaira(cat.value)}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{pct}%</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: cat.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-base font-700 mb-4"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>💡 Insights</p>
          <div className="flex flex-col gap-3">
            {INSIGHTS.map((ins, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'var(--color-surface-elevated)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${ins.color}18` }}>
                  <ins.icon size={15} style={{ color: ins.color }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {ins.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Network preference */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-base font-700 mb-4"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Network Preference</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={NETWORK_BREAKDOWN} layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                     axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                     axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v: any) => formatNaira(Number(v) || 0)} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
                {NETWORK_BREAKDOWN.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashLayout>
  )
}
