'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  phone?: string
  dob?: string
  address?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    address: '',
    role: 'PATIENT'
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // ── Validation helpers ─────────────────────────────────────────────────────
  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required'
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(email)) return 'Enter a valid email address'
    return ''
  }

  const validatePhone = (phone: string): string => {
    if (!phone) return 'Phone number is required'
    // Accept 10-digit Indian numbers, optionally prefixed with +91 or 0
    const cleaned = phone.replace(/[\s\-()]/g, '')
    const re = /^(\+91|91|0)?[6-9]\d{9}$/
    if (!re.test(cleaned)) return 'Enter a valid 10-digit Indian mobile number'
    return ''
  }

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter'
    if (!/[0-9]/.test(password)) return 'Include at least one number'
    return ''
  }

  const calcStrength = (password: string): number => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name': return value.trim().length < 2 ? 'Name must be at least 2 characters' : ''
      case 'email': return validateEmail(value)
      case 'phone': return validatePhone(value)
      case 'password': return validatePassword(value)
      default: return ''
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Live validation
    const fieldError = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: fieldError }))

    if (name === 'password') {
      setPasswordStrength(calcStrength(value))
    }
    if (name === 'confirmPassword') {
      setErrors(prev => ({
        ...prev,
        confirmPassword: value !== formData.password ? 'Passwords do not match' : ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    // Full validation before submit
    const newErrors: FormErrors = {}
    newErrors.name = validateField('name', formData.name)
    newErrors.email = validateField('email', formData.email)
    newErrors.phone = validateField('phone', formData.phone)
    newErrors.password = validateField('password', formData.password)
    if (formData.password !== formData.confirmPassword) {
      ;(newErrors as any).confirmPassword = 'Passwords do not match'
    }

    if (Object.values(newErrors).some(v => v)) {
      setErrors(newErrors as any)
      return
    }

    setIsLoading(true)
    try {
      const { confirmPassword, ...payload } = formData
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        if (data.error === 'User already exists') {
          throw new Error('Account already exists. Please sign in instead.')
        }
        throw new Error(data.error || 'Registration failed')
      }

      login(data)
      router.push('/profile')
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {serverError}
            {serverError.includes('already exists') && (
              <div className="mt-2">
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                  Sign in to your account
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Full Name*</label>
            <input
              type="text"
              name="name"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Account Type*</label>
            <select
              name="role"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACIST">Pharmacist</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email*</label>
            <input
              type="email"
              name="email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Phone Number*</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
              <input
                type="tel"
                name="phone"
                className={`flex-1 px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            {!errors.phone && formData.phone.length === 10 && (
              <p className="text-green-600 text-xs mt-1">✓ Valid phone number</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Password*</label>
            <input
              type="password"
              name="password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
            />
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${passwordStrength <= 1 ? 'text-red-500' : passwordStrength <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {strengthLabels[passwordStrength]}
                </p>
              </div>
            )}
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password*</label>
            <input
              type="password"
              name="confirmPassword"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                (errors as any).confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
            />
            {(errors as any).confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{(errors as any).confirmPassword}</p>
            )}
            {!((errors as any).confirmPassword) && formData.confirmPassword && formData.confirmPassword === formData.password && (
              <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              name="dob"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.dob}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              name="address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.address}
              onChange={handleChange}
              placeholder="123, Street, City, State"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}