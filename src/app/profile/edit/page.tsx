'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface Hospital {
  id: number
  name: string
  address: string
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM']

export default function EditProfilePage() {
  const router = useRouter()
  const { user, login } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    address: ''
  })

  // Doctor-specific fields
  const [doctorData, setDoctorData] = useState({
    specialization: '',
    qualifications: '',
    experience: '',
    description: '',
    selectedHospitalId: '',
    availability: {} as Record<string, string[]>,
    licenseNumber: ''
  })

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [currentDoctor, setCurrentDoctor] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hospitalLoading, setHospitalLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        address: user.address || ''
      })

      if (user.role === 'DOCTOR') {
        fetchHospitals()
        fetchDoctorRecord()
      }
    }
  }, [user])

  const fetchHospitals = async () => {
    try {
      const res = await fetch('/api/hospitals')
      if (res.ok) setHospitals(await res.json())
    } catch (err) {
      console.error('Error fetching hospitals:', err)
    }
  }

  const fetchDoctorRecord = async () => {
    try {
      const res = await fetch(`/api/doctors?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
        setCurrentDoctor(data)
        setDoctorData({
          specialization: data.specialization || '',
          qualifications: data.qualifications || '',
          experience: data.experience?.toString() || '',
          description: data.description || '',
          selectedHospitalId: data.hospitalId?.toString() || '',
          availability: data.availability || {},
          licenseNumber: data.licenseNumber || ''
        })
      }
      }
    } catch (err) {
      console.error('Error fetching doctor record:', err)
    }
  }

  const toggleSlot = (day: string, slot: string) => {
    setDoctorData(prev => {
      const current = prev.availability[day] || []
      const updated = current.includes(slot)
        ? current.filter(s => s !== slot)
        : [...current, slot].sort()
      return { ...prev, availability: { ...prev.availability, [day]: updated } }
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDoctorData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // 1. Update base user profile
      const profileRes = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, ...formData }),
      })
      if (!profileRes.ok) {
        const d = await profileRes.json()
        throw new Error(d.error || 'Failed to update profile')
      }

      // 2. If doctor, update hospital assignment + doctor profile
      if (user?.role === 'DOCTOR') {
        if (!doctorData.selectedHospitalId) {
          throw new Error('Please select a hospital you are working at')
        }

        // Update Doctor record (hospitalId + professional info)
        const doctorRes = await fetch('/api/doctors', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            hospitalId: parseInt(doctorData.selectedHospitalId),
            specialization: doctorData.specialization,
            description: doctorData.description,
            experience: doctorData.experience,
            qualifications: doctorData.qualifications,
            availability: doctorData.availability,
            // licenseNumber removed
          }),
        })
        if (!doctorRes.ok) {
          const d = await doctorRes.json()
          throw new Error(d.error || 'Failed to update doctor hospital')
        }

        // Also update DoctorProfile table
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'DOCTOR',
            specialization: doctorData.specialization,
            qualifications: doctorData.qualifications,
            experience: parseInt(doctorData.experience) || 0,
            licenseNumber: doctorData.licenseNumber,
          }),
        })
      }

      // Update context
      if (user) {
        login({
          ...user,
          ...formData,
          dob: formData.dob ? new Date(formData.dob).toISOString() : null
        })
      }

      setSuccess('Profile updated successfully!')
      setTimeout(() => router.push('/profile'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Access Denied</h2>
          <p className="mb-6">Please sign in to edit your profile</p>
          <a href="/login" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">Sign In</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
            <p className="text-gray-500 text-sm mt-1">Update your personal information</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Personal Info ───────────────────────────────────────────── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10-digit mobile number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street, City, State" />
                </div>
              </div>
            </div>

            {/* ── Doctor Section ──────────────────────────────────────────── */}
            {user.role === 'DOCTOR' && (
              <>
                <div className="border-t pt-5">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Professional Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization*</label>
                      <input type="text" name="specialization" value={doctorData.specialization} onChange={handleDoctorChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Cardiologist" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                      <input type="number" name="experience" value={doctorData.experience} onChange={handleDoctorChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        min="0" placeholder="e.g. 10" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                      <input type="text" name="qualifications" value={doctorData.qualifications} onChange={handleDoctorChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. MBBS, MD" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <input type="text" name="licenseNumber" value={doctorData.licenseNumber} onChange={handleDoctorChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Medical license number" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio / Description</label>
                      <textarea name="description" value={doctorData.description} onChange={handleDoctorChange} rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief professional description" />
                    </div>
                  </div>
                </div>

                {/* Hospital Assignment */}
                <div className="border-t pt-5">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Hospital Assignment*</h2>
                  <p className="text-xs text-gray-400 mb-3">
                    Select the hospital you are currently working at. Patients will only see you when they select this hospital.
                  </p>
                  {currentDoctor?.hospital && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm">
                      <span className="text-blue-700 font-medium">Current Hospital: </span>
                      <span className="text-blue-900">{currentDoctor.hospital.name}</span>
                      <span className="text-blue-600 ml-2 text-xs">— {currentDoctor.hospital.address}</span>
                    </div>
                  )}
                  <select
                    name="selectedHospitalId"
                    value={doctorData.selectedHospitalId}
                    onChange={handleDoctorChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">— Select Hospital —</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name} · {h.address}</option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div className="border-t pt-5">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Weekly Availability</h2>
                  <p className="text-xs text-gray-400 mb-3">Select the time slots you are available each day. Patients will only see these slots when booking.</p>
                  <div className="space-y-3">
                    {DAYS.map(day => (
                      <div key={day}>
                        <p className="text-sm font-medium text-gray-700 capitalize mb-1">{day}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {TIME_SLOTS.map(slot => {
                            const selected = (doctorData.availability[day] || []).includes(slot)
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => toggleSlot(day, slot)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                  selected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                {slot}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t">
              <button type="submit" disabled={isLoading}
                className={`bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => router.push('/profile')}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}