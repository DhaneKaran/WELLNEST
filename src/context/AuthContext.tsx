'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [storedUser, setStoredUser] = useState<User | null>(null)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser)
        console.log('AuthContext: Loaded user from localStorage:', parsedUser)
        setStoredUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('currentUser')
      }
    }
    setStorageReady(true)
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
    console.log('AuthContext: Logging in user:', userData)
    setStoredUser(userData)
    localStorage.setItem('currentUser', JSON.stringify(userData))
  }

  const logout = () => {
    console.log('AuthContext: Logging out user')
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
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
