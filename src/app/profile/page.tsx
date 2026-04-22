"use client"

import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

function getRoleLabel(role?: string) {
  if (!role) return 'Not specified'
  if (role === 'PATIENT') return 'Patient'
  if (role === 'DOCTOR') return 'Doctor'
  if (role === 'PHARMACIST') return 'Pharmacist'
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export default function ProfilePage() {
  const { user, logout, loading } = useAuth()
  const { data: session } = useSession()

  useEffect(() => {
    if (user) {
      console.log('Profile page user data:', user)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading profile...</div>
      </div>
    )
  }

  const isSignedIn = !!session?.user || !!user

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">No Profile Found</h2>
          <p className="mb-6">Please sign in to view your profile</p>
          <div className="flex justify-center gap-4">
            <a
              href="/login"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Format date of birth properly
  const formatDateOfBirth = (dob: string | null) => {
    if (!dob) return 'Not provided'
    try {
      const date = new Date(dob)
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting DOB:', error)
      return 'Invalid date'
    }
  }

  // Format member since date
  const formatMemberSince = (createdAt: string) => {
    try {
      const date = new Date(createdAt)
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting member since:', error)
      return 'Unknown'
    }
  }

  // Merge session details with local user to reflect admin info accurately
  const displayName = (session?.user as any)?.name || user?.name || 'User'
  const displayEmail = (session?.user as any)?.email || user?.email || ''
  const displayRole = (session?.user as any)?.role || user?.role
  const displayRoles: string[] = (session?.user as any)?.roles || [displayRole]
  const displayId = (session?.user as any)?.id || user?.id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-blue-600 p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-600">
                    {displayName.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                  <p className="text-blue-100">{displayEmail}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                    {getRoleLabel(displayRole)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="/profile/edit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
                >
                  Edit Profile
                </a>
                <button
                  onClick={async () => { try { await signOut({ callbackUrl: '/login', redirect: true }) } finally { logout() } }}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
              <a
                href="/profile/edit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              >
                Edit Profile
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Full Name</h3>
                <p className="text-lg font-medium">{displayName}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Email</h3>
                <p className="text-lg font-medium">{displayEmail}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">User Type</h3>
                <p className="text-lg font-medium">{getRoleLabel(displayRole)}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Phone</h3>
                <p className="text-lg font-medium">{user?.phone || 'Not provided'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Date of Birth</h3>
                <p className="text-lg font-medium">{formatDateOfBirth(user?.dob || null)}</p>
              </div>
              
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Address</h3>
                <p className="text-lg font-medium">{user?.address || 'Not provided'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Member Since</h3>
                <p className="text-lg font-medium">{user?.createdAt ? formatMemberSince(user.createdAt) : 'Unknown'}</p>
              </div>

              {/* Signed-in account details from session */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Account ID</h3>
                <p className="text-lg font-medium">{displayId}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Roles</h3>
                <p className="text-lg font-medium">{displayRoles.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 