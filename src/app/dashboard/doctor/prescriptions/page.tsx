'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaSearch, FaPlus, FaTrash } from 'react-icons/fa'

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface Prescription {
  id: number
  diagnosis: string
  medications: Medication[]
  instructions: string
  status: string
  createdAt: string
  patient: { id: number; name: string; email: string }
  appointment: { id: number; date: string; hospital: { name: string } }
}

export default function DoctorPrescriptions() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [appointmentId, setAppointmentId] = useState(searchParams.get('appointmentId') || '')
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '')
  const [patientName, setPatientName] = useState(searchParams.get('patientName') || '')
  const [diagnosis, setDiagnosis] = useState('')
  const [instructions, setInstructions] = useState('')
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ])
  const [submitting, setSubmitting] = useState(false)

  // If coming from appointments page with pre-filled data, auto-open form
  useEffect(() => {
    if (searchParams.get('appointmentId')) setShowForm(true)
  }, [])

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DOCTOR')) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === 'DOCTOR') fetchPrescriptions()
  }, [user])

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(`/api/prescriptions?doctorUserId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(data)
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }])
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setMedications(medications.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const handleSubmit = async () => {
    if (!appointmentId || !patientId || !diagnosis || medications.some(m => !m.name)) {
      alert('Please fill all required fields.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: parseInt(appointmentId),
          patientId: parseInt(patientId),
          doctorUserId: user?.id,
          diagnosis,
          medications,
          instructions
        })
      })
      if (res.ok) {
        alert('Prescription created successfully!')
        setShowForm(false)
        setDiagnosis('')
        setInstructions('')
        setMedications([{ name: '', dosage: '', frequency: '', duration: '' }])
        setAppointmentId('')
        setPatientId('')
        setPatientName('')
        fetchPrescriptions()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create prescription.')
      }
    } catch (err) {
      alert('Error creating prescription.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = prescriptions.filter(p =>
    p.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading || !user) {
    return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-gray-600 mt-1">Manage patient prescriptions</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> New Prescription
          </button>
        </div>

        {/* New Prescription Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create New Prescription</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID *</label>
                <input
                  type="number"
                  value={appointmentId}
                  onChange={e => setAppointmentId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                <input
                  type="number"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. 3"
                />
                {patientName && <p className="text-xs text-gray-500 mt-1">Patient: {patientName}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. Hypertension, Type 2 Diabetes"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Medications *</label>
                <button onClick={addMedication} className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800">
                  <FaPlus className="text-xs" /> Add Medicine
                </button>
              </div>
              {medications.map((med, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <input
                    placeholder="Medicine name *"
                    value={med.name}
                    onChange={e => updateMedication(i, 'name', e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Dosage (e.g. 500mg)"
                    value={med.dosage}
                    onChange={e => updateMedication(i, 'dosage', e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Frequency (e.g. Twice daily)"
                    value={med.frequency}
                    onChange={e => updateMedication(i, 'frequency', e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-1">
                    <input
                      placeholder="Duration (e.g. 7 days)"
                      value={med.duration}
                      onChange={e => updateMedication(i, 'duration', e.target.value)}
                      className="border rounded px-2 py-1.5 text-sm flex-1"
                    />
                    {medications.length > 1 && (
                      <button onClick={() => removeMedication(i)} className="text-red-500 hover:text-red-700 px-1">
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="e.g. Take with meals. Avoid alcohol."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {submitting ? 'Saving...' : 'Save Prescription'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name or diagnosis..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading prescriptions...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">No prescriptions found.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(rx => (
              <div key={rx.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{rx.patient?.name}</h3>
                    <p className="text-sm text-gray-500">{rx.patient?.email}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(rx.createdAt).toLocaleDateString('en-IN')} · {rx.appointment?.hospital?.name}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    rx.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rx.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">Diagnosis: {rx.diagnosis}</p>
                <div className="space-y-1">
                  {(rx.medications as Medication[]).map((med, i) => (
                    <div key={i} className="text-sm text-gray-600 bg-blue-50 rounded px-3 py-1">
                      {med.name} — {med.dosage}, {med.frequency}, {med.duration}
                    </div>
                  ))}
                </div>
                {rx.instructions && (
                  <p className="text-sm text-gray-500 mt-2 italic">Instructions: {rx.instructions}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}