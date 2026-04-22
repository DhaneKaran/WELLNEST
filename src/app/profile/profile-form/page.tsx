'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function ProfileFormPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

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
          <p className="mb-6">Please sign in to access profile forms</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Profile Forms</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Patient Information</h3>
              <p className="text-blue-700 mb-4">
                View and manage your patient profile information including personal details and medical history.
              </p>
              <button
                onClick={() => router.push('/profile')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                View Profile
              </button>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-4">Role Management</h3>
              <p className="text-green-700 mb-4">
                Select or update your role in the healthcare system (Patient, Doctor, or Pharmacist).
              </p>
              <button
                onClick={() => router.push('/profile/role-selection')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                Manage Role
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Name:</span> {user.name}
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-medium text-gray-600">Phone:</span> {user.phone || 'Not provided'}
              </div>
              <div>
                <span className="font-medium text-gray-600">Role:</span> {user.role || 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 