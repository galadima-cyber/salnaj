import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Upload, X, Send, Users, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { DashLayout } from '@/components/layout/DashLayout'
import { PinModal } from '@/components/ui/PinModal'
import { ReceiptModal } from '@/components/ui/ReceiptModal'
import { bulkSmsApi, BulkSmsJob } from '@/services/endpoints'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { formatNaira } from '@/utils'

const SMS_PRICE_PER_UNIT = 4 // ₦4 per SMS page
const MAX_SMS_LENGTH = 160
const MAX_RECIPIENTS = 5000

export default function BulkSmsPage() {
  const { balance, refreshBalance } = useAuth()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [activeTab,    setActiveTab]    = useState<'compose' | 'history'>('compose')
  const [senderId,     setSenderId]     = useState('Salnaj')
  const [message,      setMessage]      = useState('')
  const [recipients,   setRecipients]   = useState<string[]>([])
  const [pasteInput,   setPasteInput]   = useState('')
  const [recipientTab, setRecipientTab] = useState<'paste' | 'upload'>('paste')
  const [pinOpen,      setPinOpen]      = useState(false)
  const [error,        setError]        = useState('')
  const [history,      setHistory]      = useState<BulkSmsJob[]>([])
  const [receipt,      setReceipt]      = useState<{
    open: boolean
    status: 'success' | 'failed'
    ref: string
  } | null>(null)

  const charCount      = message.length
  const smsPages       = Math.ceil(charCount / MAX_SMS_LENGTH) || 1
  const recipientCount = recipients.length
  const totalUnits     = recipientCount * smsPages
  const totalCost      = totalUnits * SMS_PRICE_PER_UNIT

  // Load history when tab is clicked
  useEffect(() => {
    if (activeTab === 'history') {
      const loadHistory = async () => {
        try {
          const res = await bulkSmsApi.getHistory()
          setHistory(res.data.data?.items || [])
        } catch {
          // silent error
        }
      }
      loadHistory()
    }
  }, [activeTab])

  // Parse phone numbers from text
  const parsePhones = (text: string) => {
    return text
      .split(/[\n,;\s]+/)
      .map(p => p.trim().replace(/\D/g, ''))
      .filter(p => p.length >= 10 && p.length <= 14)
      .slice(0, MAX_RECIPIENTS)
  }

  const handlePasteAdd = () => {
    const phones = parsePhones(pasteInput)
    if (phones.length === 0) {
      setError('No valid phone numbers found in input')
      return
    }
    const unique = [...new Set([...recipients, ...phones])]
    setRecipients(unique)
    setPasteInput('')
    setError('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const phones = parsePhones(text)
      const unique = [...new Set([...recipients, ...phones])]
      setRecipients(unique)
      toast.success('Contacts loaded!', `Added ${phones.length} recipients`)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeRecipient = (phone: string) =>
    setRecipients(r => r.filter(p => p !== phone))

  const handleSend = () => {
    if (!message.trim()) { setError('Type your message'); return }
    if (recipients.length === 0) { setError('Add at least one recipient'); return }
    if (!senderId.trim()) { setError('Enter a Sender ID'); return }
    if (balance && totalCost > balance.main) {
      setError(`Insufficient wallet balance. You need ${formatNaira(totalCost)} for this broadcast.`);
      return
    }
    setError('')
    setPinOpen(true)
  }

  const handleConfirmPin = async (pin: string) => {
    try {
      const res = await bulkSmsApi.send({
        senderId: senderId.trim(),
        message,
        recipients,
        pin,
      })
      setPinOpen(false)
      refreshBalance()
      toast.success('Bulk SMS Broadcast Sent!', `Dispatched to ${recipients.length} recipients.`)
      setReceipt({ open: true, status: 'success', ref: res.data.data.reference })
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error('Bulk SMS Failed', msg)
      throw err
    }
  }

  return (
    <DashLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-muted)' }}
            >
              <MessageSquare size={21} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="font-heading text-xl font-800" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Bulk SMS Broadcast
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                ₦{SMS_PRICE_PER_UNIT}/page · Wallet: {balance ? formatNaira(balance.main) : '---'}
              </p>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex p-1 rounded-xl" style={{ background: 'var(--color-surface)' }}>
            <button
              onClick={() => setActiveTab('compose')}
              className="px-3 py-1.5 rounded-lg text-xs font-700 transition-all"
              style={{
                background: activeTab === 'compose' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'compose' ? 'white' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Compose
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-3 py-1.5 rounded-lg text-xs font-700 transition-all"
              style={{
                background: activeTab === 'history' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'history' ? 'white' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              History
            </button>
          </div>
        </div>

        {activeTab === 'compose' ? (
          <div className="flex flex-col gap-5">
            {/* Sender ID */}
            <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
              <p className="font-heading text-sm font-700 mb-2" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Sender ID (Max 11 Characters)
              </p>
              <input
                value={senderId}
                onChange={e => setSenderId(e.target.value.slice(0, 11))}
                className="input"
                placeholder="e.g. MyBrand, Salnaj"
                maxLength={11}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                This is the sender name that will appear on recipients' mobile phones.
              </p>
            </div>

            {/* Message composer */}
            <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Message Content
                </p>
                <span className="text-xs" style={{ color: charCount > MAX_SMS_LENGTH * 2 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                  {charCount}/{MAX_SMS_LENGTH} · {smsPages} SMS page{smsPages > 1 ? 's' : ''}
                </span>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="input resize-none text-sm"
                placeholder="Type your message here..."
              />
            </div>

            {/* Recipients management */}
            <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-heading text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Recipients ({recipients.length})
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecipientTab('paste')}
                    className="text-xs font-700 px-2.5 py-1 rounded-lg"
                    style={{
                      background: recipientTab === 'paste' ? 'var(--color-primary-muted)' : 'transparent',
                      color: recipientTab === 'paste' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Paste Numbers
                  </button>
                  <button
                    onClick={() => setRecipientTab('upload')}
                    className="text-xs font-700 px-2.5 py-1 rounded-lg"
                    style={{
                      background: recipientTab === 'upload' ? 'var(--color-primary-muted)' : 'transparent',
                      color: recipientTab === 'upload' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {recipientTab === 'paste' ? (
                <div>
                  <textarea
                    value={pasteInput}
                    onChange={e => setPasteInput(e.target.value)}
                    rows={3}
                    className="input resize-none text-xs font-mono"
                    placeholder="Enter phone numbers separated by comma, space, or new line (e.g. 08012345678, 09087654321)"
                  />
                  <button
                    type="button"
                    onClick={handlePasteAdd}
                    disabled={!pasteInput.trim()}
                    className="btn btn-outline btn-sm mt-2"
                  >
                    Add Numbers
                  </button>
                </div>
              ) : (
                <div
                  className="p-6 border-2 border-dashed rounded-xl text-center flex flex-col items-center justify-center cursor-pointer"
                  style={{ borderColor: 'var(--color-border)' }}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={24} style={{ color: 'var(--color-primary)', marginBottom: 8 }} />
                  <p className="text-xs font-700" style={{ color: 'var(--color-text-primary)' }}>
                    Upload contacts (.txt or .csv)
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}

              {/* Recipient Chips */}
              {recipients.length > 0 && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {recipients.slice(0, 30).map(phone => (
                      <span
                        key={phone}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                      >
                        {phone}
                        <button
                          onClick={() => removeRecipient(phone)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {recipients.length > 30 && (
                      <span className="text-xs self-center" style={{ color: 'var(--color-text-muted)' }}>
                        +{recipients.length - 30} more
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setRecipients([])}
                    className="mt-2 text-xs text-red-500 hover:underline"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear all recipients
                  </button>
                </div>
              )}
            </div>

            {/* Campaign Summary Card */}
            {recipients.length > 0 && message && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5"
                style={{ borderRadius: 'var(--radius-xl)' }}
              >
                <p className="font-heading text-sm font-700 mb-3" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Broadcast Calculation
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-elevated)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Recipients</p>
                    <p className="font-heading text-base font-800" style={{ color: 'var(--color-text-primary)' }}>
                      {recipients.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-elevated)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>SMS Pages</p>
                    <p className="font-heading text-base font-800" style={{ color: 'var(--color-text-primary)' }}>
                      {smsPages}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-elevated)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Units</p>
                    <p className="font-heading text-base font-800" style={{ color: 'var(--color-text-primary)' }}>
                      {totalUnits.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-elevated)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Cost</p>
                    <p className="font-heading text-base font-800" style={{ color: 'var(--color-primary)' }}>
                      {formatNaira(totalCost)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--color-error-subtle)' }}>
                <AlertCircle size={15} style={{ color: 'var(--color-error)' }} />
                <p className="text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>
              </div>
            )}

            {/* Send CTA */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || recipients.length === 0}
              className="btn btn-primary btn-lg w-full justify-center py-3.5"
            >
              <Send size={18} />
              Send to {recipients.length.toLocaleString()} Recipients ({formatNaira(totalCost)})
            </button>
          </div>
        ) : (
          /* History Tab */
          <div className="flex flex-col gap-3">
            {history.length === 0 ? (
              <div className="card p-10 text-center flex flex-col items-center gap-3" style={{ borderRadius: 'var(--radius-xl)' }}>
                <Clock size={32} style={{ color: 'var(--color-text-muted)' }} />
                <p className="font-heading font-700 text-base" style={{ color: 'var(--color-text-primary)' }}>
                  No Bulk SMS campaigns yet
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Your sent SMS campaigns will appear here.
                </p>
              </div>
            ) : (
              history.map(job => (
                <div
                  key={job.id}
                  className="card p-4 flex items-center justify-between gap-3"
                  style={{ borderRadius: 'var(--radius-xl)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--color-primary-muted)' }}
                    >
                      <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-700" style={{ color: 'var(--color-text-primary)' }}>
                        Sender: {job.senderId} · {job.totalCount} recipients
                      </p>
                      <p className="text-xs truncate max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
                        "{job.message}"
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-heading text-sm font-800" style={{ color: 'var(--color-text-primary)' }}>
                      {formatNaira(Number(job.totalCost))}
                    </p>
                    <span
                      className="inline-block text-xs font-700 px-2 py-0.5 rounded-full"
                      style={{
                        background: job.status === 'DONE' ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)',
                        color: job.status === 'DONE' ? 'var(--color-success)' : 'var(--color-warning)',
                        fontSize: '0.65rem',
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* PIN Confirmation Modal */}
      <PinModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={handleConfirmPin}
        title="Confirm SMS Campaign"
        description={`${recipients.length} recipients · ${formatNaira(totalCost)}`}
      />

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal
          isOpen={receipt.open}
          status={receipt.status}
          title="Bulk SMS Campaign"
          amount={totalCost}
          reference={receipt.ref}
          details={[
            { label: 'Sender ID', value: senderId },
            { label: 'Recipients', value: String(recipients.length) },
            { label: 'SMS Pages', value: String(smsPages) },
          ]}
          onClose={() => {
            setReceipt(null)
            setRecipients([])
            setMessage('')
          }}
        />
      )}
    </DashLayout>
  )
}
