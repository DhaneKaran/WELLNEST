'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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

export default function HospitalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const hospitalId = params.id as string
  const { data: session } = useSession()
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (session && (session.user as any).role !== 'ADMIN') {
      router.push('/dashboard/patient')
    }
  }, [session, router])

  // Fetch hospital details
  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/hospitals/${hospitalId}`)
        if (!response.ok) throw new Error('Hospital not found')
        const data = await response.json()
        setHospital(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (hospitalId) {
      fetchHospital()
    }
  }, [hospitalId])

  if (!session || (session.user as any).role !== 'ADMIN') {
    return <div className="p-6 text-center">Access Denied</div>
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading hospital details...</div>
  }

  if (error || !hospital) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error || 'Hospital not found'}
        </div>
        <Link
          href="/dashboard/admin/hospitals"
          className="text-blue-600 hover:underline"
        >
          ← Back to Hospitals
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/admin/hospitals"
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to Hospitals
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{hospital.name}</h1>
          <div className="flex items-center gap-2">
            {hospital.rating && (
              <span className="text-2xl">
                ⭐ <span className="text-lg font-medium">{hospital.rating}</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-lg text-gray-900">{hospital.contact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-lg text-gray-900">{hospital.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Coordinates</p>
                <p className="text-lg text-gray-900">
                  {hospital.coordinates[0].toFixed(5)}, {hospital.coordinates[1].toFixed(5)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h2>
            <div className="flex flex-wrap gap-2">
              {hospital.services.map((service, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full font-medium"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Map Preview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <a
              href={`https://maps.google.com/?q=${hospital.coordinates[0]},${hospital.coordinates[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Google Maps
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            onClick={() => router.push('/dashboard/admin/hospitals')}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
