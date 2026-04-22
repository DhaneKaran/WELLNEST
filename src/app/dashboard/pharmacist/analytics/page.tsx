'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { FaShoppingCart, FaPills, FaMoneyBillWave, FaClipboardList } from 'react-icons/fa'

export default function PharmacistAnalytics() {
  const { data: session, status } = useSession()

  if (status === 'unauthenticated') redirect('/login')
  if (session?.user && (session.user as any).role !== 'PHARMACIST') redirect('/dashboard/patient')

  const [orders, setOrders] = useState<any[]>([])
  const [medicines, setMedicines] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session) fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      const [orderRes, medRes, rxRes] = await Promise.all([
        fetch('/api/orders?all=true'),
        fetch('/api/medicines'),
        fetch('/api/prescriptions')
      ])
      if (orderRes.ok) setOrders(await orderRes.json())
      if (medRes.ok) setMedicines(await medRes.json())
      if (rxRes.ok) setPrescriptions(await rxRes.json())
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Stats
  const totalOrders = orders.length
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length
  const pendingOrders = orders.filter(o => o.status === 'PLACED').length
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const grossRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const lowStock = medicines.filter(m => m.stock < 20).length

  // Monthly orders (last 6 months)
  const monthlyOrders = (() => {
    const map: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      map[key] = 0
    }
    orders.forEach(o => {
      const d = new Date(o.createdAt)
      const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      if (key in map) map[key]++
    })
    return Object.entries(map)
  })()
  const maxMonthly = Math.max(...monthlyOrders.map(([, v]) => v), 1)

  // Monthly revenue
  const monthlyRevenue = (() => {
    const map: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      map[key] = 0
    }
    orders
      .filter(o => o.status === 'DELIVERED')
      .forEach(o => {
        const d = new Date(o.createdAt)
        const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        if (key in map) map[key] += o.totalAmount || 0
      })
    return Object.entries(map)
  })()
  const maxRevenue = Math.max(...monthlyRevenue.map(([, v]) => v), 1)

  // Top medicines by order count
  const medCount: Record<string, { name: string; count: number; revenue: number }> = {}
  orders.forEach(o => {
    const name = o.medicine?.name || 'Unknown'
    if (!medCount[name]) medCount[name] = { name, count: 0, revenue: 0 }
    medCount[name].count += o.quantity
    medCount[name].revenue += o.totalAmount || 0
  })
  const topMedicines = Object.values(medCount).sort((a, b) => b.count - a.count).slice(0, 5)

  // Status breakdown
  const statusMap: Record<string, number> = {}
  orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1 })
  const statusColors: Record<string, string> = {
    PLACED: 'bg-yellow-400',
    PROCESSING: 'bg-blue-400',
    SHIPPED: 'bg-purple-400',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-400'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Analytics</h1>
          <p className="text-gray-500 mt-1">Real-time insights from your pharmacy data</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading analytics...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Orders', value: totalOrders, icon: <FaShoppingCart />, color: 'bg-blue-500' },
                { label: 'Orders Delivered', value: deliveredOrders, icon: <FaClipboardList />, color: 'bg-green-500' },
                { label: 'Pending Orders', value: pendingOrders, icon: <FaPills />, color: 'bg-yellow-500' },
                { label: 'Gross Revenue (Delivered)', value: `₹${grossRevenue.toFixed(0)}`, icon: <FaMoneyBillWave />, color: 'bg-purple-500' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                  <div className={`${card.color} text-white rounded-full p-3 text-lg`}>{card.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Order Volume */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Monthly Order Volume</h2>
                {totalOrders === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No order data yet</div>
                ) : (
                  <div className="flex items-end gap-3 h-40">
                    {monthlyOrders.map(([month, count]) => (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-600 font-medium">{count}</span>
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all duration-500"
                          style={{ height: `${(count / maxMonthly) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                        />
                        <span className="text-xs text-gray-400">{month}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Monthly Revenue (Delivered Orders, ₹)</h2>
                {grossRevenue === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
                ) : (
                  <div className="flex items-end gap-3 h-40">
                    {monthlyRevenue.map(([month, amount]) => (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-600 font-medium">₹{amount > 0 ? amount.toFixed(0) : 0}</span>
                        <div
                          className="w-full bg-green-500 rounded-t transition-all duration-500"
                          style={{ height: `${(amount / maxRevenue) * 100}%`, minHeight: amount > 0 ? '4px' : '0' }}
                        />
                        <span className="text-xs text-gray-400">{month}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Order Status Breakdown */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Order Status Breakdown</h2>
                {totalOrders === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">No order data yet</div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(statusMap).map(([status, count]) => (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 capitalize">{status.toLowerCase()}</span>
                          <span className="font-semibold text-gray-800">{count} ({Math.round((count / totalOrders) * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${statusColors[status] || 'bg-gray-400'} rounded-full`}
                            style={{ width: `${(count / totalOrders) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Medicines by Quantity */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Top Medicines by Units Ordered</h2>
                {topMedicines.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">No order data yet</div>
                ) : (
                  <div className="space-y-3">
                    {topMedicines.map(med => (
                      <div key={med.name} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-36 truncate">{med.name}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(med.count / topMedicines[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">{med.count} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Alert */}
            {lowStock > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <h2 className="font-semibold text-yellow-800 mb-3">⚠️ Low Stock Alerts ({lowStock} items)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {medicines.filter(m => m.stock < 20).map(m => (
                    <div key={m.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-xs text-red-600 font-bold">{m.stock} units left</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}