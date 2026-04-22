'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaCalendarAlt, FaUserInjured, FaPrescription, FaBell } from 'react-icons/fa'

export default function DoctorDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalPatients: 0,
    pendingAppointments: 0,
    todayAppointments: [] as any[]
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DOCTOR')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === 'DOCTOR') {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/appointments?doctorUserId=${user?.id}`)
      if (!res.ok) return
      const appointments: any[] = await res.json()

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const todayAppts = appointments.filter(a => {
        const d = new Date(a.date)
        return d >= today && d < tomorrow
      })

      const upcoming = appointments.filter(a => {
        const d = new Date(a.date)
        return d >= today && a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
      })

      const uniquePatients = new Set(appointments.map(a => a.patientId)).size
      const pending = appointments.filter(a => a.status === 'BOOKED').length

      setStats({
        upcomingAppointments: upcoming.length,
        totalPatients: uniquePatients,
        pendingAppointments: pending,
        todayAppointments: todayAppts
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, Dr. {user.name}</p>
        </div>

        {/* Notifications */}
        <div className="bg-white shadow rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
            {stats.pendingAppointments > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {stats.pendingAppointments} Pending
              </span>
            )}
          </div>
          {stats.pendingAppointments > 0 ? (
            <div className="flex items-start p-3 bg-blue-50 rounded-lg">
              <FaBell className="text-blue-500 mt-1 mr-3" />
              <p className="text-sm font-medium text-gray-900">
                You have {stats.pendingAppointments} new appointment request{stats.pendingAppointments > 1 ? 's' : ''} awaiting your review.{' '}
                <Link href="/dashboard/doctor/appointments" className="text-blue-600 underline">View all</Link>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No new notifications.</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FaCalendarAlt className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                <p className="text-lg font-medium text-gray-900">
                  {isLoadingStats ? '...' : stats.upcomingAppointments}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 text-sm">
              <Link href="/dashboard/doctor/appointments" className="font-medium text-blue-600 hover:text-blue-500">View all</Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FaUserInjured className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-lg font-medium text-gray-900">
                  {isLoadingStats ? '...' : stats.totalPatients}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 text-sm">
              <Link href="/dashboard/doctor/patients" className="font-medium text-blue-600 hover:text-blue-500">View all</Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FaPrescription className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-lg font-medium text-gray-900">
                  {isLoadingStats ? '...' : stats.pendingAppointments}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 text-sm">
              <Link href="/dashboard/doctor/prescriptions" className="font-medium text-blue-600 hover:text-blue-500">View prescriptions</Link>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Appointments</h3>
          </div>
          <div className="overflow-hidden">
            {isLoadingStats ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : stats.todayAppointments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No appointments scheduled for today.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {stats.todayAppointments.map(appt => (
                  <li key={appt.id}>
                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {appt.patient?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{appt.patient?.name}</div>
                          <div className="text-sm text-gray-500">{appt.time} — {appt.symptoms || 'No symptoms noted'}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}