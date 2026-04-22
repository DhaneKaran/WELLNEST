'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function RoleSelectionPage() {
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
          <p className="mb-6">Please sign in to access role selection</p>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Select Your Role</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition cursor-pointer">
              <h3 className="text-xl font-bold text-blue-900 mb-2">Patient</h3>
              <p className="text-blue-700">
                Access your medical records, schedule appointments, and manage your health information.
              </p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 hover:border-green-400 transition cursor-pointer">
              <h3 className="text-xl font-bold text-green-900 mb-2">Doctor</h3>
              <p className="text-green-700">
                Manage patient appointments, view medical records, and provide healthcare services.
              </p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition cursor-pointer">
              <h3 className="text-xl font-bold text-purple-900 mb-2">Pharmacist</h3>
              <p className="text-purple-700">
                Manage medicine inventory, process prescriptions, and provide pharmaceutical services.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Your current role is: <span className="font-semibold">{user.role || 'Not specified'}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Role selection is currently for display purposes. Contact support to change your role.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 