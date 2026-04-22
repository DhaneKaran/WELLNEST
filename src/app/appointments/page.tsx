'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { FaCalendarAlt, FaUserMd, FaClock, FaHospital, FaHistory, FaPlus, FaCreditCard, FaMoneyBillWave, FaFileMedical } from 'react-icons/fa'

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
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [medicalHistory, setMedicalHistory] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [age, setAge] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [address, setAddress] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'UPI'>('CASH_ON_DELIVERY')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('')
  const [specialties, setSpecialties] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      // Get selected hospital from localStorage
      const storedHospital = localStorage.getItem('selectedHospital')
      if (storedHospital) {
        try {
          const hospital = JSON.parse(storedHospital)
          console.log('Loaded hospital:', hospital) // Debug log
          setSelectedHospital(hospital)
          fetchDoctors(hospital.id)
          localStorage.removeItem('selectedHospital') // Clear after use
        } catch (error) {
          console.error('Error parsing hospital data:', error)
        }
      }
      fetchAppointments()
    }
  }, [user])
  
  // Extract unique specialties from doctors
  useEffect(() => {
    if (doctors.length > 0) {
      const uniqueSpecialties = Array.from(new Set(doctors.map(doctor => doctor.specialization)))
      setSpecialties(uniqueSpecialties)
    }
  }, [doctors])

  const fetchDoctors = async (hospitalName: string) => {
    try {
      console.log('Fetching doctors for hospital:', hospitalName) // Debug log
      const response = await fetch(`/api/doctors?hospital=${encodeURIComponent(hospitalName)}`)
      console.log('Doctors API response status:', response.status) // Debug log
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched doctors:', data) // Debug log
        setDoctors(data)
      } else {
        console.error('Failed to fetch doctors:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments?patientId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
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
    
    if (selectedDoctor) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const times = selectedDoctor.availability[dayOfWeek] || []
      setAvailableTimes(times)
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
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user?.id,
          hospitalId: selectedHospital?.id,
          doctorId: selectedDoctor?.id,
          date: selectedDate,
          time: selectedTime,
          medicalHistory,
          symptoms,
          age,
          contactNo,
          address,
          expectedDate,
          paymentMethod,
          amount: 20.0
        }),
      })

      if (response.ok) {
        alert('Appointment booked successfully!')
        setShowPaymentModal(false)
        setSelectedDoctor(null)
        setSelectedDate('')
        setSelectedTime('')
        setMedicalHistory('')
        setSymptoms('')
        setAge('')
        setContactNo('')
        setAddress('')
        setExpectedDate('')
        fetchAppointments()
        setActiveTab('history')
      } else {
        alert('Failed to book appointment. Please try again.')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Error booking appointment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUpcomingDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Authentication Required</h2>
          <p className="mb-6">You must be signed in to book appointments</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Appointments</h1>
          <p className="text-xl text-gray-600">Book appointments and view your medical history</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'book' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaPlus />
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaHistory />
              Appointment History
            </button>
          </div>
        </div>

        {activeTab === 'book' ? (
          /* Booking Section */
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Debug info */}
            <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>Active Tab: {activeTab}</p>
              <p>Selected Hospital: {selectedHospital ? selectedHospital.name : 'None'}</p>
              <p>Doctors Count: {doctors.length}</p>
              <p>Selected Specialty: {selectedSpecialty || 'All'}</p>
              <p>Selected Doctor: {selectedDoctor ? selectedDoctor.name : 'None'}</p>
            </div>
            
            {!selectedHospital ? (
              <div className="text-center py-12">
                <FaHospital className="text-gray-400 text-6xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Hospital</h2>
                <p className="text-gray-600 mb-6">
                  Please select a hospital from the hospitals page to book an appointment
                </p>
                <button
                  onClick={() => router.push('/hospitals')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Hospitals
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Hospital Info */}
                                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-blue-900 mb-2">{selectedHospital.name}</h2>
                    <p className="text-gray-600">{selectedHospital.address}</p>
                    <p className="text-gray-600">Contact: {selectedHospital.contact || selectedHospital.phone}</p>
                  </div>

                {/* Specialty Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Specialty</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    <button
                      onClick={() => setSelectedSpecialty('')}
                      className={`p-3 border-2 rounded-lg transition-colors ${
                        selectedSpecialty === ''
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      All Specialties
                    </button>
                    {specialties.map((specialty) => (
                      <button
                        key={specialty}
                        onClick={() => setSelectedSpecialty(specialty)}
                        className={`p-3 border-2 rounded-lg transition-colors ${
                          selectedSpecialty === specialty
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                
                  {/* Doctor Selection */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Doctor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doctors
                      .filter(doctor => selectedSpecialty === '' || doctor.specialization === selectedSpecialty)
                      .map((doctor) => (
                        <div
                          key={doctor.id}
                          onClick={() => handleDoctorSelect(doctor)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors hover:shadow-md ${
                            selectedDoctor?.id === doctor.id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <FaUserMd className="text-blue-600 text-xl" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{doctor.name}</h4>
                              <p className="text-sm text-blue-600 font-medium">{doctor.specialization}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{doctor.description}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{doctor.qualifications}</span>
                            <span>{doctor.experience} years exp.</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {selectedDoctor && (
                  <>
                    {/* Date Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
                      <div className="grid grid-cols-7 gap-2">
                        {getUpcomingDates().map((date) => (
                          <button
                            key={date}
                            onClick={() => handleDateSelect(date)}
                            className={`p-3 border-2 rounded-lg text-sm transition-colors ${
                              selectedDate === date
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="font-semibold">
                              {new Date(date).toLocaleDateString('en-IN', { day: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(date).toLocaleDateString('en-IN', { month: 'short' })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Selection */}
                    {selectedDate && availableTimes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time</h3>
                        <div className="grid grid-cols-4 gap-3">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 border-2 rounded-lg transition-colors ${
                                selectedTime === time
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Patient Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information (Optional)</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Symptoms or Concerns
                        </label>
                        <textarea
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="Describe your symptoms or concerns..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Date of Appointment *
                        </label>
                        <input
                          type="date"
                          value={expectedDate}
                          onChange={(e) => setExpectedDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Symptoms *
                        </label>
                        <textarea
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="Describe your current symptoms in detail..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          required
                        />
                      </div>



                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Information (Optional)
                        </label>
                        <textarea
                          placeholder="Any additional information about your condition, previous treatments, or special requirements..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={handleBookAppointment}
                      disabled={!selectedDate || !selectedTime || !selectedDoctor}
                      className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                      Book Appointment (₹20)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* History Section */
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
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FaUserMd className="text-blue-600" />
                          <h3 className="font-semibold text-lg">{appointment.doctor.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{appointment.hospital.name}</span>
                          <span>{appointment.doctor.specialization}</span>
                          <span>{formatDate(appointment.date)} at {appointment.time}</span>
                        </div>
                        {appointment.symptoms && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Symptoms:</strong> {appointment.symptoms}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 mb-1">
                          ₹{appointment.amount}
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.paymentStatus}
                        </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Appointment</h2>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Appointment Details</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Doctor:</strong> {selectedDoctor?.name}</div>
                    <div><strong>Specialization:</strong> {selectedDoctor?.specialization}</div>
                    <div><strong>Date:</strong> {formatDate(selectedDate)}</div>
                    <div><strong>Time:</strong> {selectedTime}</div>
                    <div><strong>Hospital:</strong> {selectedHospital?.name}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH_ON_DELIVERY"
                        checked={paymentMethod === 'CASH_ON_DELIVERY'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'CASH_ON_DELIVERY' | 'UPI')}
                        className="text-blue-600"
                      />
                      <FaMoneyBillWave className="text-green-600" />
                      <span>Cash on Delivery</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="UPI"
                        checked={paymentMethod === 'UPI'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'CASH_ON_DELIVERY' | 'UPI')}
                        className="text-blue-600"
                      />
                      <FaCreditCard className="text-blue-600" />
                      <span>UPI Payment</span>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between font-bold">
                    <span>Appointment Fee:</span>
                    <span>₹20.00</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
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