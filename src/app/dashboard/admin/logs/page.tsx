'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminLogsPage() {
  const { data: session, status } = useSession()
  const [logs, setLogs] = useState<any[]>([])

  if (status === 'unauthenticated') redirect('/login')
  if (session?.user && !(session.user as any).roles?.includes('ADMIN')) redirect('/dashboard/patient')

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/admin/logs').then(r => r.json()).then(setLogs)
    }
  }, [status])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((l: any) => (
              <tr key={l.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.actor?.name || l.actorId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.entityType}#{l.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}





