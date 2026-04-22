'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import dynamicImport from 'next/dynamic'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Dynamically import the entire map component with no SSR to improve performance
const HospitalMap = dynamicImport(() => import('../../components/HospitalMap'), { ssr: false, loading: () => (
  <div className="h-[500px] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading map...</p>
    </div>
  </div>
)})

export default function HospitalsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHospital, setSelectedHospital] = useState<any>(null)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([16.9902, 73.3120])
  const [hospitalData, setHospitalData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch hospitals from API
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/hospitals')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch hospitals: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Convert array to object with id as key for compatibility with existing code
        const hospitalObject: Record<string, any> = {}
        data.forEach((hospital: any) => {
          hospitalObject[hospital.id] = {
            ...hospital,
            position: hospital.position as [number, number]
          }
        })
        
        setHospitalData(hospitalObject)
        
        // Set default map center to first hospital if available
        if (data.length > 0 && data[0].position) {
          setMapCenter(data[0].position)
        }
      } catch (err) {
        console.error('Error fetching hospitals:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hospitals')
      } finally {
        setLoading(false)
      }
    }
    
    fetchHospitals()
  }, [])

  const handleHospitalClick = (hospitalId: string) => {
    const hospital = hospitalData[hospitalId]
    if (hospital) {
      setSelectedHospital(hospital)
      setShowInfoPanel(true)
      setMapCenter(hospital.position)
    }
  }

  const closeInfoPanel = () => {
    setShowInfoPanel(false)
  }

  const performSearch = () => {
    if (!searchTerm.trim()) return

    // First try to search locally
    for (const [id, hospital] of Object.entries(hospitalData)) {
      if (hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (hospital.services && hospital.services.some((service: string) => 
            service.toLowerCase().includes(searchTerm.toLowerCase())
          ))) {
        handleHospitalClick(id)
        return
      }
    }
    
    // If not found locally, try to search via API
    const searchViaApi = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/hospitals?name=${encodeURIComponent(searchTerm)}`)
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.length > 0) {
          // Update hospital data with new results
          const hospitalObject: Record<string, any> = {...hospitalData}
          
          data.forEach((hospital: any) => {
            hospitalObject[hospital.id] = {
              ...hospital,
              position: hospital.position as [number, number]
            }
          })
          
          setHospitalData(hospitalObject)
          
          // Select the first result
          handleHospitalClick(data[0].id.toString())
        } else {
          alert('No hospitals found matching your search. Please try again.')
        }
      } catch (err) {
        console.error('Error searching hospitals:', err)
        alert('Error searching hospitals. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    searchViaApi()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    
    // Force map refresh after a short delay to fix rendering issues
    setTimeout(() => {
      const mapElement = document.querySelector('.leaflet-container')
      if (mapElement) {
        const map = (mapElement as any)._leaflet_map
        if (map) {
          map.invalidateSize()
        }
      }
    }, 100)
  }

  const highlightCard = (id: string) => {
    document.querySelectorAll('.hospital-card').forEach(card => {
      card.classList.remove('active')
      if (card.getAttribute('data-id') === id) {
        card.classList.add('active')
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }



  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'}`}>
      <div className={`${isFullscreen ? 'h-full flex flex-col' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        {/* Header */}
        <div className={`${isFullscreen ? 'flex-shrink-0 p-4 bg-white border-b' : 'text-center mb-8'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h1 className={`font-bold text-gray-900 ${isFullscreen ? 'text-2xl' : 'text-4xl'}`}>
                Find Hospitals Near You
              </h1>
            </div>
            
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {isFullscreen ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Fullscreen
                </>
              )}
            </button>
          </div>
          
          {!isFullscreen && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Browse our network of healthcare providers and find the best facility for your needs
            </p>
          )}
          
          {/* Search Bar */}
          <div className={`${isFullscreen ? 'mt-4' : 'max-w-2xl mx-auto'}`}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search hospitals, services, or locations..."
                className="w-full px-6 py-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              />
              <button
                onClick={performSearch}
                className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </div>
        </div>

        <div className={`${isFullscreen ? 'flex-1 flex' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
          {/* Map Component */}
          <div className={`${isFullscreen ? 'flex-1' : 'lg:col-span-2'}`}>
            {/* Use the optimized HospitalMap component */}
            <HospitalMap 
              hospitalData={hospitalData}
              mapCenter={mapCenter}
              selectedHospital={selectedHospital}
              handleHospitalClick={handleHospitalClick}
              highlightCard={highlightCard}
              showInfoPanel={showInfoPanel}
              closeInfoPanel={closeInfoPanel}
              isFullscreen={isFullscreen}
            />
          </div>

          {/* Hospital List */}
          <div className={`${isFullscreen ? 'w-80 flex-shrink-0' : ''} space-y-4 max-h-[650px] overflow-y-auto`}>
            {Object.entries(hospitalData).map(([id, hospital]) => (
              <div
                key={id}
                className={`hospital-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 ${
                  selectedHospital?.name === hospital.name 
                    ? 'border-green-500 bg-blue-50 active' 
                    : 'border-blue-500 hover:border-green-500'
                }`}
                                 data-id={id}
                 onClick={() => {
                   handleHospitalClick(id)
                   highlightCard(id)
                 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-lg text-blue-700">{hospital.name}</h3>
                  <div className="flex items-center bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    <span className="text-yellow-300 mr-1">★</span>
                    {hospital.rating}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{hospital.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{hospital.phone}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {hospital.services.slice(0, 3).map((service, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {service}
                      </span>
                    ))}
                    {hospital.services.length > 3 && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        +{hospital.services.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Only show when not in fullscreen */}
        {!isFullscreen && (
          <div className="mt-12 text-center">
            <div className="flex justify-center gap-6 mb-4">
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About Hospital Listings
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy Policy
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Terms of Service
              </a>
            </div>
            <p className="text-gray-600">© 2023 Hospital Finder. All rights reserved. Providing healthcare access since 2015</p>
          </div>
        )}
      </div>
    </div>
  )
}