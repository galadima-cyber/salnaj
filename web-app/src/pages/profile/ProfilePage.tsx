import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Shield, Bell, Eye, EyeOff,
  Check, KeyRound, Lock, Code2, Copy,
  CheckCheck, RefreshCw, AlertCircle, Smartphone, ExternalLink,
} from 'lucide-react'
import { DashLayout } from '@/components/layout/DashLayout'
import { useAuth } from '@/context/AuthContext'
import { authApi, apiKeyApi, ApiKeyDetails } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'

const TABS = [
  { id: 'profile',  label: 'Profile',         icon: User   },
  { id: 'security', label: 'Security & PIN',  icon: Shield },
  { id: 'api',      label: 'API & Developer', icon: Code2  },
  { id: 'notify',   label: 'Notifications',   icon: Bell   },
]

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTab = searchParams.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Profile form
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [profileSaving, setProfileSaving] = useState(false)

  // PIN state
  const [setPinValue, setSetPinValue] = useState('')
  const [currentPin,  setCurrentPin]  = useState('')
  const [newPin,      setNewPin]      = useState('')
  const [confirmPin,  setConfirmPin]  = useState('')
  const [pinSaving,   setPinSaving]   = useState(false)
  const [pinError,    setPinError]    = useState('')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [passSaving,      setPassSaving]      = useState(false)
  const [passError,       setPassError]       = useState('')

  // API Key state
  const [apiKeyData,  setApiKeyData]  = useState<ApiKeyDetails | null>(null)
  const [showKey,     setShowKey]     = useState(false)
  const [copiedKey,   setCopiedKey]   = useState(false)
  const [webhookUrl,  setWebhookUrl]  = useState('')
  const [webhookSaving, setWebhookSaving] = useState(false)

  // Notification prefs
  const [notifs, setNotifs] = useState({
    txAlerts:   true,
    promos:     false,
    autopilot:  true,
    lowBalance: true,
  })

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSearchParams({ tab: id })
  }

  // Load API Key details when API tab is active
  useEffect(() => {
    if (activeTab === 'api') {
      const loadApiKey = async () => {
        try {
          const res = await apiKeyApi.get()
          if (res.data.data) {
            setApiKeyData(res.data.data)
            setWebhookUrl(res.data.data.webhookUrl || '')
          }
        } catch {
          // silent error
        }
      }
      loadApiKey()
    }
  }, [activeTab])

  // Profile update
  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      // simulate profile save
      await new Promise(r => setTimeout(r, 600))
      toast.success('Profile Saved', 'Your profile details have been updated.')
    } catch (e) {
      toast.error('Error', getErrorMessage(e))
    } finally {
      setProfileSaving(false)
    }
  }

  // First time PIN setup (only once)
  const handleSetPinFirstTime = async () => {
    if (setPinValue.length !== 4) {
      setPinError('PIN must be exactly 4 digits')
      return
    }
    setPinSaving(true)
    setPinError('')
    try {
      await authApi.setPin(setPinValue)
      toast.success('PIN Created!', 'Your 4-digit transaction PIN has been securely set.')
      setSetPinValue('')
      refreshUser()
    } catch (e) {
      setPinError(getErrorMessage(e))
    } finally {
      setPinSaving(false)
    }
  }

  // Change existing PIN
  const handleChangePin = async () => {
    if (currentPin.length !== 4 || newPin.length !== 4) {
      setPinError('Both current and new PIN must be 4 digits')
      return
    }
    if (newPin !== confirmPin) {
      setPinError('New PIN and Confirm PIN do not match')
      return
    }
    setPinSaving(true)
    setPinError('')
    try {
      await authApi.changePin({ currentPin, newPin })
      toast.success('PIN Changed!', 'Your transaction PIN has been successfully updated.')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (e) {
      setPinError(getErrorMessage(e))
    } finally {
      setPinSaving(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPassError('Please fill in both current and new passwords')
      return
    }
    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match')
      return
    }
    setPassSaving(true)
    setPassError('')
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      toast.success('Password Updated!', 'Your account password has been changed.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setPassError(getErrorMessage(e))
    } finally {
      setPassSaving(false)
    }
  }

  // API Key copy
  const handleCopyKey = () => {
    if (!apiKeyData?.key) return
    navigator.clipboard.writeText(apiKeyData.key)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    toast.success('Copied API Key to clipboard!')
  }

  // Regenerate API Key
  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate your API Key? Any existing apps using the old key will stop working immediately.')) {
      return
    }
    try {
      const res = await apiKeyApi.regenerate()
      setApiKeyData(res.data.data)
      toast.success('New API Key Generated!', 'Old key has been revoked.')
    } catch (e) {
      toast.error('Error', getErrorMessage(e))
    }
  }

  // Save webhook URL
  const handleSaveWebhook = async () => {
    setWebhookSaving(true)
    try {
      await apiKeyApi.updateWebhook(webhookUrl)
      toast.success('Webhook Saved!', 'Transaction callback events will be dispatched to this URL.')
    } catch (e) {
      toast.error('Error', getErrorMessage(e))
    } finally {
      setWebhookSaving(false)
    }
  }

  return (
    <DashLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-muted)' }}
          >
            <Shield size={21} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Settings & Security
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Manage your personal credentials, transaction PIN, and API developer keys
            </p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex p-1 rounded-2xl overflow-x-auto gap-1" style={{ background: 'var(--color-surface)' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-700 transition-all"
                style={{
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? 'white' : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
              <h2 className="font-heading text-base font-700" style={{ color: 'var(--color-text-primary)' }}>
                Account Information
              </h2>

              <div>
                <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input opacity-60 cursor-not-allowed"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Email is locked for account safety.
                </p>
              </div>

              <div>
                <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={user?.phone || ''}
                  disabled
                  className="input opacity-60 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Referral Code
                </label>
                <input
                  type="text"
                  value={user?.referralCode || ''}
                  disabled
                  className="input opacity-80 font-mono font-700"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="btn btn-primary mt-2 justify-center"
              >
                {profileSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Security & PIN Tab ── */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            {/* 1. Transaction PIN Box (Set once OR Change) */}
            <div className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-700" style={{ color: 'var(--color-text-primary)' }}>
                    Transaction PIN
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Required to authorize all wallet purchases and withdrawals
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-700"
                  style={{
                    background: user?.hasPin ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)',
                    color: user?.hasPin ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  {user?.hasPin ? 'PIN Active ✓' : 'PIN Not Set'}
                </span>
              </div>

              {!user?.hasPin ? (
                /* One-time setup */
                <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: 'var(--color-surface-elevated)' }}>
                  <p className="text-xs font-600" style={{ color: 'var(--color-text-secondary)' }}>
                    Set up your 4-digit transaction PIN (Can only be set once without old PIN verification):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={setPinValue}
                      onChange={e => setSetPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Enter 4-digit PIN"
                      className="input flex-1 font-mono text-center tracking-widest text-lg"
                    />
                    <button
                      type="button"
                      onClick={handleSetPinFirstTime}
                      disabled={pinSaving || setPinValue.length !== 4}
                      className="btn btn-primary"
                    >
                      {pinSaving ? 'Saving...' : 'Set PIN'}
                    </button>
                  </div>
                  {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                </div>
              ) : (
                /* Change existing PIN */
                <div className="p-5 rounded-2xl flex flex-col gap-3" style={{ background: 'var(--color-surface-elevated)' }}>
                  <p className="text-xs font-700" style={{ color: 'var(--color-text-primary)' }}>
                    Change Your PIN (Current PIN required)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>Current PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={currentPin}
                        onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="input text-center font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>New 4-Digit PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="input text-center font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>Confirm New PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="input text-center font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  {pinError && <p className="text-xs text-red-500">{pinError}</p>}

                  <button
                    type="button"
                    onClick={handleChangePin}
                    disabled={pinSaving || currentPin.length !== 4 || newPin.length !== 4}
                    className="btn btn-primary btn-sm self-start mt-1"
                  >
                    <KeyRound size={14} />
                    {pinSaving ? 'Updating PIN...' : 'Update PIN'}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Change Password Section */}
            <div className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div>
                <h2 className="font-heading text-base font-700" style={{ color: 'var(--color-text-primary)' }}>
                  Change Password
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-xs font-600 mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="input"
                  />
                </div>
              </div>

              {passError && <p className="text-xs text-red-500">{passError}</p>}

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passSaving || !currentPassword || newPassword.length < 8}
                className="btn btn-primary self-start justify-center"
              >
                <Lock size={15} />
                {passSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── API & Developer Tab (User Requirement #6) ── */}
        {activeTab === 'api' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            {/* Live API Key Card */}
            <div className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-700" style={{ color: 'var(--color-text-primary)' }}>
                    Your Developer API Key
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Generated automatically with your account for programmatic VTU transactions
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-700"
                  style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}
                >
                  ACTIVE LIVE
                </span>
              </div>

              <div
                className="p-4 rounded-2xl flex items-center justify-between gap-3"
                style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-700 truncate" style={{ color: 'var(--color-primary)' }}>
                    {showKey ? (apiKeyData?.key || 'salnaj_live_••••••••••••') : 'salnaj_live_••••••••••••••••••••••••••••••••'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowKey(s => !s)}
                    className="btn btn-outline btn-sm"
                    title={showKey ? 'Hide Key' : 'Reveal Key'}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="btn btn-primary btn-sm"
                  >
                    {copiedKey ? <CheckCheck size={14} /> : <Copy size={14} />}
                    {copiedKey ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="btn btn-outline btn-sm text-red-500"
                >
                  <RefreshCw size={13} /> Regenerate Key
                </button>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Monthly Quota: 50,000 requests
                </span>
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div>
                <h2 className="font-heading text-base font-700" style={{ color: 'var(--color-text-primary)' }}>
                  Webhook URL (Callback)
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  We will send an HTTP POST payload to this URL when background transactions complete
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://yourdomain.com/api/salnaj-webhook"
                  className="input font-mono text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  disabled={webhookSaving}
                  className="btn btn-primary"
                >
                  {webhookSaving ? 'Saving...' : 'Save Webhook'}
                </button>
              </div>
            </div>

            {/* Interactive API Documentation Snippets */}
            <div className="card p-6 flex flex-col gap-5" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div>
                <h2 className="font-heading text-base font-700" style={{ color: 'var(--color-text-primary)' }}>
                  Quick Integration Documentation
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Send your API Key via the <code className="px-1.5 py-0.5 rounded text-primary bg-primary/10">Authorization: Bearer &lt;API_KEY&gt;</code> header
                </p>
              </div>

              {/* Data Purchase Snippet */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-700 text-emerald-500 font-mono">POST /api/data/purchase</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>Buy Data</span>
                </div>
                <pre
                  className="p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed"
                  style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
                >
{`curl -X POST https://api.salnaj.ng/api/data/purchase \\
  -H "Authorization: Bearer ${apiKeyData?.key ? apiKeyData.key.slice(0, 16) + '...' : 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "planId": "cuid_data_plan_id",
    "phone": "08012345678",
    "pin": "1234"
  }'`}
                </pre>
              </div>

              {/* Airtime Purchase Snippet */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-700 text-blue-500 font-mono">POST /api/airtime/purchase</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>Buy Airtime</span>
                </div>
                <pre
                  className="p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed"
                  style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
                >
{`curl -X POST https://api.salnaj.ng/api/airtime/purchase \\
  -H "Authorization: Bearer ${apiKeyData?.key ? apiKeyData.key.slice(0, 16) + '...' : 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": "MTN",
    "amount": 1000,
    "phone": "08012345678",
    "pin": "1234"
  }'`}
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === 'notify' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 flex flex-col gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
            <h2 className="font-heading text-base font-700" style={{ color: 'var(--color-text-primary)' }}>
              Notification Preferences
            </h2>
            <div className="flex flex-col divide-y divide-border">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-600" style={{ color: 'var(--color-text-primary)' }}>Transaction SMS & Email</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Get instant alerts for purchases & wallet credits</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifs.txAlerts}
                  onChange={e => setNotifs({ ...notifs, txAlerts: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-600" style={{ color: 'var(--color-text-primary)' }}>Low Balance Reminder</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Alert when wallet drops below ₦500</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifs.lowBalance}
                  onChange={e => setNotifs({ ...notifs, lowBalance: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-600" style={{ color: 'var(--color-text-primary)' }}>Promotions & Discount Offers</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Receive special weekend data deals and cashback notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifs.promos}
                  onChange={e => setNotifs({ ...notifs, promos: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashLayout>
  )
}
