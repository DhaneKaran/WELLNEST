'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Hospital {
  id: number
  name: string
  address: string
  contact: string
  coordinates: number[]
  services: string[]
  rating: string | null
}

export default function HospitalsAdminPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    latitude: '',
    longitude: '',
    services: '',
    rating: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (session && (session.user as any).role !== 'ADMIN') {
      router.push('/dashboard/patient')
    }
  }, [session, router])

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/hospitals')
        if (!response.ok) throw new Error('Failed to fetch hospitals')
        const data = await response.json()
        setHospitals(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHospitals()
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate coordinates
      const lat = parseFloat(formData.latitude)
      const lng = parseFloat(formData.longitude)
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid latitude/longitude')
      }

      // Parse services
      const services = formData.services
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const response = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          contact: formData.contact,
          coordinates: [lat, lng],
          services,
          rating: formData.rating || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create hospital')
      }

      const newHospital = await response.json()
      setHospitals([...hospitals, newHospital])
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        contact: '',
        latitude: '',
        longitude: '',
        services: '',
        rating: ''
      })
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hospital?')) return

    try {
      const response = await fetch(`/api/hospitals/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete hospital')
      setHospitals(hospitals.filter(h => h.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!session || (session.user as any).role !== 'ADMIN') {
    return <div className="p-6 text-center">Access Denied</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hospitals Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showAddForm ? 'Cancel' : '+ Add Hospital'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Add Hospital Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Add New Hospital</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleFormChange}
                  step="0.00001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleFormChange}
                  step="0.00001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services (comma-separated) *</label>
              <textarea
                name="services"
                value={formData.services}
                onChange={handleFormChange}
                placeholder="e.g., Emergency, Surgery, Cardiology, Pediatrics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating (optional)</label>
              <input
                type="text"
                name="rating"
                value={formData.rating}
                onChange={handleFormChange}
                placeholder="e.g., 4.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-70"
              >
                {isSubmitting ? 'Adding...' : 'Add Hospital'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hospitals List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading hospitals...</div>
          ) : hospitals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hospitals found. Add one to get started.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Services</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital) => (
                  <tr key={hospital.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{hospital.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{hospital.address}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{hospital.contact}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {hospital.services.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                        {hospital.services.length > 2 && (
                          <span className="text-xs text-gray-500">+{hospital.services.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{hospital.rating ? `⭐ ${hospital.rating}` : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/dashboard/admin/hospitals/${hospital.id}`}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(hospital.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
