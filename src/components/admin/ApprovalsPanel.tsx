'use client'

/**
 * src/components/admin/ApprovalsPanel.tsx
 * ─────────────────────────────────────────
 * Admin dashboard panel for reviewing and approving doctor/pharmacist registrations.
 * Shows degree details, certificate numbers, and lets admin approve or reject with reason.
 *
 * Usage in src/app/dashboard/admin/approvals/page.tsx:
 *   import ApprovalsPanel from '@/components/admin/ApprovalsPanel'
 *   export default function ApprovalsPage() { return <ApprovalsPanel /> }
 */

import { useEffect, useState } from 'react'

interface ProfileUser {
  id: number
  name: string
  email: string
  createdAt: string
}

interface DoctorProfile {
  id: number
  userId: number
  specialization: string
  qualifications: string
  experience: number
  licenseNumber: string
  degreeDetails: string
  approvalStatus: string
  rejectionReason?: string
  user: ProfileUser
}

interface PharmacistProfile {
  id: number
  userId: number
  pharmacyName: string
  qualifications: string
  experience: number
  licenseNumber: string
  certificateNumber: string
  approvalStatus: string
  user: ProfileUser
}

interface Stats {
  totalUsers: number
  totalDoctors: number
  totalPharmacists: number
  pendingApprovals: number
}

export default function ApprovalsPanel() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [pharmacists, setPharmacists] = useState<PharmacistProfile[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ type: string; id: number; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [tab, setTab] = useState<'DOCTOR' | 'PHARMACIST'>('DOCTOR')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/approvals')
      const data = await res.json()
      setDoctors(data.doctors ?? [])
      setPharmacists(data.pharmacists ?? [])
      setStats(data.stats ?? null)
    } catch {
      showToast('Failed to load approvals', false)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const handleAction = async (type: string, profileId: number, action: 'APPROVE' | 'REJECT', reason?: string) => {
    const key = `${type}-${profileId}-${action}`
    setProcessing(key)
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, profileId, action, reason }),
      })
      if (!res.ok) throw new Error()
      showToast(`${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully. User has been notified.`, true)
      await fetchData()
    } catch {
      showToast('Action failed. Please try again.', false)
    }
    setProcessing(null)
    setRejectModal(null)
    setRejectReason('')
  }

  const ProfileCard = ({ profile, type }: { profile: DoctorProfile | PharmacistProfile; type: string }) => {
    const doc = type === 'DOCTOR' ? profile as DoctorProfile : null
    const pharm = type === 'PHARMACIST' ? profile as PharmacistProfile : null
    const approveKey = `${type}-${profile.id}-APPROVE`

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{profile.user.name}</h3>
            <p className="text-sm text-gray-500">{profile.user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Registered {new Date(profile.user.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {doc && (
            <>
              <div><span className="text-gray-500">Specialization</span><p className="font-medium">{doc.specialization}</p></div>
              <div><span className="text-gray-500">Experience</span><p className="font-medium">{doc.experience} years</p></div>
              <div><span className="text-gray-500">License No.</span><p className="font-medium font-mono">{doc.licenseNumber}</p></div>
              <div><span className="text-gray-500">Qualifications</span><p className="font-medium">{doc.qualifications}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Degree Details</span><p className="font-medium">{doc.degreeDetails}</p></div>
            </>
          )}
          {pharm && (
            <>
              <div><span className="text-gray-500">Pharmacy</span><p className="font-medium">{pharm.pharmacyName || '—'}</p></div>
              <div><span className="text-gray-500">Experience</span><p className="font-medium">{pharm.experience} years</p></div>
              <div><span className="text-gray-500">License No.</span><p className="font-medium font-mono">{pharm.licenseNumber}</p></div>
              <div><span className="text-gray-500">Certificate No.</span><p className="font-medium font-mono">{pharm.certificateNumber}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Qualifications</span><p className="font-medium">{pharm.qualifications}</p></div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleAction(type, profile.id, 'APPROVE')}
            disabled={processing === approveKey}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {processing === approveKey ? '...' : '✓ Approve'}
          </button>
          <button
            onClick={() => setRejectModal({ type, id: profile.id, name: profile.user.name })}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium py-2 rounded-lg border border-red-200 transition-colors"
          >
            ✕ Reject
          </button>
        </div>
      </div>
    )
  }

  const current = tab === 'DOCTOR' ? doctors : pharmacists
  const label = tab === 'DOCTOR' ? 'Doctors' : 'Pharmacists'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'blue' },
            { label: 'Active Doctors', value: stats.totalDoctors, color: 'green' },
            { label: 'Active Pharmacists', value: stats.totalPharmacists, color: 'purple' },
            { label: 'Pending Approvals', value: stats.pendingApprovals, color: 'yellow' },
          ].map(s => (
            <div key={s.label} className={`bg-${s.color}-50 dark:bg-${s.color}-900/20 border border-${s.color}-200 rounded-xl p-4`}>
              <p className={`text-2xl font-bold text-${s.color}-700 dark:text-${s.color}-400`}>{s.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pending Approvals</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['DOCTOR', 'PHARMACIST'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t === 'DOCTOR' ? 'Doctors' : 'Pharmacists'}
            {' '}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${tab === t ? 'bg-blue-500' : 'bg-gray-300 text-gray-600'}`}>
              {t === 'DOCTOR' ? doctors.length : pharmacists.length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : current.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-medium">No pending {label.toLowerCase()}</p>
          <p className="text-sm">All requests have been reviewed.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {current.map(p => <ProfileCard key={p.id} profile={p} type={tab} />)}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-1">Reject Registration</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason for rejecting <strong>{rejectModal.name}</strong>. This will be sent to them by email and notification.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. License number could not be verified. Please resubmit with updated documents."
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(rejectModal.type, rejectModal.id, 'REJECT', rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Reject & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
