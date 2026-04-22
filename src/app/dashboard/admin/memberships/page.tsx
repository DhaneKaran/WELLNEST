'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminMembershipsPage() {
  const { data: session, status } = useSession()
  const [rows, setRows] = useState<any[]>([])

  if (status === 'unauthenticated') redirect('/login')
  if (session?.user && !(session.user as any).roles?.includes('ADMIN')) redirect('/dashboard/patient')

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/admin/memberships').then(r => r.json()).then(setRows)
    }
  }, [status])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Memberships</h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((m: any) => (
            <tr key={m.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.user?.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.tier}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}





