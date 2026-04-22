'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { FaSearch, FaFilter, FaTruck, FaCheck, FaTimes, FaClock } from 'react-icons/fa'

interface Order {
  id: number
  patientId: number
  status: string
  paymentStatus: string
  paymentMethod: string
  quantity: number
  totalAmount: number
  createdAt: string
  medicine: { name: string; dosageForm: string; price: number }
  patient: { id: number; name: string; email: string; phone: string; address: string }
}

export default function PharmacistOrders() {
  const { data: session, status } = useSession()

  if (status === 'unauthenticated') redirect('/login')
  if (session?.user && (session.user as any).role !== 'PHARMACIST') redirect('/dashboard/patient')

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    let result = orders
    if (searchTerm) {
      result = result.filter(o =>
        o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.medicine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(o.id).includes(searchTerm)
      )
    }
    if (statusFilter !== 'all') result = result.filter(o => o.status.toLowerCase() === statusFilter)
    setFilteredOrders(result)
  }, [searchTerm, statusFilter, orders])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?all=true')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        setFilteredOrders(data)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
      } else {
        alert('Failed to update order status.')
      }
    } catch (err) {
      alert('Error updating order.')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PLACED': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'SHIPPED': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medicine Orders</h1>
          <p className="text-gray-600 mt-1">Process and manage patient medicine orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient or medicine..."
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="placed">Placed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">👤 {order.patient?.name} · {order.patient?.phone}</p>
                    <p className="text-sm text-gray-600">📍 {order.patient?.address || 'Address not provided'}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      💊 {order.medicine?.name} ({order.medicine?.dosageForm}) × {order.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      💳 {order.paymentMethod} · {order.paymentStatus} · ₹{order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.status === 'PLACED' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, 'PROCESSING')}
                          disabled={updating === order.id}
                          className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full hover:bg-blue-200 disabled:opacity-50"
                        >
                          <FaClock className="inline mr-1" /> Process
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'CANCELLED')}
                          disabled={updating === order.id}
                          className="bg-red-100 text-red-800 text-xs px-3 py-1.5 rounded-full hover:bg-red-200 disabled:opacity-50"
                        >
                          <FaTimes className="inline mr-1" /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button
                        onClick={() => updateStatus(order.id, 'SHIPPED')}
                        disabled={updating === order.id}
                        className="bg-purple-100 text-purple-800 text-xs px-3 py-1.5 rounded-full hover:bg-purple-200 disabled:opacity-50"
                      >
                        <FaTruck className="inline mr-1" /> Mark Shipped
                      </button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <button
                        onClick={() => updateStatus(order.id, 'DELIVERED')}
                        disabled={updating === order.id}
                        className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full hover:bg-green-200 disabled:opacity-50"
                      >
                        <FaCheck className="inline mr-1" /> Mark Delivered
                      </button>
                    )}
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