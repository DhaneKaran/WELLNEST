'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<any>(null)

  if (status === 'unauthenticated') redirect('/login')
  if (session?.user && !(session.user as any).roles?.includes('ADMIN')) redirect('/dashboard/patient')

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/admin/reports').then(r => r.json()).then(setData)
    }
  }, [status])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>
      {!data ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Appointments</div>
            <div className="text-2xl font-bold">{data.appointmentsCount}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Orders</div>
            <div className="text-2xl font-bold">{data.ordersCount}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold">₹{data.totalRevenue}</div>
          </div>
        </div>
      )}
    </div>
  )
}





