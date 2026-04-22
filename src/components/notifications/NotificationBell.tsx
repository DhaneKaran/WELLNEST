'use client'

/**
 * src/components/notifications/NotificationBell.tsx
 * ──────────────────────────────────────────────────
 * Real-time notification bell powered by SSE.
 * Drop this anywhere in your Navbar. It auto-connects to /api/notifications/sse
 * and updates when new events arrive.
 *
 * Usage in Navbar.tsx:
 *   import NotificationBell from '@/components/notifications/NotificationBell'
 *   <NotificationBell />
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

const TYPE_ICONS: Record<string, string> = {
  APPOINTMENT: '📅',
  ORDER: '📦',
  APPROVAL: '✅',
  PAYMENT: '💳',
  REMINDER: '⏰',
  ALERT: '⚠️',
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)

  // Initial fetch
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {}
    setLoading(false)
  }, [session])

  // SSE connection
  useEffect(() => {
    if (!session?.user) return

    fetchNotifications()

    const es = new EventSource('/api/notifications/sse')
    sseRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'CONNECTED') return

        // Prepend new notification
        setNotifications((prev) => [
          {
            id: data.id,
            type: data.type,
            title: data.title,
            message: data.message,
            read: false,
            createdAt: data.createdAt ?? new Date().toISOString(),
            metadata: data.metadata,
          },
          ...prev.slice(0, 29), // keep max 30
        ])
        setUnreadCount((c) => c + 1)

        // Browser notification (if permitted)
        if (Notification.permission === 'granted') {
          new Notification(`Wellnest: ${data.title}`, { body: data.message, icon: '/favicon.ico' })
        }
      } catch {}
    }

    es.onerror = () => {
      // EventSource auto-reconnects on error — no action needed
    }

    return () => {
      es.close()
    }
  }, [session, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = async (id: number) => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const deleteNotif = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (!session?.user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications() }}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${!n.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => deleteNotif(n.id, e)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors self-start"
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
