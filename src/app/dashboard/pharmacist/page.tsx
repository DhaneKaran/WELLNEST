'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaClipboardList, FaPills, FaChartLine, FaShoppingCart } from 'react-icons/fa'

export default function PharmacistDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ pendingOrders: 0, lowStock: 0, ordersToProcess: 0, totalRevenue: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'PHARMACIST')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, medicinesRes] = await Promise.all([
          fetch('/api/orders?all=true'),
          fetch('/api/medicines')
        ])
        const orders = ordersRes.ok ? await ordersRes.json() : []
        const medicines = medicinesRes.ok ? await medicinesRes.json() : []

        const pendingOrders = orders.filter((o: any) => o.status === 'PLACED').length
        const ordersToProcess = orders.filter((o: any) => o.status === 'PLACED' || o.status === 'PROCESSING').length
        const lowStock = medicines.filter((m: any) => m.stock < 20).length
        const totalRevenue = orders
          .filter((o: any) => o.paymentStatus === 'PAID')
          .reduce((sum: number, o: any) => sum + o.totalAmount, 0)

        setStats({ pendingOrders, lowStock, ordersToProcess, totalRevenue })
      } catch (err) {
        console.error('Error fetching pharmacist stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    if (user && user.role === 'PHARMACIST') fetchStats()
  }, [user])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pharmacist Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4"><FaClipboardList className="text-blue-500" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Pending Orders</h3>
            <p className="text-2xl font-bold">{isLoading ? '...' : stats.pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4"><FaPills className="text-red-500" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Low Stock Items</h3>
            <p className="text-2xl font-bold">{isLoading ? '...' : stats.lowStock}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4"><FaShoppingCart className="text-green-500" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Orders to Process</h3>
            <p className="text-2xl font-bold">{isLoading ? '...' : stats.ordersToProcess}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4"><FaChartLine className="text-purple-500" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Total Revenue (Paid)</h3>
            <p className="text-2xl font-bold">₹{isLoading ? '...' : stats.totalRevenue.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/pharmacist/orders" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center text-center">
          <div className="rounded-full bg-blue-100 p-4 mb-3"><FaShoppingCart className="text-blue-500 text-xl" /></div>
          <h2 className="text-lg font-semibold">Manage Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Process and fulfil medicine orders</p>
        </Link>
        <Link href="/dashboard/pharmacist/inventory" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center text-center">
          <div className="rounded-full bg-green-100 p-4 mb-3"><FaPills className="text-green-500 text-xl" /></div>
          <h2 className="text-lg font-semibold">Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage medicine stock and availability</p>
        </Link>
        <Link href="/dashboard/pharmacist/prescriptions" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center text-center">
          <div className="rounded-full bg-purple-100 p-4 mb-3"><FaClipboardList className="text-purple-500 text-xl" /></div>
          <h2 className="text-lg font-semibold">Prescriptions</h2>
          <p className="text-sm text-gray-500 mt-1">View doctor-issued prescriptions</p>
        </Link>
      </div>
    </div>
  )
}