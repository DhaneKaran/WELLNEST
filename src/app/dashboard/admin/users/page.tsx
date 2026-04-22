'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  if (status === 'unauthenticated') {
    redirect('/login')
  }
  if (session?.user && !(session.user as any).roles?.includes('ADMIN')) {
    redirect('/dashboard/patient')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      (async () => {
        try {
          const res = await fetch('/api/admin/users')
          const data = await res.json()
          setUsers(Array.isArray(data) ? data : [])
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [status])

  const assignRole = async (userId: number, role: string) => {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role, op: 'assign' }) })
    const refreshed = await fetch('/api/admin/users').then(r => r.json())
    setUsers(refreshed)
  }

  const revokeRole = async (userId: number, role: string) => {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role, op: 'remove' }) })
    const refreshed = await fetch('/api/admin/users').then(r => r.json())
    setUsers(Array.isArray(refreshed) ? refreshed : users)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(users || []).map((u: any) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(u.roles || [u.role]).join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center flex-wrap gap-2">
                    {['PATIENT','DOCTOR','PHARMACIST','ADMIN'].map(r => (
                      <button key={`add-${r}`} onClick={() => assignRole(u.id, r)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Add {r}</button>
                    ))}
                    {(u.roles || []).filter((r: string) => r !== 'ADMIN' || (session?.user as any)?.email !== 'karandhane0808@gmail.com').map((r: string) => (
                      <button key={`rm-${r}`} onClick={() => revokeRole(u.id, r)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">Revoke {r}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}





