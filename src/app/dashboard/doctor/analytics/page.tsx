'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaCalendarAlt, FaPills, FaFileInvoiceDollar, FaUserCircle, FaHistory, FaTachometerAlt } from 'react-icons/fa'

export default function PatientDashboard() {
  const { user } = useAuth()
  const { data: session } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')
  const [appointments, setAppointments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const effectiveUserId = (session?.user as any)?.id || user?.id
  const effectiveRole = (session?.user as any)?.role || user?.role

  useEffect(() => {
    if (effectiveRole && effectiveRole !== 'PATIENT') {
      router.push(`/dashboard/${effectiveRole.toLowerCase()}`)
    }
  }, [effectiveRole])

  useEffect(() => {
    if (effectiveUserId) {
      fetchData()
    }
  }, [effectiveUserId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [apptRes, orderRes, rxRes] = await Promise.all([
        fetch(`/api/appointments?patientId=${effectiveUserId}`),
        fetch(`/api/orders?patientId=${effectiveUserId}`),
        fetch(`/api/prescriptions?patientId=${effectiveUserId}`)
      ])

      if (apptRes.ok) setAppointments(await apptRes.json())
      if (orderRes.ok) setOrders(await orderRes.json())
      if (rxRes.ok) setPrescriptions(await rxRes.json())
    } catch (err) {
      console.error('Error fetching patient data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Stats
  const upcoming = appointments.filter(a => {
    const d = new Date(a.date)
    return d >= new Date() && a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
  })
  const completedAppts = appointments.filter(a => a.status === 'COMPLETED')
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
  const activePrescriptions = prescriptions.filter((p: any) => p.status === 'ACTIVE')

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': case 'ACTIVE': case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'BOOKED': case 'PLACED': case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-700'
      case 'SHIPPED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name || (session?.user as any)?.name || 'Patient'}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white shadow rounded-lg p-1 w-fit mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaTachometerAlt /> Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaHistory /> History
          </button>
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Upcoming Appointments', value: upcoming.length, color: 'bg-blue-500', icon: <FaCalendarAlt className="text-white" /> },
                { label: 'Active Orders', value: activeOrders.length, color: 'bg-green-500', icon: <FaPills className="text-white" /> },
                { label: 'Active Prescriptions', value: activePrescriptions.length, color: 'bg-purple-500', icon: <FaFileInvoiceDollar className="text-white" /> },
                { label: 'Total Visits', value: completedAppts.length, color: 'bg-orange-500', icon: <FaUserCircle className="text-white" /> },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                  <div className={`${stat.color} rounded-full p-3`}>{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link href="/hospitals" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow text-center">
                <div className="text-3xl mb-2">🏥</div>
                <h3 className="font-semibold text-gray-800">Book Appointment</h3>
                <p className="text-xs text-gray-500 mt-1">Find hospitals & doctors</p>
              </Link>
              <Link href="/medicines" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow text-center">
                <div className="text-3xl mb-2">💊</div>
                <h3 className="font-semibold text-gray-800">Order Medicines</h3>
                <p className="text-xs text-gray-500 mt-1">Browse & order medicines</p>
              </Link>
              <Link href="/bills" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow text-center">
                <div className="text-3xl mb-2">🧾</div>
                <h3 className="font-semibold text-gray-800">View Bills</h3>
                <p className="text-xs text-gray-500 mt-1">Check medical bills</p>
              </Link>
              <Link href="/profile" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow text-center">
                <div className="text-3xl mb-2">👤</div>
                <h3 className="font-semibold text-gray-800">My Profile</h3>
                <p className="text-xs text-gray-500 mt-1">Manage health info</p>
              </Link>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow mb-6">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Upcoming Appointments</h2>
                <Link href="/appointments" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              {isLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : upcoming.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No upcoming appointments.{' '}
                  <Link href="/hospitals" className="text-blue-600 hover:underline">Book one →</Link>
                </div>
              ) : (
                <ul className="divide-y">
                  {upcoming.slice(0, 3).map(a => (
                    <li key={a.id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Dr. {a.doctor?.name}</p>
                        <p className="text-sm text-gray-500">{a.hospital?.name} · {formatDate(a.date)} at {a.time}</p>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(a.status)}`}>{a.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Recent Orders</h2>
                <Link href="/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              {isLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No orders yet.{' '}
                  <Link href="/medicines" className="text-blue-600 hover:underline">Order medicines →</Link>
                </div>
              ) : (
                <ul className="divide-y">
                  {orders.slice(0, 3).map(o => (
                    <li key={o.id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{o.medicine?.name}</p>
                        <p className="text-sm text-gray-500">Qty: {o.quantity} · ₹{o.totalAmount?.toFixed(2)} · {formatDate(o.createdAt)}</p>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(o.status)}`}>{o.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Appointment History */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-800">📅 Appointment History</h2>
                <p className="text-xs text-gray-500 mt-0.5">All your past and current appointments</p>
              </div>
              {isLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : appointments.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No appointment history.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Doctor</th>
                        <th className="px-6 py-3 text-left">Hospital</th>
                        <th className="px-6 py-3 text-left">Date & Time</th>
                        <th className="px-6 py-3 text-left">Symptoms</th>
                        <th className="px-6 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {appointments.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-800">Dr. {a.doctor?.name}</td>
                          <td className="px-6 py-3 text-gray-600">{a.hospital?.name}</td>
                          <td className="px-6 py-3 text-gray-600">{formatDate(a.date)} {a.time}</td>
                          <td className="px-6 py-3 text-gray-500">{a.symptoms || '—'}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(a.status)}`}>{a.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Prescription History */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-800">📋 Prescription History</h2>
                <p className="text-xs text-gray-500 mt-0.5">Prescriptions issued by your doctors</p>
              </div>
              {isLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : prescriptions.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No prescriptions yet.</div>
              ) : (
                <div className="divide-y">
                  {prescriptions.map((rx: any) => (
                    <div key={rx.id} className="px-6 py-4">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                        <div>
                          <p className="font-medium text-gray-800">Dr. {rx.doctor?.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(rx.createdAt)} · {rx.appointment?.hospital?.name}</p>
                          <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Diagnosis:</span> {rx.diagnosis}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(rx.status)}`}>{rx.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(rx.medications as any[]).map((m: any, i: number) => (
                          <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                            {m.name} — {m.dosage}, {m.frequency}
                          </span>
                        ))}
                      </div>
                      {rx.instructions && (
                        <p className="text-xs text-gray-500 mt-1 italic">Instructions: {rx.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order History */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-800">💊 Medicine Order History</h2>
                <p className="text-xs text-gray-500 mt-0.5">All your medicine orders</p>
              </div>
              {isLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No orders yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Medicine</th>
                        <th className="px-6 py-3 text-left">Qty</th>
                        <th className="px-6 py-3 text-left">Amount</th>
                        <th className="px-6 py-3 text-left">Payment</th>
                        <th className="px-6 py-3 text-left">Date</th>
                        <th className="px-6 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-800">{o.medicine?.name}</td>
                          <td className="px-6 py-3 text-gray-600">{o.quantity}</td>
                          <td className="px-6 py-3 text-gray-600">₹{o.totalAmount?.toFixed(2)}</td>
                          <td className="px-6 py-3 text-gray-500 text-xs">{o.paymentMethod}</td>
                          <td className="px-6 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(o.status)}`}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}