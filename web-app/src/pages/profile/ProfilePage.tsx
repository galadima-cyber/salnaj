import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, User, Shield, Bell, Eye, EyeOff,
  ChevronRight, Check, Camera, LogOut,
  Smartphone, Lock, KeyRound,
} from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { useAuth } from '@/context/AuthContext'
import { authApi }      from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'

const TABS = [
  { id: 'profile',  label: 'Profile',  icon: User    },
  { id: 'security', label: 'Security', icon: Shield  },
  { id: 'notify',   label: 'Notify',   icon: Bell    },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-xs font-700 mb-3 mt-1"
       style={{ fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.68rem' }}>
      {children}
    </p>
  )
}

function SettingRow({
  icon: Icon, label, value, danger = false, onClick, toggle, toggled,
}: {
  icon: React.ElementType; label: string; value?: string
  danger?: boolean; onClick?: () => void
  toggle?: boolean; toggled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left"
      style={{ background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.background = 'var(--color-surface-elevated)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: danger ? 'var(--color-error-subtle)' : 'var(--color-surface-elevated)' }}>
        <Icon size={17} style={{ color: danger ? 'var(--color-error)' : 'var(--color-text-secondary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm font-600"
           style={{ fontWeight: 600, color: danger ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
          {label}
        </p>
        {value && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{value}</p>
        )}
      </div>
      {toggle !== undefined ? (
        <div className="w-11 h-6 rounded-full relative shrink-0 transition-all"
             style={{ background: toggled ? 'var(--color-secondary)' : 'var(--color-border)' }}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                style={{ left: toggled ? 'calc(100% - 22px)' : '2px' }} />
        </div>
      ) : onClick ? (
        <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      ) : null}
    </button>
  )
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const [tab, setTab] = useState('profile')

  // Profile form state
  const [name,       setName]       = useState(user?.fullName || '')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveError,  setSaveError]  = useState('')

  // PIN state
  const [currentPin, setCurrentPin] = useState('')
  const [newPin,     setNewPin]     = useState('')
  const [pinSaving,  setPinSaving]  = useState(false)
  const [showPins,   setShowPins]   = useState(false)
  const [pinError,   setPinError]   = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  // Notification prefs (mock)
  const [notifs, setNotifs] = useState({
    txAlerts:   true,
    promos:     false,
    autopilot:  true,
    referrals:  true,
    lowBalance: true,
  })

  const handleSaveProfile = async () => {
    setSaving(true); setSaveError(''); setSaved(false)
    try {
      // TODO: call PATCH /api/users/me
      await new Promise(r => setTimeout(r, 800))
      updateUser({ fullName: name })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { setSaveError(getErrorMessage(e)) }
    finally { setSaving(false) }
  }

  const handleChangePin = async () => {
    if (newPin.length !== 4) { setPinError('PIN must be 4 digits'); return }
    setPinSaving(true); setPinError(''); setPinSuccess(false)
    try {
      await authApi.setPin(newPin)
      setPinSuccess(true)
      setCurrentPin(''); setNewPin('')
      setTimeout(() => setPinSuccess(false), 3000)
    } catch (e) { setPinError(getErrorMessage(e)) }
    finally { setPinSaving(false) }
  }

  const kycBadgeMap: Record<string, { label: string; color: string; bg: string }> = {
    UNVERIFIED:    { label: 'Unverified',    color: 'var(--color-warning)',  bg: 'var(--color-warning-subtle)' },
    PHONE_VERIFIED:{ label: 'Phone Verified',color: 'var(--color-info)',     bg: 'var(--color-info-subtle)'    },
    BVN_VERIFIED:  { label: 'BVN Verified',  color: 'var(--color-secondary)',bg: 'var(--color-success-subtle)' },
    FULL_KYC:      { label: 'Fully Verified',color: 'var(--color-secondary)',bg: 'var(--color-success-subtle)' },
  }
  const kycBadge = kycBadgeMap[user?.kycStatus || 'UNVERIFIED'] || kycBadgeMap.UNVERIFIED

  return (
    <DashLayout>
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'var(--color-primary-muted)' }}>
            <Settings size={21} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Profile & Settings
          </h1>
        </div>

        {/* Avatar + KYC */}
        <div className="card p-5 flex items-center gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-800"
                 style={{ background: 'var(--color-primary)', fontWeight: 800 }}>
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', cursor: 'pointer' }}>
              <Camera size={11} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-base font-700 truncate"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{user?.fullName}</p>
            <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="badge text-xs" style={{ background: kycBadge.bg, color: kycBadge.color, fontSize: '0.68rem' }}>
                {kycBadge.label}
              </span>
              <span className="badge badge-primary text-xs" style={{ fontSize: '0.68rem' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--color-surface)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-700 transition-all"
              style={{
                fontWeight: 700, fontFamily: 'var(--font-heading)',
                background: tab === t.id ? 'var(--color-primary)' : 'transparent',
                color:      tab === t.id ? 'white' : 'var(--color-text-secondary)',
                border: 'none', cursor: 'pointer',
              }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ─────────────────────────────────── */}
        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-5 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
            <SectionLabel>Personal Information</SectionLabel>

            <div>
              <p className="font-heading text-sm font-700 mb-2"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Full Name</p>
              <input value={name} onChange={e => setName(e.target.value)} className="input" />
            </div>

            <div>
              <p className="font-heading text-sm font-700 mb-2"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Email Address</p>
              <input value={user?.email || ''} disabled className="input opacity-60" />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Contact support to change email.</p>
            </div>

            <div>
              <p className="font-heading text-sm font-700 mb-2"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Phone Number</p>
              <input value={user?.phone || ''} disabled className="input opacity-60" />
            </div>

            <div>
              <p className="font-heading text-sm font-700 mb-2"
                 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Referral Code</p>
              <div className="flex items-center gap-3 p-3 rounded-xl"
                   style={{ background: 'var(--color-surface-elevated)' }}>
                <p className="font-mono font-700 flex-1"
                   style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {user?.referralCode}
                </p>
              </div>
            </div>

            {saveError && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{saveError}</p>}
            {saved     && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-success-subtle)' }}>
                <Check size={16} style={{ color: 'var(--color-success)' }} />
                <p className="text-sm" style={{ color: 'var(--color-success)' }}>Profile updated!</p>
              </div>
            )}

            <button onClick={handleSaveProfile} disabled={saving}
              className="btn btn-primary w-full justify-center">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </motion.div>
        )}

        {/* ── Security tab ────────────────────────────────── */}
        {tab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-5 flex flex-col" style={{ borderRadius: 'var(--radius-xl)' }}>
            <SectionLabel>Transaction PIN</SectionLabel>

            <div className="flex flex-col gap-3 mb-5">
              <div className="relative">
                <input type={showPins ? 'text' : 'password'} value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input pr-12" placeholder="New 4-digit PIN" inputMode="numeric" maxLength={4} />
                <button onClick={() => setShowPins(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPins ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {pinError   && <p className="text-xs" style={{ color: 'var(--color-error)' }}>{pinError}</p>}
              {pinSuccess  && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-success-subtle)' }}>
                  <Check size={14} style={{ color: 'var(--color-success)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-success)' }}>PIN updated!</p>
                </div>
              )}
              <button onClick={handleChangePin} disabled={pinSaving || newPin.length < 4}
                className="btn btn-outline btn-sm w-full justify-center">
                <KeyRound size={15} /> {pinSaving ? 'Updating...' : 'Set New PIN'}
              </button>
            </div>

            <SectionLabel>Security Settings</SectionLabel>
            <SettingRow icon={Smartphone} label="Two-Factor Authentication" value="Not enabled" onClick={() => {}} />
            <SettingRow icon={Lock}       label="Change Password"                                onClick={() => {}} />
            <SettingRow icon={Shield}     label="Active Sessions"            value="1 active"   onClick={() => {}} />

            <SectionLabel>Account</SectionLabel>
            <SettingRow icon={LogOut} label="Sign Out of All Devices" danger onClick={() => logout()} />
          </motion.div>
        )}

        {/* ── Notifications tab ───────────────────────────── */}
        {tab === 'notify' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
            <SectionLabel>Push Notifications</SectionLabel>
            {(Object.entries(notifs) as [keyof typeof notifs, boolean][]).map(([key, val]) => {
              const labels: Record<string, string> = {
                txAlerts:   'Transaction alerts',
                promos:     'Promotions & deals',
                autopilot:  'Autopilot reminders',
                referrals:  'Referral earnings',
                lowBalance: 'Low balance alerts',
              }
              return (
                <SettingRow key={key} icon={Bell} label={labels[key]}
                  toggle toggled={val}
                  onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
              )
            })}
          </motion.div>
        )}
      </div>
    </DashLayout>
  )
}
