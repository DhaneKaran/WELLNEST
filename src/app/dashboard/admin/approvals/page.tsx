'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminApprovalsPage() {
  const { data: session, status } = useSession()
  const [pending, setPending] = useState<any>({ doctors: [], pharmacists: [] })

  if (status === 'unauthenticated') redirect('/login')
  if (session?.user && !(session.user as any).roles?.includes('ADMIN')) redirect('/dashboard/patient')

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/admin/approvals').then(r => r.json()).then(setPending)
    }
  }, [status])

  const act = async (type: string, profileId: number,  action: string) => {
    await fetch('/api/admin/approvals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, profileId,  action }) })
    const refreshed = await fetch('/api/admin/approvals').then(r => r.json())
    setPending(refreshed)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Approvals</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">Doctor Profiles</h2>
        <ul className="space-y-2">
          {pending.doctors.map((d: any) => (
            <li key={d.id} className="p-4 bg-white rounded shadow flex items-center justify-between">
              <div>
                <div className="font-medium">{d.user?.name}</div>
                <div className="text-sm text-gray-500">License: {d.licenseNumber}</div>
              </div>
              <div className="space-x-2">
                <button onClick={() => act('DOCTOR', d.id, 'APPROVE')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
                <button onClick={() => act('DOCTOR', d.id, 'reject')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reject</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Pharmacist Profiles</h2>
        <ul className="space-y-2">
          {pending.pharmacists.map((p: any) => (
            <li key={p.id} className="p-4 bg-white rounded shadow flex items-center justify-between">
              <div>
                <div className="font-medium">{p.user?.name}</div>
                <div className="text-sm text-gray-500">License: {p.licenseNumber}</div>
              </div>
              <div className="space-x-2">
                <button onClick={() => act('PHARMACIST', p.id, 'approve')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
                <button onClick={() => act('PHARMACIST', p.id, 'reject')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reject</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}





