import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Wifi, Phone, Zap, Tv, GraduationCap, Wallet,
  RefreshCw, Target, MessageSquare, CreditCard, Users, Code2,
  ChevronDown, ChevronRight, Star, Shield, Clock, TrendingUp,
  Sparkles, ArrowRight, CheckCircle2, Play, BarChart3,
  Calendar, Gift, Search
} from 'lucide-react'
import { brandConfig } from '@/config/brand.config'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { formatNaira } from '@/utils'

// ─── Animation Variants ───────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
}
const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

// ─── Hook: animate when in view ──────────────────────────────
function useScrollAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return { ref, isInView }
}

// ─── Data ────────────────────────────────────────────────────
const coreServices = [
  {
    icon: Wifi,
    label: 'Buy Data',
    description: 'MTN, Airtel, Glo & 9mobile data plans at the best prices',
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-muted)',
    href: '/buy-data',
  },
  {
    icon: Phone,
    label: 'Buy Airtime',
    description: 'Instant airtime top-up for all networks. Never go silent.',
    color: 'var(--color-secondary)',
    bg: 'var(--color-secondary-muted)',
    href: '/buy-airtime',
  },
  {
    icon: Zap,
    label: 'Electricity',
    description: 'Purchase prepaid tokens for any DISCO across Nigeria',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    href: '/electricity',
  },
  {
    icon: Tv,
    label: 'Cable TV',
    description: 'Renew DSTV, GOtv, or Startimes subscriptions instantly',
    color: '#DB2777',
    bg: 'rgba(219,39,119,0.10)',
    href: '/cable-tv',
  },
  {
    icon: GraduationCap,
    label: 'Education',
    description: 'WAEC, NECO & JAMB result checker pins in seconds',
    color: 'var(--color-accent-dark)',
    bg: 'var(--color-accent-subtle)',
    href: '/education',
  },
  {
    icon: Wallet,
    label: 'Wallet',
    description: 'Fund your wallet and manage all transactions in one place',
    color: '#0891B2',
    bg: 'rgba(8,145,178,0.10)',
    href: '/wallet',
  },
]

const extraServices = [
  { icon: RefreshCw, label: 'Airtime to Cash', color: 'var(--color-secondary)' },
  { icon: Target,    label: 'Betting Wallet',  color: '#DC2626' },
  { icon: MessageSquare, label: 'Bulk SMS',   color: 'var(--color-primary)' },
  { icon: CreditCard, label: 'Recharge Cards', color: '#7C3AED' },
  { icon: Users,     label: 'Referral System', color: 'var(--color-accent-dark)' },
  { icon: Code2,     label: 'API Access',      color: '#0891B2' },
]

const uniqueFeatures = [
  {
    icon: Search,
    title: 'Smart Buy',
    tagline: 'Best deal, zero effort.',
    description:
      'Enter your budget — Smart Buy scans all networks and ranks every available plan by value, so you always get the most data for your money.',
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-subtle)',
    demo: {
      budget: 1000,
      results: [
        { network: 'Airtel', plan: '6GB', validity: '7 days', badge: 'Best Value 🏆' },
        { network: 'Glo',    plan: '5GB', validity: '14 days', badge: 'Longest Validity' },
        { network: 'MTN',    plan: '4GB', validity: '30 days', badge: 'Most Flexible' },
      ],
    },
  },
  {
    icon: Calendar,
    title: 'Data Autopilot',
    tagline: 'Set it. Forget it.',
    description:
      'Schedule recurring data purchases — daily, weekly or monthly. Autopilot buys your data automatically so you never run out again.',
    color: 'var(--color-secondary)',
    bg: 'var(--color-secondary-subtle)',
  },
  {
    icon: Gift,
    title: 'Gift Data',
    tagline: 'Share data, not cash.',
    description:
      'Buy a data plan and generate a shareable gift code. Send it on WhatsApp — the recipient redeems it to any number they choose.',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    icon: BarChart3,
    title: 'Spending Analytics',
    tagline: 'Know your spend.',
    description:
      'Monthly AI-style breakdowns of what you spent, where, and how to save. Visual charts, category summaries, and actionable insights.',
    color: 'var(--color-accent-dark)',
    bg: 'var(--color-accent-subtle)',
  },
]

const steps = [
  { number: '01', title: 'Create your account', description: 'Sign up in 60 seconds — just your name, phone, and email.' },
  { number: '02', title: 'Fund your wallet',     description: 'Add money via card or bank transfer. Instant credit, no delays.' },
  { number: '03', title: 'Choose a service',     description: 'Pick from data, airtime, bills, or use Smart Buy for the best deal.' },
  { number: '04', title: 'Done in seconds',       description: 'Your purchase is delivered instantly. Receipt saved in your history.' },
]

const stats = [
  { label: 'Transactions Daily',  value: '10K+',   color: 'var(--color-primary)' },
  { label: 'Active Users',         value: '50K+',   color: 'var(--color-secondary)' },
  { label: 'Networks Supported',   value: '4',       color: '#7C3AED' },
  { label: 'Avg Delivery Time',    value: '< 8s',    color: 'var(--color-accent-dark)' },
]

const testimonials = [
  {
    name: 'Fatimah A.',
    role: 'Business Owner, Lagos',
    text: 'I use Salnaj to top up data for my 12 staff every week. The bulk purchase saves me so much time. The Autopilot feature is a lifesaver.',
    rating: 5,
  },
  {
    name: 'Chukwuemeka O.',
    role: 'Student, Enugu',
    text: "Smart Buy found me a better deal I didn't even know existed. Got 6GB for ₦1,000 on Airtel instead of my usual 4GB MTN. This app is different.",
    rating: 5,
  },
  {
    name: 'Maryam I.',
    role: 'Reseller, Kano',
    text: "The API access is clean and well documented. I built my own top-up app on top of Salnaj's backend in a week. Margins are great.",
    rating: 5,
  },
]

const faqs = [
  {
    q: 'How fast is data delivery?',
    a: 'Data is delivered within 8 seconds on average. In rare cases of network delays, it completes within 2 minutes. If not, your wallet is automatically refunded.',
  },
  {
    q: 'How do I fund my wallet?',
    a: 'You can fund via debit card (Visa/Mastercard), bank transfer, or USSD. Funds appear instantly after payment confirmation.',
  },
  {
    q: 'What is Smart Buy?',
    a: 'Smart Buy lets you enter your budget and instantly see which data plan across all four networks gives you the best value — ranked by GB per naira and validity.',
  },
  {
    q: 'Can I schedule automatic data purchases?',
    a: 'Yes. Data Autopilot lets you set a recurring schedule (daily, weekly, or monthly) and Salnaj will automatically purchase your chosen plan at your set time.',
  },
  {
    q: 'Is my money safe in the wallet?',
    a: 'Yes. Wallet balances are secured with bank-grade encryption, and all transactions require your personal PIN. Failed transactions are auto-reversed immediately.',
  },
  {
    q: 'Can I build my own app on Salnaj?',
    a: 'Yes. Our API tier gives resellers programmatic access to all services. You get your own API key, webhook support, and a usage dashboard.',
  },
]

// ─── Sub-components ───────────────────────────────────────────

function Section({ children, id, className = '', style }: { children: React.ReactNode; id?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <section id={id} className={`py-20 md:py-28 ${className}`} style={style}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center mb-4">
      <span className="badge badge-primary text-xs px-3 py-1.5">
        {children}
      </span>
    </div>
  )
}

function SectionHeading({ children, center = true }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2
      className={`font-heading text-3xl md:text-4xl lg:text-5xl mb-4 ${center ? 'text-center' : ''}`}
      style={{ fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.15 }}
    >
      {children}
    </h2>
  )
}

function SectionSubheading({ children, center = true }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={`text-lg leading-relaxed ${center ? 'text-center max-w-2xl mx-auto' : 'max-w-xl'}`}
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {children}
    </p>
  )
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} fill="var(--color-accent)" color="var(--color-accent)" />
      ))}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="card rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(prev => !prev)}
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      <div className="flex items-center justify-between p-5 md:p-6 gap-4">
        <span className="font-heading text-base md:text-lg" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <ChevronDown size={20} style={{ color: 'var(--color-primary)' }} />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6">
              <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────
export default function LandingPage() {
  const { ref: servicesRef, isInView: servicesInView } = useScrollAnimation()
  const { ref: stepsRef,    isInView: stepsInView    } = useScrollAnimation()
  const { ref: featuresRef, isInView: featuresInView } = useScrollAnimation()
  const { ref: statsRef,    isInView: statsInView    } = useScrollAnimation()

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {/* ══════════════════ HERO ══════════════════════════════════ */}
      <section className="bg-hero-gradient relative overflow-hidden min-h-screen flex items-center pt-24 pb-16">
        {/* Decorative blobs */}
        <div
          className="absolute top-20 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(45,91,227,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-10 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(5,150,105,0.10) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex flex-col items-start"
            >
              <motion.div variants={fadeUp}>
                <span className="badge badge-primary mb-5 text-xs px-3 py-1.5">
                  <Sparkles size={11} />
                  Nigeria's Smartest VTU Platform
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-6"
                style={{ fontWeight: 800, lineHeight: 1.08, color: 'var(--color-text-primary)' }}
              >
                Top-up anything.{' '}
                <span className="text-gradient">Anywhere.</span>{' '}
                In seconds.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl leading-relaxed mb-8"
                style={{ color: 'var(--color-text-secondary)', maxWidth: '520px' }}
              >
                Buy data, airtime, pay electricity bills, cable subscriptions and more —
                all from one intelligent platform built for Nigerians.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-10">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start for Free
                  <ArrowRight size={18} />
                </Link>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play size={16} />
                  See how it works
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeUp} className="flex items-center gap-5 flex-wrap">
                <div className="flex -space-x-2">
                  {['#2D5BE3','#059669','#7C3AED','#DB2777'].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                      style={{ borderColor: 'var(--color-surface)', background: c }}
                    >
                      {['M','A','F','C'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <StarRating count={5} />
                    <span className="text-sm font-600" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>4.9/5</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Trusted by 50,000+ users</p>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { icon: Shield, label: 'Secured', color: 'var(--color-secondary)' },
                    { icon: Clock,  label: '< 8s delivery', color: 'var(--color-primary)' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      <Icon size={13} style={{ color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Dashboard Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Mock phone/card UI */}
              <div
                className="relative mx-auto max-w-sm card-elevated p-1"
                style={{
                  borderRadius: 'var(--radius-2xl)',
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
                }}
              >
                {/* Header */}
                <div className="bg-primary-gradient p-5 rounded-3xl mb-0" style={{ borderRadius: '22px 22px 0 0' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white/70 text-xs mb-0.5">Good morning 👋</p>
                      <p className="text-white font-heading font-700 text-sm">Musa Ibrahim</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <Zap size={16} color="white" fill="white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Wallet Balance</p>
                    <p className="text-white font-heading font-800 text-3xl">₦12,450.00</p>
                  </div>
                  {/* Quick actions */}
                  <div className="grid grid-cols-4 gap-2 mt-5">
                    {[
                      { icon: Wifi, label: 'Data' },
                      { icon: Phone, label: 'Airtime' },
                      { icon: Zap, label: 'Electricity' },
                      { icon: Tv, label: 'Cable' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          <Icon size={16} color="white" />
                        </div>
                        <span className="text-white/80 text-xs">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Buy Preview */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Search size={13} style={{ color: 'var(--color-primary)' }} />
                    <span className="font-heading text-xs font-700" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Smart Buy — Budget: ₦1,000</span>
                  </div>
                  {[
                    { rank: '🥇', net: 'Airtel', plan: '6GB', days: '7 days', badge: 'Best Value' },
                    { rank: '🥈', net: 'Glo',    plan: '5GB', days: '14 days', badge: '' },
                    { rank: '🥉', net: 'MTN',    plan: '4GB', days: '30 days', badge: '' },
                  ].map((r) => (
                    <div
                      key={r.net}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl mb-1.5"
                      style={{ background: 'var(--color-surface-elevated)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.rank}</span>
                        <div>
                          <p className="font-heading text-xs font-700" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{r.net} {r.plan}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.days}</p>
                        </div>
                      </div>
                      {r.badge && <span className="badge badge-success text-xs" style={{ fontSize: '0.65rem' }}>{r.badge}</span>}
                    </div>
                  ))}

                  {/* Recent tx */}
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="font-heading text-xs font-700 mb-2.5" style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>RECENT</p>
                    {[
                      { label: 'MTN 2GB Data', time: '2h ago', amount: '₦500', ok: true },
                      { label: 'DSTV Compact', time: 'Yesterday', amount: '₦9,000', ok: true },
                    ].map(tx => (
                      <div key={tx.label} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-success-subtle)' }}>
                            <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} />
                          </div>
                          <div>
                            <p className="font-heading text-xs font-600" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{tx.label}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tx.time}</p>
                          </div>
                        </div>
                        <span className="font-heading text-xs font-700" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge — Autopilot */}
              <motion.div
                className="absolute -left-8 top-1/3 card p-3 flex items-center gap-2"
                style={{ borderRadius: 'var(--radius-lg)', minWidth: 160, boxShadow: 'var(--shadow-lg)' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-secondary-subtle)' }}>
                  <Calendar size={14} style={{ color: 'var(--color-secondary)' }} />
                </div>
                <div>
                  <p className="font-heading text-xs font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Autopilot Active</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Next: Mon 7:00 AM</p>
                </div>
              </motion.div>

              {/* Floating badge — Speed */}
              <motion.div
                className="absolute -right-4 bottom-24 card p-3 flex items-center gap-2"
                style={{ borderRadius: 'var(--radius-lg)', minWidth: 150, boxShadow: 'var(--shadow-lg)' }}
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-subtle)' }}>
                  <Zap size={14} fill="var(--color-primary)" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="font-heading text-xs font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Delivered!</p>
                  <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>4.2 seconds ⚡</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS BAR ═══════════════════════════ */}
      <div style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={statsRef}
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 divide-x py-8"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="flex flex-col items-center py-2 px-6">
                <span className="font-heading text-3xl md:text-4xl font-800 mb-1" style={{ fontWeight: 800, color: s.color }}>
                  {s.value}
                </span>
                <span className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════════════════ SERVICES ════════════════════════════ */}
      <Section id="services">
        <motion.div
          ref={servicesRef}
          initial="hidden"
          animate={servicesInView ? 'visible' : 'hidden'}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>All Services</SectionLabel>
            <SectionHeading>Everything you need, in one place</SectionHeading>
            <div className="mb-10">
              <SectionSubheading>
                From daily data top-ups to monthly bills — Salnaj handles it all
                so you never have to open another app.
              </SectionSubheading>
            </div>
          </motion.div>

          {/* Core Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {coreServices.map((service) => (
              <motion.div key={service.label} variants={fadeUp}>
                <Link
                  to={service.href}
                  className="card p-6 flex flex-col gap-4 group no-underline block"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: service.bg }}
                  >
                    <service.icon size={22} style={{ color: service.color }} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg mb-1.5 group-hover:text-[color:var(--color-primary)] transition-colors"
                        style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {service.label}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {service.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-600 mt-auto" style={{ color: service.color, fontWeight: 600 }}>
                    Get started <ChevronRight size={16} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Extra Services Strip */}
          <motion.div
            variants={fadeUp}
            className="card p-6"
            style={{ borderRadius: 'var(--radius-xl)' }}
          >
            <p className="font-heading text-sm font-700 mb-4 text-center" style={{ fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
              Also Available
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {extraServices.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={19} style={{ color }} />
                  </div>
                  <span className="text-xs text-center" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════════ UNIQUE FEATURES ══════════════════════ */}
      <Section id="features" style={{ background: 'var(--color-surface)' }}>
        <motion.div
          ref={featuresRef}
          initial="hidden"
          animate={featuresInView ? 'visible' : 'hidden'}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>
              <Sparkles size={11} />
              What Makes Us Different
            </SectionLabel>
            <SectionHeading>
              Built smarter than the rest
            </SectionHeading>
            <div className="mb-14">
              <SectionSubheading>
                Every other VTU app does the same thing. Salnaj does more —
                and the features that matter most to you are completely unique.
              </SectionSubheading>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {uniqueFeatures.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp}>
                <div
                  className="card p-7 h-full flex flex-col gap-5 overflow-hidden relative"
                  style={{ borderRadius: 'var(--radius-xl)' }}
                >
                  {/* Subtle background tint */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${f.color}22 0%, transparent 70%)`,
                      filter: 'blur(20px)',
                    }}
                  />

                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: f.bg }}
                    >
                      <f.icon size={22} style={{ color: f.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-700 mb-0.5" style={{ fontWeight: 700, color: f.color, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
                        {f.tagline}
                      </p>
                      <h3 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {f.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {f.description}
                  </p>

                  {/* Smart Buy demo */}
                  {f.demo && (
                    <div className="mt-2 p-4 rounded-xl" style={{ background: 'var(--color-surface-elevated)' }}>
                      <p className="text-xs font-700 mb-3" style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        Budget: ₦{f.demo.budget.toLocaleString()}
                      </p>
                      {f.demo.results.map((r, ri) => (
                        <div key={r.network} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{'🥇🥈🥉'[ri]}</span>
                            <div>
                              <p className="text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.network} — {r.plan}</p>
                              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.validity}</p>
                            </div>
                          </div>
                          {ri === 0 && (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Best Value</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ══════════════════ HOW IT WORKS ════════════════════════ */}
      <Section id="how-it-works">
        <motion.div
          ref={stepsRef}
          initial="hidden"
          animate={stepsInView ? 'visible' : 'hidden'}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>How It Works</SectionLabel>
            <SectionHeading>Up and running in 4 steps</SectionHeading>
            <div className="mb-14">
              <SectionSubheading>
                No lengthy verification. No bank queues. Create your account,
                fund your wallet, and start buying in under 3 minutes.
              </SectionSubheading>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connector line — desktop */}
            <div
              className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }}
            />

            {steps.map((step, i) => (
              <motion.div key={step.number} variants={fadeUp} className="relative">
                <div className="card p-6 flex flex-col gap-4 h-full" style={{ borderRadius: 'var(--radius-xl)' }}>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-800 text-base shrink-0"
                    style={{
                      background: i === 0 ? 'var(--color-primary)' : 'var(--color-primary-muted)',
                      color: i === 0 ? '#fff' : 'var(--color-primary)',
                      fontWeight: 800,
                      boxShadow: i === 0 ? 'var(--shadow-glow)' : 'none',
                    }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="flex justify-center mt-10">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════════ TESTIMONIALS ════════════════════════ */}
      <Section style={{ background: 'var(--color-surface)' }}>
        <SectionLabel>Testimonials</SectionLabel>
        <SectionHeading>Nigerians love Salnaj</SectionHeading>
        <div className="mb-12">
          <SectionSubheading>
            Don't take our word for it — here's what our users say after switching.
          </SectionSubheading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
            >
              <div className="card p-6 flex flex-col gap-4 h-full" style={{ borderRadius: 'var(--radius-xl)' }}>
                <StarRating count={t.rating} />
                <p className="text-base leading-relaxed flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-700 text-white shrink-0"
                    style={{
                      background: ['var(--color-primary)', 'var(--color-secondary)', '#7C3AED'][i],
                      fontWeight: 700,
                    }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ══════════════════ FAQ ═════════════════════════════════ */}
      <Section id="faq">
        <SectionLabel>FAQ</SectionLabel>
        <SectionHeading>Common questions</SectionHeading>
        <div className="mb-12">
          <SectionSubheading>
            Everything you need to know before getting started.
          </SectionSubheading>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {faqs.map(faq => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </Section>

      {/* ══════════════════ CTA BANNER ══════════════════════════ */}
      <Section>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-primary-gradient rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
          style={{ borderRadius: 'var(--radius-2xl)' }}
        >
          {/* BG decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>

          <div className="relative">
            <h2 className="font-heading text-3xl md:text-4xl mb-3 text-white" style={{ fontWeight: 800 }}>
              Ready to switch to smart?
            </h2>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Join 50,000+ Nigerians already using Salnaj. It's free to start.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative shrink-0">
            <Link
              to="/register"
              className="btn btn-lg"
              style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 700 }}
            >
              Create Free Account
              <ArrowRight size={18} />
            </Link>
            <a
              href={`https://wa.me/${brandConfig.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)' }}
            >
              Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </Section>

      <Footer />

      {/* WhatsApp Float Button */}
      <a
        href={`https://wa.me/${brandConfig.contact.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-40 shadow-lg transition-transform hover:scale-110"
        style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.5)' }}
        aria-label="Chat on WhatsApp"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  )
}
