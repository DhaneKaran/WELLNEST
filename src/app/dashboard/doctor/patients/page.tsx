'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { FaSearch } from 'react-icons/fa'

interface Patient {
  id: number
  name: string
  email: string
  phone: string
  lastVisit: string
  symptoms: string
  status: string
}

export default function DoctorPatients() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DOCTOR')) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === 'DOCTOR') fetchPatients()
  }, [user])

  const fetchPatients = async () => {
    try {
      const res = await fetch(`/api/appointments?doctorUserId=${user?.id}`)
      if (!res.ok) return
      const appointments: any[] = await res.json()

      // Deduplicate patients by patientId, keep latest visit
      const patientMap = new Map<number, Patient>()
      appointments.forEach(a => {
        const existing = patientMap.get(a.patientId)
        if (!existing || new Date(a.date) > new Date(existing.lastVisit)) {
          patientMap.set(a.patientId, {
            id: a.patientId,
            name: a.patient?.name || 'Unknown',
            email: a.patient?.email || '',
            phone: a.patient?.phone || '',
            lastVisit: a.date,
            symptoms: a.symptoms || 'N/A',
            status: a.status
          })
        }
      })

      setPatients(Array.from(patientMap.values()))
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading || !user) {
    return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
          <p className="text-gray-600 mt-1">Patients who have booked appointments with you</p>
        </div>

        <div className="mb-6 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            No patients found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(patient => (
              <div key={patient.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-700 font-bold">{patient.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-xs text-gray-500">{patient.email}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📞 {patient.phone || 'N/A'}</p>
                  <p>🗓 Last visit: {new Date(patient.lastVisit).toLocaleDateString('en-IN')}</p>
                  <p>🩺 Symptoms: {patient.symptoms}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}