'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  phone?: string
  confirmPassword?: string
  specialization?: string
  qualifications?: string
  licenseNumber?: string
  degreeDetails?: string
  hospitalId?: string
}

interface Hospital {
  id: number
  name: string
  address: string
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
    role: 'PATIENT',
    specialization: '',
    qualifications: '',
    experience: '',
    licenseNumber: '',
    degreeDetails: '',
    hospitalId: '',
    pharmacyName: '',
    certificateNumber: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [hospitalsLoading, setHospitalsLoading] = useState(false)

  useEffect(() => {
    if (formData.role === 'DOCTOR' && hospitals.length === 0) {
      setHospitalsLoading(true)
      fetch('/api/hospitals')
        .then(r => r.json())
        .then(data => setHospitals(data))
        .catch(console.error)
        .finally(() => setHospitalsLoading(false))
    }
  }, [formData.role])

  const validateEmail = (v: string) => {
    if (!v) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
    return ''
  }
  const validatePhone = (v: string) => {
    if (!v) return 'Phone number is required'
    if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(v.replace(/[\s\-()]/g, ''))) return 'Enter a valid 10-digit Indian mobile number'
    return ''
  }
  const validatePassword = (v: string) => {
    if (!v) return 'Password is required'
    if (v.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter'
    if (!/[0-9]/.test(v)) return 'Include at least one number'
    return ''
  }
  const calcStrength = (v: string) => {
    let s = 0
    if (v.length >= 8) s++
    if (/[A-Z]/.test(v)) s++
    if (/[0-9]/.test(v)) s++
    if (/[^A-Za-z0-9]/.test(v)) s++
    return s
  }
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name': return value.trim().length < 2 ? 'Name must be at least 2 characters' : ''
      case 'email': return validateEmail(value)
      case 'phone': return validatePhone(value)
      case 'password': return validatePassword(value)
      default: return ''
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (['name', 'email', 'phone', 'password'].includes(name)) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }
    if (name === 'password') setPasswordStrength(calcStrength(value))
    if (name === 'confirmPassword') {
      setErrors(prev => ({ ...prev, confirmPassword: value !== formData.password ? 'Passwords do not match' : '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const newErrors: FormErrors = {}
    newErrors.name = validateField('name', formData.name)
    newErrors.email = validateField('email', formData.email)
    newErrors.phone = validateField('phone', formData.phone)
    newErrors.password = validateField('password', formData.password)
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.role === 'DOCTOR') {
      if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required'
      if (!formData.qualifications.trim()) newErrors.qualifications = 'Qualifications are required'
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required'
      if (!formData.degreeDetails.trim()) newErrors.degreeDetails = 'Degree details are required'
      if (!formData.hospitalId) newErrors.hospitalId = 'Please select your hospital'
    }

    if (Object.values(newErrors).some(v => v)) {
      setErrors(newErrors)
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
        if (data.error === 'User already exists' || data.error?.includes('already registered')) {
          throw new Error('Account already exists. Please sign in instead.')
        }
        throw new Error(data.error || 'Registration failed')
      }

      // ── Auto-login after successful registration ──────────────
      // 1. Update AuthContext with the returned user data (for immediate UI update)
      login(data.user)

      // 2. Also sign in via NextAuth so session cookies are set properly
      //    We send the raw credentials back — signIn never stores them.
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: data.credentials.email,
        password: data.credentials.password,
      })

      if (signInResult?.error) {
        // NextAuth sign-in failed, but AuthContext login succeeded — user
        // can still use the app via localStorage. Redirect them to profile.
        console.warn('[register] NextAuth auto-signin failed (non-fatal):', signInResult.error)
      }

      // Redirect to profile page immediately — no separate login required
      router.push('/profile')
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const isDoctor = formData.role === 'DOCTOR'
  const isPharmacist = formData.role === 'PHARMACIST'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {serverError}
            {serverError.includes('already exists') && (
              <div className="mt-2">
                <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in to your account</Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Full Name */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Full Name *</label>
            <input type="text" name="name"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              value={formData.name} onChange={handleChange} placeholder="John Doe" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Account Type *</label>
            <select name="role"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.role} onChange={handleChange}>
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACIST">Pharmacist</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email *</label>
            <input type="email" name="email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              value={formData.email} onChange={handleChange} placeholder="you@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Phone Number *</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
              <input type="tel" name="phone"
                className={`flex-1 px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                value={formData.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            {!errors.phone && formData.phone.length === 10 && <p className="text-green-600 text-xs mt-1">✓ Valid phone number</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Password *</label>
            <input type="password" name="password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              value={formData.password} onChange={handleChange} placeholder="Minimum 8 characters" />
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${passwordStrength <= 1 ? 'text-red-500' : passwordStrength <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>{strengthLabels[passwordStrength]}</p>
              </div>
            )}
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password *</label>
            <input type="password" name="confirmPassword"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            {!errors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && (
              <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Date of Birth</label>
            <input type="date" name="dob"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.dob} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Address</label>
            <input type="text" name="address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.address} onChange={handleChange} placeholder="123, Street, City, State" />
          </div>

          {/* ── DOCTOR FIELDS ── */}
          {isDoctor && (
            <div className="border-t border-blue-100 pt-4 space-y-4">
              <p className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                🩺 Doctor Registration Details
              </p>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Select Your Hospital *</label>
                {hospitalsLoading ? (
                  <p className="text-sm text-gray-500 py-2">Loading hospitals...</p>
                ) : (
                  <select name="hospitalId"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.hospitalId ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    value={formData.hospitalId} onChange={handleChange}>
                    <option value="">— Select the hospital you work at —</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name} — {h.address}</option>
                    ))}
                  </select>
                )}
                {errors.hospitalId && <p className="text-red-500 text-xs mt-1">{errors.hospitalId}</p>}
                <p className="text-xs text-gray-400 mt-1">Don't see your hospital? Contact the admin to have it added.</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Specialization *</label>
                <select name="specialization"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.specialization ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  value={formData.specialization} onChange={handleChange}>
                  <option value="">— Select specialization —</option>
                  {[
                    'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
                    'Gynecology', 'Dermatology', 'Ophthalmology', 'ENT', 'Psychiatry',
                    'Oncology', 'Radiology', 'Anesthesiology', 'Emergency Medicine', 'Other'
                  ].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Qualifications *</label>
                <input type="text" name="qualifications"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.qualifications ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  value={formData.qualifications} onChange={handleChange} placeholder="e.g., MBBS, MD, MS" />
                {errors.qualifications && <p className="text-red-500 text-xs mt-1">{errors.qualifications}</p>}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Years of Experience</label>
                <input type="number" name="experience" min="0" max="60"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.experience} onChange={handleChange} placeholder="e.g., 5" />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Medical License Number *</label>
                <input type="text" name="licenseNumber"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.licenseNumber ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  value={formData.licenseNumber} onChange={handleChange} placeholder="e.g., MCI/2015/12345" />
                {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Degree Details *</label>
                <input type="text" name="degreeDetails"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.degreeDetails ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  value={formData.degreeDetails} onChange={handleChange} placeholder="e.g., MBBS from AIIMS Delhi, 2010" />
                {errors.degreeDetails && <p className="text-red-500 text-xs mt-1">{errors.degreeDetails}</p>}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ Your doctor profile will be reviewed and approved by an admin before you can see patients. You can still use the app as a patient in the meantime.
              </div>
            </div>
          )}

          {/* ── PHARMACIST FIELDS ── */}
          {isPharmacist && (
            <div className="border-t border-green-100 pt-4 space-y-4">
              <p className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                💊 Pharmacist Registration Details
              </p>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Pharmacy Name</label>
                <input type="text" name="pharmacyName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.pharmacyName} onChange={handleChange} placeholder="e.g., City Pharmacy" />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Qualifications</label>
                <input type="text" name="qualifications"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.qualifications} onChange={handleChange} placeholder="e.g., B.Pharm, M.Pharm" />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">License Number *</label>
                <input type="text" name="licenseNumber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.licenseNumber} onChange={handleChange} placeholder="Pharmacy license number" />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Certificate Number *</label>
                <input type="text" name="certificateNumber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.certificateNumber} onChange={handleChange} placeholder="Certificate registration number" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ Your pharmacist profile will be reviewed and approved by an admin before activation.
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className={`w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}