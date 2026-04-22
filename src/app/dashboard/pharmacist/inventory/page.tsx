'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  FaSearch, 
  FaBoxes, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaExclamationTriangle,
  FaFilter,
  FaSort,
  FaDownload,
  FaUpload
} from 'react-icons/fa'

interface MedicineItem {
  id: string
  name: string
  category: string
  manufacturer: string
  currentStock: number
  minStock: number
  price: number
  expiryDate: string
  location: string
}

export default function PharmacistInventory() {
  const { data: session, status } = useSession()
  const [inventory, setInventory] = useState<MedicineItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [stockFilter, setStockFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  
  // Redirect if not logged in
  if (status === 'unauthenticated') {
    redirect('/login')
  }

  // Redirect if not a pharmacist
  if (session?.user && (session.user as any).role !== 'PHARMACIST') {
    redirect('/dashboard/patient')
  }

  // Simulated data for inventory
  useEffect(() => {
  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/medicines')
      if (res.ok) {
        const data = await res.json()
        setInventory(data.map((m: any) => ({
          id: String(m.id),
          name: m.name,
          category: m.category || 'General',
          manufacturer: m.manufacturer,
          currentStock: m.stock,
          minStock: 20,  // threshold for low-stock alert
          price: m.price,
          expiryDate: 'N/A',
          location: 'Shelf A'
        })))
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
    } finally {
      setIsLoading(false)
    }
  }
  fetchInventory()
}, [])

  const DeleteInventory = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault()
    const updatedInventory = inventory.filter(item => item.id !== id)
    setInventory(updatedInventory)
  }

  const sortInventory = () => {
    const sortedInventory = [...inventory].sort((a, b) => a.price - b.price)
    setInventory(sortedInventory)
  }

  // Get unique categories for filter dropdown
  const categories = ['ALL'].concat(Array.from(new Set(inventory.map(item => item.category))))

  const filteredInventory = inventory.filter(item => {
    // Apply search filter
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Apply category filter
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
    
    // Apply stock filter
    let matchesStock = true
    if (stockFilter === 'LOW') {
      matchesStock = item.currentStock < item.minStock
    } else if (stockFilter === 'NORMAL') {
      matchesStock = item.currentStock >= item.minStock
    }
    
    return matchesSearch && matchesCategory && matchesStock
  })

  const getStockStatus = (current: number, min: number) => {
    if (current < min) {
      return <span className="text-red-600 flex items-center"><FaExclamationTriangle className="mr-1" /> Low Stock</span>
    } else if (current < min * 1.2) {
      return <span className="text-yellow-600">Getting Low</span>
    } else {
      return <span className="text-green-600">In Stock</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage medicine stock and inventory</p>
          </div>
          <div className="flex space-x-3">
            {/* <Link 
              href="/dashboard/pharmacist/inventory/add" 
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
            >
              <FaPlus className="mr-2" /> Add New Item
            </Link> */}
            {/* <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
            >
              <FaUpload className="mr-2" /> Import
            </button>
            <button 
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center"
            >
              <FaDownload className="mr-2" /> Export
            </button> */}
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
                placeholder="Search by name, ID, or manufacturer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <FaFilter className="mr-2 text-gray-500" />
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="ALL">All Stock</option>
                  <option value="LOW">Low Stock</option>
                  <option value="NORMAL">Normal Stock</option>
                </select>
              </div>
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={()=>{
                  sortInventory();
                }}
              
              >
                <FaSort className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (₹)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className={item.currentStock < item.minStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/dashboard/pharmacist/inventory/${item.id}`}>
                          {item.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.manufacturer}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{item.currentStock} / {item.minStock}</div>
                        <div className="text-xs">{getStockStatus(item.currentStock, item.minStock)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.expiryDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          {/* <Link 
                            href={`/dashboard/pharmacist/inventory/${item.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FaEdit className="mr-1" /> Edit
                          </Link> */}
                          <button className="text-red-600 hover:text-red-900 flex items-center" onClick={(e)=>{
                            DeleteInventory(e, item.id);
                          }}>
                            <FaTrash className="mr-1" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">{inventory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Low Stock Items:</span>
                <span className="font-medium text-red-600">{inventory.filter(item => item.currentStock < item.minStock).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiring in 30 Days:</span>
                <span className="font-medium text-yellow-600">
                  {inventory.filter(item => {
                    const expiryDate = new Date(item.expiryDate)
                    const today = new Date()
                    const diffTime = expiryDate.getTime() - today.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return diffDays <= 30 && diffDays > 0
                  }).length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Category Distribution</h3>
            <div className="space-y-3">
              {Object.entries(
                inventory.reduce((acc, item) => {
                  acc[item.category] = (acc[item.category] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([category, count], index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600">{category}:</span>
                    <span className="font-medium">{count} items</span>
                  </div>
                ))
              }
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 flex items-center">
                <FaBoxes className="mr-2" /> Order Low Stock Items
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 flex items-center">
                <FaDownload className="mr-2" /> Generate Inventory Report
              </button>
              <button className="w-full text-left px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 flex items-center">
                <FaExclamationTriangle className="mr-2" /> Check Expiring Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}