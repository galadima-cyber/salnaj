import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, CheckCheck, Shield, CheckCircle2,
  Sparkles, Info, ExternalLink,
} from 'lucide-react'
import { notificationApi, NotificationItem } from '@/services/endpoints'
import { useNavigate } from 'react-router-dom'

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

export function NotificationDrawer({ isOpen, onClose, onUnreadChange }: NotificationDrawerProps) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(false)
  const [filter,        setFilter]        = useState<'all' | 'unread'>('all')

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getAll(1, 30)
      if (res.data.data) {
        setNotifications(res.data.data.items || [])
        const unread = res.data.data.unreadCount || 0
        setUnreadCount(unread)
        onUnreadChange?.(unread)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      onUnreadChange?.(0)
    } catch {
      // silent
    }
  }

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await notificationApi.markAsRead(item.id)
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n))
        setUnreadCount(c => Math.max(0, c - 1))
        onUnreadChange?.(Math.max(0, unreadCount - 1))
      } catch {
        // silent
      }
    }
    if (item.actionUrl) {
      onClose()
      navigate(item.actionUrl)
    }
  }

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications

  const getIcon = (type: string) => {
    switch (type) {
      case 'TRANSACTION':
        return <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
      case 'SECURITY':
        return <Shield size={16} style={{ color: 'var(--color-error)' }} />
      case 'PROMO':
        return <Sparkles size={16} style={{ color: 'var(--color-secondary)' }} />
      default:
        return <Info size={16} style={{ color: 'var(--color-primary)' }} />
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.round(diffMs / 60000)
    if (diffMins < 2) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.round(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col shadow-2xl"
            style={{ background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
          >
            {/* Drawer Header */}
            <div
              className="p-4 sm:p-5 flex items-center justify-between shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--color-primary-muted)' }}
                >
                  <Bell size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3 className="font-heading font-700 text-base" style={{ color: 'var(--color-text-primary)' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-800"
                    style={{ background: 'var(--color-error)', color: 'white', fontSize: '0.68rem' }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="btn btn-outline btn-sm py-1 px-2 text-xs"
                  >
                    <CheckCheck size={13} /> Read all
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex px-4 pt-3 pb-2 gap-2 shrink-0">
              <button
                onClick={() => setFilter('all')}
                className="px-3 py-1 rounded-lg text-xs font-700 transition-all"
                style={{
                  background: filter === 'all' ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                  color: filter === 'all' ? 'white' : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className="px-3 py-1 rounded-lg text-xs font-700 transition-all"
                style={{
                  background: filter === 'unread' ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                  color: filter === 'unread' ? 'white' : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification items list */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
              {filtered.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                    style={{ background: 'var(--color-surface-elevated)' }}
                  >
                    <Bell size={20} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <p className="font-heading font-700 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    No notifications
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    You're all caught up! New alerts will appear here.
                  </p>
                </div>
              ) : (
                filtered.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="p-3.5 rounded-2xl transition-all cursor-pointer flex gap-3 text-left relative"
                    style={{
                      background: item.isRead ? 'var(--color-surface-elevated)' : 'var(--color-primary-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--color-surface)' }}
                    >
                      {getIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className="font-heading text-xs font-700 truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {item.title}
                        </p>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.message}
                      </p>
                      {item.actionUrl && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-600 text-emerald-600 mt-1">
                          View details <ExternalLink size={10} />
                        </span>
                      )}
                    </div>

                    {!item.isRead && (
                      <span
                        className="w-2 h-2 rounded-full absolute top-3 right-3"
                        style={{ background: 'var(--color-primary)' }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
