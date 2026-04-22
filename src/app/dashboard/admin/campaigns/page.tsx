'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminCampaignsPage() {
  const { data: session, status } = useSession()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [name, setName] = useState('')

  if (status === 'unauthenticated') redirect('/login')
  if (session?.user && !(session.user as any).roles?.includes('ADMIN')) redirect('/dashboard/patient')

  const reload = async () => {
    const list = await fetch('/api/admin/memberships').then(r => r.json())
    // The memberships route is not listing campaigns; keep simple UI placeholder
    setCampaigns([])
  }

  useEffect(() => {
    if (status === 'authenticated') {
      reload()
    }
  }, [status])

  const create = async () => {
    if (!name) return
    await fetch('/api/admin/memberships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, isActive: true }) })
    setName('')
    await reload()
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <div className="flex space-x-2">
        <input className="border rounded px-2 py-1" placeholder="Campaign name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={create} className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
      </div>
      <ul className="space-y-2">
        {campaigns.map((c: any) => (
          <li key={c.id} className="p-3 bg-white rounded shadow">{c.name}</li>
        ))}
      </ul>
    </div>
  )
}





