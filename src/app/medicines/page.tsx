'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { FaSearch, FaCapsules, FaShoppingCart, FaTrash, FaCreditCard, FaMoneyBillWave, FaUpload, FaFileMedical } from 'react-icons/fa'

interface Medicine {
  id: number
  name: string
  use: string
  dosageForm: string
  price: number
  stock: number
  category: string
  prescription: boolean
}

interface CartItem {
  medicine: Medicine
  quantity: number
  prescriptionFile?: File
}

export default function MedicinesPage() {
  const { user } = useAuth()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'UPI'>('CASH_ON_DELIVERY')
  const [isLoading, setIsLoading] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null)

  // Fetch medicines from API
  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      console.log('Fetching medicines...')
      const response = await fetch('/api/medicines')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Medicines data:', data)
        setMedicines(data)
      } else {
        console.error('Response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching medicines:', error)
    }
  }

  const addToCart = (medicine: Medicine) => {
    if (medicine.prescription) {
      setSelectedMedicine(medicine)
      setShowPrescriptionModal(true)
    } else {
      addMedicineToCart(medicine)
    }
  }

  const addMedicineToCart = (medicine: Medicine, prescriptionFile?: File) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.medicine.id === medicine.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + 1, prescriptionFile: prescriptionFile || item.prescriptionFile }
            : item
        )
      } else {
        return [...prevCart, { medicine, quantity: 1, prescriptionFile }]
      }
    })
  }

  const handlePrescriptionUpload = () => {
    if (selectedMedicine && prescriptionFile) {
      addMedicineToCart(selectedMedicine, prescriptionFile)
      setShowPrescriptionModal(false)
      setSelectedMedicine(null)
      setPrescriptionFile(null)
    }
  }

  const removeFromCart = (medicineId: number) => {
    setCart(prevCart => prevCart.filter(item => item.medicine.id !== medicineId))
  }

  const updateQuantity = (medicineId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.medicine.id === medicineId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.medicine.price * item.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please login to place an order')
      return
    }

    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }

    // Check if all prescription medicines have prescription files
    const prescriptionMedicines = cart.filter(item => item.medicine.prescription)
    const missingPrescriptions = prescriptionMedicines.filter(item => !item.prescriptionFile)
    
    if (missingPrescriptions.length > 0) {
      alert('Please upload prescriptions for all prescription-required medicines')
      return
    }

    setIsLoading(true)

    try {
      const orderPromises = cart.map(item =>
        fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicineId: item.medicine.id,
            quantity: item.quantity,
            totalAmount: item.medicine.price * item.quantity,
            paymentMethod,
            patientId: user.id,
            hasPrescription: item.medicine.prescription
          }),
        })
      )

      const responses = await Promise.all(orderPromises)
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        alert('Order placed successfully!')
        setCart([])
        setShowCart(false)
        setShowOrderForm(false)
      } else {
        alert('Some items could not be ordered. Please try again.')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Error placing order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(search.toLowerCase()) ||
    medicine.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pharmacy & Medicines</h1>
          <p className="text-xl text-gray-600">Browse and order essential medicines</p>
        </div>

        {/* Search and Cart */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines by name or category..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaShoppingCart />
            Cart ({cart.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Medicines List */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMedicines.map((medicine) => (
                <div key={medicine.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FaCapsules className="text-blue-600 text-xl" />
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{medicine.name}</h3>
                        <p className="text-sm text-gray-600">{medicine.category}</p>
                      </div>
                    </div>
                    {medicine.prescription && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <FaFileMedical />
                        Prescription Required
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Use:</span> {medicine.use}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Form:</span> {medicine.dosageForm}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Stock:</span> {medicine.stock} available
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{medicine.price}
                    </div>
                    <button
                      onClick={() => addToCart(medicine)}
                      disabled={medicine.stock === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {medicine.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          {showCart && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shopping Cart</h2>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.medicine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{item.medicine.name}</h4>
                            <p className="text-xs text-gray-600">₹{item.medicine.price} each</p>
                            {item.medicine.prescription && (
                              <div className="flex items-center gap-1 mt-1">
                                <FaFileMedical className="text-red-500 text-xs" />
                                <span className="text-xs text-red-600">
                                  {item.prescriptionFile ? 'Prescription uploaded' : 'Prescription required'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max={item.medicine.stock}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.medicine.id, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border rounded text-center text-sm"
                            />
                            <button
                              onClick={() => removeFromCart(item.medicine.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 mb-6">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>₹{getTotalPrice()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Proceed to Order
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Prescription Upload Modal */}
        {showPrescriptionModal && selectedMedicine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prescription Required</h2>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  <strong>{selectedMedicine.name}</strong> requires a valid prescription from a doctor.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Prescription
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FaUpload className="text-gray-400 text-3xl mx-auto mb-2" />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="prescription-upload"
                      />
                      <label htmlFor="prescription-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Choose file
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, JPG, JPEG, PNG up to 10MB
                      </p>
                    </div>
                    {prescriptionFile && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                        ✓ {prescriptionFile.name} selected
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false)
                    setSelectedMedicine(null)
                    setPrescriptionFile(null)
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrescriptionUpload}
                  disabled={!prescriptionFile}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Order</h2>
              
              <div className="space-y-4 mb-6">
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

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Order Summary</h3>
                  {cart.map((item) => (
                    <div key={item.medicine.id} className="flex justify-between text-sm">
                      <span>{item.medicine.name} x {item.quantity}</span>
                      <span>₹{item.medicine.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{getTotalPrice()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredMedicines.length === 0 && (
          <div className="text-center py-12">
            <FaCapsules className="text-gray-400 text-6xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No medicines found</p>
            <p className="text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  )
} 