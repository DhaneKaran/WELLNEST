'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession, getSession } from 'next-auth/react'

interface User {
  id: number
  name: string
  email: string
  phone: string
  dob: string | null
  address: string | null
  role: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()
  const [storedUser, setStoredUser] = useState<User | null>(null)
  const [storageReady, setStorageReady] = useState(false)

  // Load from localStorage only once
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      try {
        setStoredUser(JSON.parse(currentUser))
      } catch {
        localStorage.removeItem('currentUser')
      }
    }
    setStorageReady(true)
  }, [])

  // Helper: sync user from session to state + localStorage
  const syncUserFromSession = (userFromSession: any) => {
    if (!userFromSession) return null
    const updatedUser: User = {
      id: Number(userFromSession.id ?? 0),
      name: userFromSession.name ?? '',
      email: userFromSession.email ?? '',
      phone: '',
      dob: null,
      address: null,
      role: String(userFromSession.role ?? ''),
      createdAt: ''
    }
    setStoredUser(updatedUser)
    localStorage.setItem('currentUser', JSON.stringify(updatedUser))
    return updatedUser
  }

  // Sync whenever session changes
  useEffect(() => {
    if (session?.user) {
      syncUserFromSession(session.user)
    }
  }, [session])

  // 🔥 FORCE SESSION REFRESH (called manually or via polling)
  const refreshSession = async () => {
    try {
      const newSession = await getSession()
      if (newSession?.user) {
        const refreshedUser = syncUserFromSession(newSession.user)
        // If role changed, trigger a custom event for dashboard redirects
        if (storedUser && refreshedUser && storedUser.role !== refreshedUser.role) {
          window.dispatchEvent(new CustomEvent('role-changed', { detail: refreshedUser.role }))
        }
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
    }
  }

  // 🔥 POLLING: check for role changes every 5 seconds
  useEffect(() => {
    if (!storageReady) return
    const interval = setInterval(() => {
      refreshSession()
    }, 5000)
    return () => clearInterval(interval)
  }, [storageReady])

  // 🔥 also refresh when window gets focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => refreshSession()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const sessionUser = session?.user
    ? {
        id: Number((session.user as any).id ?? 0),
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        phone: '',
        dob: null,
        address: null,
        role: String((session.user as any).role ?? ''),
        createdAt: ''
      }
    : null

  const user = sessionUser ?? storedUser
  const loading = status === 'loading' || !storageReady

  const login = (userData: User) => {
    setStoredUser(userData)
    localStorage.setItem('currentUser', JSON.stringify(userData))
  }

  const logout = () => {
    setStoredUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user,
        loading,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}