'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  FaSearch, 
  FaClipboardList, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye, 
  FaFilePrescription,
  FaFilter,
  FaSort
} from 'react-icons/fa'

interface Prescription {
  id: string
  patientName: string
  patientId: string
  doctorName: string
  date: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  medications: {
    name: string
    dosage: string
    quantity: number
    instructions: string
  }[]
}

export default function PharmacistPrescriptions() {
  const { data: session, status } = useSession()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  
  // Redirect if not logged in
  if (status === 'unauthenticated') {
    redirect('/login')
  }

  // Redirect if not a pharmacist
  if (session?.user && (session.user as any).role !== 'PHARMACIST') {
    redirect('/dashboard/patient')
  }

  // Simulated data for prescriptions
  // Replace the mock useEffect with:
useEffect(() => {
  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/prescriptions')
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(data.map((p: any) => ({
          id: String(p.id),
          patientName: p.patient?.name || 'Unknown',
          patientId: String(p.patientId),
          doctorName: p.doctor?.name || 'Unknown',
          date: p.createdAt,
          status: p.status as any,
          medications: (p.medications as any[]).map(m => ({
            name: m.name,
            dosage: m.dosage,
            quantity: 1,
            instructions: `${m.frequency} for ${m.duration}`
          }))
        })))
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err)
    } finally {
      setIsLoading(false)
    }
  }
  fetchPrescriptions()
}, [])

  const filteredPrescriptions = prescriptions.filter(prescription => {
    // Apply search filter
    const matchesSearch = 
      prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Apply status filter
    const matchesStatus = statusFilter === 'ALL' || prescription.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pending</span>
      case 'PROCESSING':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Processing</span>
      case 'READY':
        return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Ready for Pickup</span>
      case 'DELIVERED':
        return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Delivered</span>
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Cancelled</span>
      default:
        return null
    }
  }

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescription Management</h1>
            <p className="text-gray-600 mt-1">Process and manage patient prescriptions</p>
          </div>
          <div className="flex space-x-3">
            <Link 
              href="/dashboard/pharmacist/inventory" 
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
            >
              <FaClipboardList className="mr-2" /> Check Inventory
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by patient name, ID, doctor or prescription ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <FaFilter className="mr-2 text-gray-500" />
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="READY">Ready for Pickup</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaSort className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Prescription List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No prescriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prescription ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medications
                    </th>
                    {/* <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/dashboard/pharmacist/prescriptions/${prescription.id}`}>
                          {prescription.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{prescription.patientName}</div>
                        <div className="text-sm text-gray-500">{prescription.patientId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prescription.doctorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prescription.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(prescription.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {prescription.medications.map((med, idx) => (
                            <div key={idx} className="mb-1 last:mb-0">
                              {med.name} × {med.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/dashboard/pharmacist/prescriptions/${prescription.id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FaEye className="mr-1" /> View
                          </Link>
                          
                          {prescription.status === 'PENDING' && (
                            <button className="text-green-600 hover:text-green-900 flex items-center">
                              <FaCheckCircle className="mr-1" /> Process
                            </button>
                          )}
                          
                          {prescription.status === 'PROCESSING' && (
                            <button className="text-green-600 hover:text-green-900 flex items-center">
                              <FaCheckCircle className="mr-1" /> Mark Ready
                            </button>
                          )}
                          
                          {prescription.status === 'READY' && (
                            <button className="text-green-600 hover:text-green-900 flex items-center">
                              <FaCheckCircle className="mr-1" /> Mark Delivered
                            </button>
                          )}
                          
                          {(prescription.status === 'PENDING' || prescription.status === 'PROCESSING') && (
                            <button className="text-red-600 hover:text-red-900 flex items-center">
                              <FaTimesCircle className="mr-1" /> Cancel
                            </button>
                          )}
                        </div>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}