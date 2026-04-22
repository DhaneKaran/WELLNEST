// src/components/AppShell.tsx
'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Authentication Required</h2>
          <p className="mb-6">Please sign in to access this page</p>
          <div className="flex justify-center gap-4">
            <a
              href="/login"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 