import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Upload, X, Send, Users, AlertCircle } from 'lucide-react'
import { DashLayout }   from '@/components/layout/DashLayout'
import { PinModal }     from '@/components/ui/PinModal'
import { ReceiptModal } from '@/components/ui/ReceiptModal'
import { useAuthStore } from '@/store/auth.store'
import { formatNaira }  from '@/utils'

const SMS_PRICE_PER_UNIT = 4    // ₦4 per SMS
const MAX_SMS_LENGTH     = 160
const MAX_RECIPIENTS     = 5000

export default function BulkSmsPage() {
  const { balance, fetchBalance } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [senderId,    setSenderId]    = useState('Salnaj')
  const [message,     setMessage]     = useState('')
  const [recipients,  setRecipients]  = useState<string[]>([])
  const [pasteInput,  setPasteInput]  = useState('')
  const [tab,         setTab]         = useState<'paste'|'upload'>('paste')
  const [pinOpen,     setPinOpen]     = useState(false)
  const [error,       setError]       = useState('')
  const [receipt,     setReceipt]     = useState<{
    open: boolean; status: 'success'|'failed'; ref: string
  } | null>(null)

  const charCount     = message.length
  const smsPages      = Math.ceil(charCount / MAX_SMS_LENGTH) || 1
  const recipientCount= recipients.length
  const totalUnits    = recipientCount * smsPages
  const totalCost     = totalUnits * SMS_PRICE_PER_UNIT

  // Parse phone numbers from text (comma, newline, space separated)
  const parsePhones = (text: string) => {
    return text
      .split(/[\n,;\s]+/)
      .map(p => p.trim().replace(/\D/g, ''))
      .filter(p => p.length >= 10 && p.length <= 14)
      .slice(0, MAX_RECIPIENTS)
  }

  const handlePasteAdd = () => {
    const phones = parsePhones(pasteInput)
    const unique  = [...new Set([...recipients, ...phones])]
    setRecipients(unique)
    setPasteInput('')
    setError('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text   = ev.target?.result as string
      const phones = parsePhones(text)
      const unique = [...new Set([...recipients, ...phones])]
      setRecipients(unique)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeRecipient = (phone: string) =>
    setRecipients(r => r.filter(p => p !== phone))

  const handleSend = () => {
    if (!message.trim())        { setError('Type your message'); return }
    if (recipients.length === 0){ setError('Add at least one recipient'); return }
    if (!senderId.trim())       { setError('Enter a Sender ID'); return }
    if (balance && totalCost > balance.main) { setError('Insufficient balance for this campaign'); return }
    setError(''); setPinOpen(true)
  }

  const handleConfirmPin = async (_pin: string) => {
    // TODO: wire to real bulk SMS API
    await new Promise(r => setTimeout(r, 1500))
    setPinOpen(false)
    fetchBalance()
    setReceipt({ open: true, status: 'success', ref: `SNJ-SMS-${Date.now()}` })
  }

  return (
    <DashLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'var(--color-primary-muted)' }}>
            <MessageSquare size={21} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Bulk SMS</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              ₦{SMS_PRICE_PER_UNIT}/SMS · Balance: {balance ? formatNaira(balance.main) : '---'}
            </p>
          </div>
        </div>

        {/* Sender ID */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <p className="font-heading text-sm font-700 mb-2"
             style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Sender ID</p>
          <input value={senderId} onChange={e => setSenderId(e.target.value.slice(0, 11))}
            className="input" placeholder="e.g. MyBusiness (max 11 chars)" maxLength={11} />
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            This is what recipients see as the sender name.
          </p>
        </div>

        {/* Message composer */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-sm font-700"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Message</p>
            <span className="text-xs" style={{ color: charCount > MAX_SMS_LENGTH * 2 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
              {charCount}/{MAX_SMS_LENGTH} · {smsPages} SMS page{smsPages > 1 ? 's' : ''}
            </span>
          </div>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            className="input resize-none" rows={5}
            placeholder="Type your message here... Keep it under 160 characters for a single SMS." />
          {/* Character progress bar */}
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <div className="h-full rounded-full transition-all"
                 style={{
                   width:      `${Math.min(100, (charCount / MAX_SMS_LENGTH) * 100)}%`,
                   background: charCount <= MAX_SMS_LENGTH ? 'var(--color-secondary)' : 'var(--color-warning)',
                 }} />
          </div>
        </div>

        {/* Recipients */}
        <div className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-heading text-sm font-700"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Recipients
            </p>
            {recipients.length > 0 && (
              <span className="badge badge-primary text-xs">
                <Users size={11} /> {recipients.length.toLocaleString()} contacts
              </span>
            )}
          </div>

          {/* Tab: paste or upload */}
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--color-surface-elevated)' }}>
            {(['paste', 'upload'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-700 capitalize transition-all"
                style={{
                  fontWeight: 700, fontFamily: 'var(--font-heading)',
                  background:  tab === t ? 'var(--color-primary)' : 'transparent',
                  color:       tab === t ? 'white' : 'var(--color-text-secondary)',
                  border: 'none', cursor: 'pointer',
                }}>
                {t === 'paste' ? 'Paste Numbers' : 'Upload CSV'}
              </button>
            ))}
          </div>

          {tab === 'paste' ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={pasteInput} onChange={e => setPasteInput(e.target.value)}
                className="input resize-none text-sm" rows={4}
                placeholder="Paste phone numbers separated by commas, spaces, or new lines&#10;e.g. 08012345678, 08123456789" />
              <button onClick={handlePasteAdd} disabled={!pasteInput.trim()}
                className="btn btn-outline btn-sm w-full justify-center">
                Add Numbers
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                style={{ borderColor: 'var(--color-border)' }}
                onClick={() => fileRef.current?.click()}>
                <Upload size={28} style={{ color: 'var(--color-text-muted)' }} />
                <div className="text-center">
                  <p className="font-heading text-sm font-700 mb-1"
                     style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Upload CSV or TXT</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    One phone number per line, or comma separated
                  </p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {/* Recipient preview */}
          {recipients.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {recipients.slice(0, 20).map(phone => (
                  <span key={phone}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-600"
                    style={{ fontWeight: 600, background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                    {phone}
                    <button onClick={() => removeRecipient(phone)}
                      style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {recipients.length > 20 && (
                  <span className="px-2.5 py-1 rounded-full text-xs"
                        style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
                    +{recipients.length - 20} more
                  </span>
                )}
              </div>
              <button onClick={() => setRecipients([])}
                className="mt-2 text-xs hover:underline"
                style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Cost summary */}
        {recipients.length > 0 && message && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card p-5" style={{ borderRadius: 'var(--radius-xl)' }}>
            <p className="font-heading text-sm font-700 mb-4"
               style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Campaign Summary</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Recipients',   value: recipients.length.toLocaleString() },
                { label: 'SMS Pages',    value: smsPages },
                { label: 'Total Units',  value: totalUnits.toLocaleString() },
                { label: 'Total Cost',   value: formatNaira(totalCost) },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl"
                     style={{ background: 'var(--color-surface-elevated)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                  <p className="font-heading text-base font-800"
                     style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.value}</p>
                </div>
              ))}
            </div>
            {balance && totalCost > balance.main && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-xl"
                   style={{ background: 'var(--color-error-subtle)' }}>
                <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />
                <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                  Insufficient balance. Fund your wallet to proceed.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
        )}

        {/* Send button */}
        <button onClick={handleSend}
          disabled={!message || recipients.length === 0}
          className="btn btn-primary btn-lg w-full justify-center"
          style={{ opacity: (!message || recipients.length === 0) ? 0.5 : 1 }}>
          <Send size={18} />
          Send to {recipients.length.toLocaleString()} Recipient{recipients.length !== 1 ? 's' : ''}
          {message && recipients.length > 0 && ` — ${formatNaira(totalCost)}`}
        </button>
      </div>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handleConfirmPin}
        description={`${recipients.length} SMS campaign — ${formatNaira(totalCost)}`} />

      {receipt && (
        <ReceiptModal
          isOpen={receipt.open} status={receipt.status}
          title="Bulk SMS Campaign" amount={totalCost} reference={receipt.ref}
          details={[
            { label: 'Recipients', value: String(recipients.length) },
            { label: 'Sender ID',  value: senderId },
            { label: 'SMS Pages',  value: String(smsPages) },
          ]}
          onClose={() => { setReceipt(null); setRecipients([]); setMessage('') }}
        />
      )}
    </DashLayout>
  )
}
