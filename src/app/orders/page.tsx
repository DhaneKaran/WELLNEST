'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { FaCapsules, FaCreditCard, FaMoneyBillWave, FaSort, FaCalendarAlt, FaClock } from 'react-icons/fa'

interface Order {
  id: number
  medicineId: number
  patientId: number
  quantity: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  createdAt: string
  medicine: {
    name: string
  }
}

type SortOption = 'date-desc' | 'date-asc' | 'status-pending' | 'status-placed' | 'status-delivered'

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [sortOption, setSortOption] = useState<SortOption>('date-desc')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  useEffect(() => {
    sortAndFilterOrders()
  }, [orders, sortOption])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?patientId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const sortAndFilterOrders = () => {
    let sortedOrders = [...orders]

    switch (sortOption) {
      case 'date-desc':
        sortedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'date-asc':
        sortedOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'status-pending':
        sortedOrders = sortedOrders.filter(order => 
          order.paymentStatus.toLowerCase() === 'pending' || 
          order.status.toLowerCase() === 'placed'
        )
        break
      case 'status-placed':
        sortedOrders = sortedOrders.filter(order => 
          order.status.toLowerCase() === 'placed' || 
          order.status.toLowerCase() === 'confirmed'
        )
        break
      case 'status-delivered':
        sortedOrders = sortedOrders.filter(order => 
          order.status.toLowerCase() === 'delivered'
        )
        break
    }

    setFilteredOrders(sortedOrders)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'unpaid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    return method === 'UPI' ? <FaCreditCard className="text-blue-600" /> : <FaMoneyBillWave className="text-green-600" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Authentication Required</h2>
          <p className="mb-6">You must be signed in to view your orders</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order History</h1>
          <p className="text-xl text-gray-600">View all your medicine orders</p>
        </div>

        {/* Sort Options */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <FaSort className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sort & Filter Orders</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={() => setSortOption('date-desc')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOption === 'date-desc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCalendarAlt className="inline mr-1" />
              Newest First
            </button>
            
            <button
              onClick={() => setSortOption('date-asc')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOption === 'date-asc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCalendarAlt className="inline mr-1" />
              Oldest First
            </button>
            
            <button
              onClick={() => setSortOption('status-pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOption === 'status-pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaClock className="inline mr-1" />
              Pending
            </button>
            
            <button
              onClick={() => setSortOption('status-placed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOption === 'status-placed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCapsules className="inline mr-1" />
              Placed
            </button>
            
            <button
              onClick={() => setSortOption('status-delivered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOption === 'status-delivered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCapsules className="inline mr-1" />
              Delivered
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Medicine Orders</h2>
              <span className="text-sm text-gray-500">
                {filteredOrders.length} of {orders.length} orders
              </span>
            </div>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FaCapsules className="text-gray-400 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {orders.length === 0 ? 'No orders found' : 'No orders match the current filter'}
              </p>
              <p className="text-gray-400">
                {orders.length === 0 ? 'Your medicine orders will appear here' : 'Try changing the sort/filter options'}
              </p>
              {orders.length === 0 && (
                <button
                  onClick={() => router.push('/medicines')}
                  className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Order Medicines
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCapsules className="text-green-600" />
                        <h3 className="font-semibold text-lg">{order.medicine.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Quantity: {order.quantity}</span>
                        <span>Ordered: {formatDate(order.createdAt)} at {formatTime(order.createdAt)}</span>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(order.paymentMethod)}
                          <span>{order.paymentMethod === 'UPI' ? 'UPI Payment' : 'Cash on Delivery'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        ₹{order.totalAmount}
                      </div>
                      <div className="space-y-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        <div className="text-xs text-gray-500">
                          {order.status}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 