'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import {
  FaCalendarAlt, FaUserMd, FaClock, FaHospital, FaHistory,
  FaPlus, FaCreditCard, FaMoneyBillWave, FaSearch
} from 'react-icons/fa'

interface Doctor {
  id: number
  name: string
  specialization: string
  description: string
  experience: number
  qualifications: string
  hospitalId: number
  availability: any
}

interface Hospital {
  id: number
  name: string
  address: string
  contact?: string
  phone?: string
  services?: string[]
}

interface Appointment {
  id: number
  patientId: number
  hospitalId: number
  doctorId: number
  date: string
  time: string
  status: string
  medicalHistory?: string
  symptoms?: string
  paymentStatus: string
  amount: number
  createdAt: string
  hospital: Hospital
  doctor: Doctor
}

export default function AppointmentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book')

  // Hospital
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [hospitalsLoading, setHospitalsLoading] = useState(true)
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)

  // Doctor
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])

  // Booking
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [symptoms, setSymptoms] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'UPI'>('CASH_ON_DELIVERY')

  // History
  const [appointments, setAppointments] = useState<Appointment[]>([])

  // Fetch hospitals
  useEffect(() => {
    const load = async () => {
      try {
        setHospitalsLoading(true)
        const res = await fetch('/api/hospitals')
        if (res.ok) setHospitals(await res.json())
      } catch (e) { console.error(e) }
      finally { setHospitalsLoading(false) }
    }
    load()
  }, [])

  // Pre-select hospital stored from hospitals page
  useEffect(() => {
    if (!hospitalsLoading && hospitals.length > 0) {
      const stored = localStorage.getItem('selectedHospital')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const match = hospitals.find(h => h.id === parsed.id) || parsed
          setSelectedHospital(match)
          localStorage.removeItem('selectedHospital')
        } catch {}
      }
    }
  }, [hospitalsLoading, hospitals])

  // When hospital changes, fetch its doctors
  useEffect(() => {
    if (selectedHospital) {
      fetchDoctors(selectedHospital.id)
      setSelectedDoctor(null)
      setSelectedSpecialty('')
      setSelectedDate('')
      setSelectedTime('')
    } else {
      setDoctors([])
      setSpecialties([])
    }
  }, [selectedHospital])

  // Derive specialties
  useEffect(() => {
    if (doctors.length > 0) {
      setSpecialties(Array.from(new Set(doctors.map(d => d.specialization))))
    } else {
      setSpecialties([])
    }
  }, [doctors])

  // Fetch appointments
  useEffect(() => {
    if (user) fetchAppointments()
  }, [user])

  const fetchDoctors = async (hospitalId: number) => {
    try {
      setDoctorsLoading(true)
      const res = await fetch(`/api/doctors?hospitalId=${hospitalId}`)
      if (res.ok) setDoctors(await res.json())
    } catch (e) { console.error(e) }
    finally { setDoctorsLoading(false) }
  }

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?patientId=${user?.id}`)
      if (res.ok) setAppointments(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setSelectedDate('')
    setSelectedTime('')
    setAvailableTimes([])
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    if (selectedDoctor?.availability) {
      const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      setAvailableTimes(selectedDoctor.availability[day] || [])
    }
  }

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      alert('Please select a doctor, date, and time')
      return
    }
    setShowPaymentModal(true)
  }

  const handleConfirmBooking = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user?.id,
          hospitalId: selectedHospital?.id,
          doctorId: selectedDoctor?.id,
          date: selectedDate,
          time: selectedTime,
          symptoms,
          paymentMethod,
          amount: 20.0,
        }),
      })
      if (res.ok) {
        alert('Appointment booked successfully!')
        setShowPaymentModal(false)
        setSelectedDoctor(null)
        setSelectedDate('')
        setSelectedTime('')
        setSymptoms('')
        setAdditionalInfo('')
        fetchAppointments()
        setActiveTab('history')
      } else {
        alert('Failed to book appointment. Please try again.')
      }
    } catch (e) {
      console.error(e)
      alert('Error booking appointment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  const getUpcomingDates = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.address.toLowerCase().includes(hospitalSearch.toLowerCase())
  )

  const filteredDoctors = doctors.filter(
    d => selectedSpecialty === '' || d.specialization === selectedSpecialty
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-2xl">Loading...</div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Authentication Required</h2>
        <p className="mb-6">You must be signed in to book appointments</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => router.push('/login')} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">Sign In</button>
          <button onClick={() => router.push('/register')} className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition">Create Account</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Appointments</h1>
          <p className="text-xl text-gray-600">Book appointments and view your medical history</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <button onClick={() => setActiveTab('book')} className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'book' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              <FaPlus /> Book Appointment
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              <FaHistory /> Appointment History
            </button>
          </div>
        </div>

        {activeTab === 'book' ? (
          <div className="space-y-6">

            {/* STEP 1 – Hospital */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">1</span>
                Select Hospital
              </h2>

              {selectedHospital ? (
                <div className="flex items-start justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div>
                    <p className="font-semibold text-blue-900 text-lg">{selectedHospital.name}</p>
                    <p className="text-gray-600 text-sm mt-0.5">{selectedHospital.address}</p>
                    {(selectedHospital.contact || selectedHospital.phone) && (
                      <p className="text-gray-500 text-sm">📞 {selectedHospital.contact || selectedHospital.phone}</p>
                    )}
                    {selectedHospital.services && selectedHospital.services.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">{selectedHospital.services.slice(0, 3).join(' · ')}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedHospital(null); setDoctors([]); setSelectedDoctor(null) }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline ml-4 whitespace-nowrap"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search hospitals by name or area..."
                      value={hospitalSearch}
                      onChange={e => setHospitalSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {hospitalsLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading hospitals...</div>
                  ) : filteredHospitals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No hospitals found</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                      {filteredHospitals.map(h => (
                        <button
                          key={h.id}
                          onClick={() => { setSelectedHospital(h); setHospitalSearch('') }}
                          className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <p className="font-semibold text-gray-900">{h.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{h.address}</p>
                          {h.services && h.services.length > 0 && (
                            <p className="text-xs text-blue-500 mt-1">{h.services.slice(0, 2).join(', ')}{h.services.length > 2 ? '…' : ''}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* STEP 2 – Doctor */}
            {selectedHospital && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">2</span>
                  Select Doctor
                </h2>

                {doctorsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    Loading doctors...
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="text-center py-10 bg-yellow-50 rounded-lg border border-yellow-200">
                    <FaUserMd className="text-yellow-400 text-4xl mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">No doctors currently listed for this hospital.</p>
                    <p className="text-gray-500 text-sm mt-1">Doctors can link themselves to this hospital during registration or via their profile.</p>
                  </div>
                ) : (
                  <>
                    {specialties.length > 1 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => setSelectedSpecialty('')}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedSpecialty === '' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}
                        >
                          All
                        </button>
                        {specialties.map(s => (
                          <button key={s} onClick={() => setSelectedSpecialty(s)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedSpecialty === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDoctors.map(doctor => (
                        <div
                          key={doctor.id}
                          onClick={() => handleDoctorSelect(doctor)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedDoctor?.id === doctor.id ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                              <FaUserMd className="text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{doctor.name}</h4>
                              <p className="text-sm text-blue-600 font-medium">{doctor.specialization}</p>
                            </div>
                          </div>
                          {doctor.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{doctor.description}</p>
                          )}
                          <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 mt-2">
                            <span>{doctor.qualifications}</span>
                            <span className="font-medium">{doctor.experience} yrs exp.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 3 – Date & Time */}
            {selectedDoctor && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">3</span>
                  Choose Date &amp; Time
                </h2>

                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Pick a date (next 7 days)</p>
                  <div className="grid grid-cols-7 gap-2">
                    {getUpcomingDates().map(date => (
                      <button key={date} onClick={() => handleDateSelect(date)}
                        className={`p-2 border-2 rounded-lg text-sm transition-colors text-center ${selectedDate === date ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="font-semibold">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric' })}</div>
                        <div className="text-xs text-gray-500">{new Date(date).toLocaleDateString('en-IN', { month: 'short' })}</div>
                        <div className="text-xs text-gray-400">{new Date(date).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  availableTimes.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Pick a time slot</p>
                      <div className="grid grid-cols-4 gap-3">
                        {availableTimes.map(time => (
                          <button key={time} onClick={() => setSelectedTime(time)}
                            className={`p-3 border-2 rounded-lg transition-colors ${selectedTime === time ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-yellow-700">No slots available on this date. Please choose another date.</p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* STEP 4 – Symptoms + Book */}
            {selectedDoctor && selectedDate && selectedTime && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">4</span>
                  Additional Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms / Reason for Visit</label>
                    <textarea
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      placeholder="Describe your symptoms or reason for this appointment..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Info (Optional)</label>
                    <textarea
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      placeholder="Previous treatments, allergies, or special requirements..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                </div>

                <button
                  onClick={handleBookAppointment}
                  className="w-full mt-6 bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                >
                  Proceed to Payment — ₹20
                </button>
              </div>
            )}

          </div>
        ) : (
          /* History */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
            </div>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <FaCalendarAlt className="text-gray-400 text-6xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No appointments found</p>
                <p className="text-gray-400">Your appointment history will appear here</p>
              </div>
            ) : (
              <div className="divide-y">
                {appointments.map(appt => (
                  <div key={appt.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <FaUserMd className="text-blue-600" />
                          <h3 className="font-semibold text-lg">{appt.doctor?.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appt.status)}`}>{appt.status}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><FaHospital className="text-gray-400" />{appt.hospital?.name}</span>
                          <span>{appt.doctor?.specialization}</span>
                          <span className="flex items-center gap-1"><FaCalendarAlt className="text-gray-400" />{formatDate(appt.date)} at {appt.time}</span>
                        </div>
                        {appt.symptoms && <p className="text-sm text-gray-600 mt-2"><strong>Symptoms:</strong> {appt.symptoms}</p>}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-green-600 mb-1">₹{appt.amount}</div>
                        <div className="text-xs text-gray-500">{appt.paymentStatus}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Appointment</h2>
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                  <div><strong>Hospital:</strong> {selectedHospital?.name}</div>
                  <div><strong>Doctor:</strong> {selectedDoctor?.name}</div>
                  <div><strong>Specialization:</strong> {selectedDoctor?.specialization}</div>
                  <div><strong>Date:</strong> {formatDate(selectedDate)}</div>
                  <div><strong>Time:</strong> {selectedTime}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="pm" value="CASH_ON_DELIVERY" checked={paymentMethod === 'CASH_ON_DELIVERY'} onChange={() => setPaymentMethod('CASH_ON_DELIVERY')} />
                      <FaMoneyBillWave className="text-green-600" /> Cash on Delivery
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="pm" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                      <FaCreditCard className="text-blue-600" /> UPI Payment
                    </label>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg flex justify-between font-bold">
                  <span>Appointment Fee:</span><span>₹20.00</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={handleConfirmBooking} disabled={isLoading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  {isLoading ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}