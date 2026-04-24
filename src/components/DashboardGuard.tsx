'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const getDashboardRoute = (role: string) => {
  switch (role) {
    case 'DOCTOR': return '/dashboard/doctor'
    case 'PHARMACIST': return '/dashboard/pharmacist'
    default: return '/dashboard/patient'
  }
}

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshSession } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && user) {
      const expectedRoute = getDashboardRoute(user.role)
      // If user is on the wrong dashboard, redirect
      if (!pathname.startsWith(expectedRoute)) {
        router.replace(expectedRoute)
      }
    }
  }, [user, loading, pathname, router])

  // Also listen for role-changed events
  useEffect(() => {
    const handleRoleChange = () => {
      refreshSession()
    }
    window.addEventListener('role-changed', handleRoleChange)
    return () => window.removeEventListener('role-changed', handleRoleChange)
  }, [refreshSession])

  if (loading) return <div>Loading...</div>
  return <>{children}</>
}