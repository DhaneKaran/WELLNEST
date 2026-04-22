'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaCalendarAlt, FaCheck, FaTimes, FaClock } from 'react-icons/fa'

interface Appointment {
  id: number
  patientId: number
  date: string
  time: string
  status: string
  symptoms?: string
  medicalHistory?: string
  hospital: { name: string }
  doctor: { name: string }
  patient: { id: number; name: string; email: string; phone: string }
}

export default function DoctorAppointments() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'pending'>('upcoming')
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DOCTOR')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === 'DOCTOR') {
      fetchAppointments()
    }
  }, [user])

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?doctorUserId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data)
      }
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        setAppointments(prev =>
          prev.map(a => (a.id === id ? { ...a, status } : a))
        )
      } else {
        alert('Failed to update appointment status.')
      }
    } catch (err) {
      alert('Error updating appointment.')
    } finally {
      setUpdating(null)
    }
  }

  const getFilteredAppointments = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    switch (activeTab) {
      case 'upcoming':
        return appointments.filter(a => new Date(a.date) >= today && a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
      case 'past':
        return appointments.filter(a => new Date(a.date) < today || a.status === 'COMPLETED' || a.status === 'CANCELLED')
      case 'pending':
        return appointments.filter(a => a.status === 'BOOKED')
      default:
        return appointments
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  const filtered = getFilteredAppointments()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">View and manage patient appointments</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg shadow p-1 mb-6 w-fit">
          {(['upcoming', 'pending', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            No {activeTab} appointments found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(appt => (
              <div key={appt.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{appt.patient?.name}</h3>
                    <p className="text-sm text-gray-500">{appt.patient?.email} · {appt.patient?.phone}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      <FaCalendarAlt className="inline mr-1" />
                      {new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at {appt.time}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Hospital: {appt.hospital?.name}</p>
                    {appt.symptoms && <p className="text-sm text-orange-700 mt-1">Symptoms: {appt.symptoms}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {appt.status === 'BOOKED' && (
                        <>
                          <button
                            onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                            disabled={updating === appt.id}
                            className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full hover:bg-green-200 disabled:opacity-50"
                          >
                            <FaCheck className="inline mr-1" /> Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'CANCELLED')}
                            disabled={updating === appt.id}
                            className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full hover:bg-red-200 disabled:opacity-50"
                          >
                            <FaTimes className="inline mr-1" /> Cancel
                          </button>
                        </>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => updateStatus(appt.id, 'COMPLETED')}
                            disabled={updating === appt.id}
                            className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full hover:bg-blue-200 disabled:opacity-50"
                          >
                            <FaCheck className="inline mr-1" /> Mark Complete
                          </button>
                          <Link
                            href={`/dashboard/doctor/prescriptions?appointmentId=${appt.id}&patientId=${appt.patientId}&patientName=${encodeURIComponent(appt.patient?.name)}`}
                            className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full hover:bg-purple-200"
                          >
                            Write Prescription
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}