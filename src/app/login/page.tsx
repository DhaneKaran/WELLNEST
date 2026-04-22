'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required'
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(email)) return 'Enter a valid email address'
    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
    if (name === 'email') setErrors(prev => ({ ...prev, email: validateEmail(value) }))
    if (name === 'password') setErrors(prev => ({ ...prev, password: value.length < 1 ? 'Password is required' : '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailErr = validateEmail(credentials.email)
    const passErr = credentials.password ? '' : 'Password is required'
    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr })
      return
    }

    setServerError('')
    setIsLoading(true)

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })

      if (!res || !res.ok) throw new Error('Invalid email or password. Please try again.')

      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const role = session?.user?.role

      if (role === 'ADMIN') router.push('/dashboard/admin')
      else if (role === 'DOCTOR') router.push('/dashboard/doctor')
      else if (role === 'PHARMACIST') router.push('/dashboard/pharmacist')
      else router.push('/dashboard/patient')
    } catch (err: any) {
      setServerError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Sign In</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Welcome back to HealthPlan</p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email*</label>
            <input
              type="email"
              name="email"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              value={credentials.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-gray-700 text-sm font-medium">Password*</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}