"use client"

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { FaBell } from 'react-icons/fa'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  time: string
  read: boolean
}

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const { data: session } = useSession()
  const sessionRole = (session?.user as any)?.role
  const rawSessionRoles = (session?.user as any)?.roles
  const sessionRoles: string[] = Array.isArray(rawSessionRoles)
    ? rawSessionRoles
    : rawSessionRoles
      ? Object.values(rawSessionRoles)
      : sessionRole ? [sessionRole] : []
  const effectiveRole = sessionRole || user?.role
  const isAuthenticated = !!session
  const isAdmin = sessionRoles.includes('ADMIN') || effectiveRole === 'ADMIN'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const notifRef = useRef<HTMLDivElement>(null)

  const effectiveUserId = (session?.user as any)?.id || user?.id

  useEffect(() => {
    if (!effectiveUserId || !effectiveRole || effectiveRole === 'ADMIN') return

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${effectiveUserId}&role=${effectiveRole}`)
        if (res.ok) {
          const data = await res.json()
          // Load read IDs from localStorage
          const stored = localStorage.getItem(`notif-read-${effectiveUserId}`)
          const storedIds = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>()
          setReadIds(storedIds)
          setNotifications(data)
        }
      } catch (err) {
        // Silently fail — notifications are not critical
      }
    }

    fetchNotifications()
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [effectiveUserId, effectiveRole])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id))
    setReadIds(allIds)
    localStorage.setItem(`notif-read-${effectiveUserId}`, JSON.stringify(Array.from(allIds)))
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT': return '📅'
      case 'ORDER': return '💊'
      case 'REMINDER': return '⏰'
      case 'ALERT': return '⚠️'
      default: return '🔔'
    }
  }

  const getTimeAgo = (time: string) => {
    const diff = Date.now() - new Date(time).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) return null

  return (
    <nav className="bg-white shadow-sm text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-lg font-bold text-blue-600">
                HealthPlan Assistance
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link href="/" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>

              {/* Patient Links */}
              {isAuthenticated && effectiveRole === 'PATIENT' && (
                <>
                  <Link href="/hospitals" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Hospitals</Link>
                  <Link href="/medicines" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Medicines</Link>
                  <Link href="/appointments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Appointments</Link>
                  <Link href="/orders" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Orders</Link>
                  <Link href="/bills" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Bills</Link>
                  <Link href="/dashboard/patient" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Dashboard</Link>
                </>
              )}

              {/* Doctor Links */}
              {isAuthenticated && effectiveRole === 'DOCTOR' && (
                <>
                  <Link href="/dashboard/doctor" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Dashboard</Link>
                  <Link href="/dashboard/doctor/appointments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Appointments</Link>
                  <Link href="/dashboard/doctor/patients" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Patients</Link>
                  <Link href="/dashboard/doctor/prescriptions" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Prescriptions</Link>
                  <Link href="/dashboard/doctor/analytics" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Analytics</Link>
                </>
              )}

              {/* Pharmacist Links */}
              {isAuthenticated && effectiveRole === 'PHARMACIST' && (
                <>
                  <Link href="/dashboard/pharmacist" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Dashboard</Link>
                  <Link href="/dashboard/pharmacist/prescriptions" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Prescriptions</Link>
                  <Link href="/dashboard/pharmacist/inventory" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Inventory</Link>
                  <Link href="/dashboard/pharmacist/orders" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Orders</Link>
                  <Link href="/dashboard/pharmacist/analytics" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Analytics</Link>
                </>
              )}

              {/* Admin Links */}
              {isAuthenticated && isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Admin ▾
                  </button>
                  {adminMenuOpen && (
                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border">
                      <Link href="/dashboard/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setAdminMenuOpen(false)}>Dashboard</Link>
                      <Link href="/dashboard/admin/hospitals" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setAdminMenuOpen(false)}>Hospitals</Link>
                      <Link href="/dashboard/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setAdminMenuOpen(false)}>Users</Link>
                      <Link href="/dashboard/admin/approvals" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setAdminMenuOpen(false)}>Approvals</Link>
                      <Link href="/dashboard/admin/logs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setAdminMenuOpen(false)}>Logs</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Notification bell + profile */}
          <div className="hidden sm:flex sm:items-center sm:ml-6 gap-3">
            {/* Notification Bell - only for authenticated non-admin users */}
            {isAuthenticated && !isAdmin && effectiveRole && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Notifications"
                >
                  <FaBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 flex flex-col">
                    <div className="flex justify-between items-center px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                          <FaBell className="mx-auto mb-2 h-6 w-6 opacity-30" />
                          No notifications
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b last:border-b-0 ${
                              readIds.has(n.id) ? 'bg-white' : 'bg-blue-50'
                            }`}
                          >
                            <div className="flex gap-2">
                              <span className="text-base mt-0.5">{getNotifIcon(n.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{getTimeAgo(n.time)}</p>
                              </div>
                              {!readIds.has(n.id) && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors">
                  {(session?.user as any)?.name || user?.name || 'Profile'}
                </Link>
                <button
                  onClick={async () => {
                    try { await signOut({ callbackUrl: '/login', redirect: true }) } finally { logout() }
                  }}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">Sign In</Link>
                <Link href="/register" className="bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            {isAuthenticated && !isAdmin && (
              <div className="relative mr-2" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-500">
                  <FaBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border z-50 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`px-3 py-2 border-b last:border-b-0 ${readIds.has(n.id) ? '' : 'bg-blue-50'}`}>
                          <p className="text-xs font-semibold">{getNotifIcon(n.type)} {n.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{getTimeAgo(n.time)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <span className="sr-only">Open main menu</span>
              <svg className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link href="/" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            {isAuthenticated && effectiveRole === 'PATIENT' && (
              <>
                <Link href="/hospitals" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Hospitals</Link>
                <Link href="/medicines" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Medicines</Link>
                <Link href="/appointments" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Appointments</Link>
                <Link href="/orders" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link href="/bills" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Bills</Link>
                <Link href="/dashboard/patient" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              </>
            )}
            {isAuthenticated && effectiveRole === 'DOCTOR' && (
              <>
                <Link href="/dashboard/doctor" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link href="/dashboard/doctor/appointments" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Appointments</Link>
                <Link href="/dashboard/doctor/patients" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Patients</Link>
                <Link href="/dashboard/doctor/prescriptions" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Prescriptions</Link>
                <Link href="/dashboard/doctor/analytics" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
              </>
            )}
            {isAuthenticated && effectiveRole === 'PHARMACIST' && (
              <>
                <Link href="/dashboard/pharmacist" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link href="/dashboard/pharmacist/orders" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link href="/dashboard/pharmacist/inventory" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Inventory</Link>
                <Link href="/dashboard/pharmacist/prescriptions" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Prescriptions</Link>
                <Link href="/dashboard/pharmacist/analytics" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
              </>
            )}
            <Link href="/profile" className="block py-2 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
            {isAuthenticated ? (
              <button onClick={async () => { await signOut({ callbackUrl: '/login', redirect: true }); logout() }} className="block py-2 text-sm text-red-500 w-full text-left">
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-sm text-blue-600" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className="block py-2 text-sm text-blue-600" onClick={() => setMobileMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}