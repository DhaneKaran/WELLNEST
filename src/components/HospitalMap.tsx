'use client'

import { useEffect, useState, memo, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Define the props interface
interface HospitalMapProps {
  hospitalData: Record<string, any>
  mapCenter: [number, number]
  selectedHospital: any
  handleHospitalClick: (id: string) => void
  highlightCard: (id: string) => void
  showInfoPanel: boolean
  closeInfoPanel: () => void
  isFullscreen: boolean
}

// Use memo to prevent unnecessary re-renders
const HospitalMap = memo(function HospitalMap({
  hospitalData,
  mapCenter,
  selectedHospital,
  handleHospitalClick,
  highlightCard,
  showInfoPanel,
  closeInfoPanel,
  isFullscreen
}: HospitalMapProps) {
  const [MapComponent, setMapComponent] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [mapKey, setMapKey] = useState(Date.now())
  // store marker refs in a single ref map to avoid calling hooks inside loops
  const markersRef = useRef<Record<string, any>>({})

  // Force map re-render when fullscreen changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      setMapKey(Date.now())
    }, 100)
    return () => clearTimeout(timer)
  }, [isFullscreen])
  
  // Set active marker when selectedHospital changes and ensure it's visible
  useEffect(() => {
    if (isClient && selectedHospital) {
      // Small delay to ensure markers are rendered
      const timer = setTimeout(() => {
        // Remove active class from all markers
        document.querySelectorAll('.leaflet-marker-icon').forEach(marker => {
          marker.classList.remove('leaflet-marker-active');
        });
        
        // Find the marker for the selected hospital and add active class
        let selectedPosition = null;
        Object.entries(hospitalData).forEach(([id, hospital]) => {
          if (hospital.name === selectedHospital.name) {
            const markers = document.querySelectorAll('.leaflet-marker-icon');
            // We need to find the right marker - this is a simplification
            // In a real app, you might need a more robust way to identify the correct marker
            if (markers.length > 0 && markers[parseInt(id) % markers.length]) {
              const markerElement = markers[parseInt(id) % markers.length] as HTMLElement;
              markerElement.classList.add('leaflet-marker-active');

              // Make the marker more visible with a pulsing effect
              markerElement.style.animation = 'pulse 1.5s infinite';

              // Store position for map centering
              selectedPosition = hospital.position;
            }
          }
        });
        
        // Center map on selected hospital if position is found
        if (selectedPosition) {
          // Find the map instance - this is a simplification
          const mapContainer = document.querySelector('.leaflet-container') as any;
          if (mapContainer && mapContainer._leaflet_id) {
            const map = (window as any).L?.Maps?.[mapContainer._leaflet_id];
            if (map) {
              map.setView(selectedPosition, map.getZoom(), {
                animate: true,
                duration: 1
              });
            }
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [selectedHospital, isClient, hospitalData])

  useEffect(() => {
    setIsClient(true)
    // Dynamically import react-leaflet components with reduced features
    import('react-leaflet').then(({ MapContainer, TileLayer, Marker, Popup, useMap }) => {
      import('leaflet').then((L) => {
        // Fix for default marker icons in Next.js
        delete (L.default.Icon.Default.prototype as any)._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        })

        // Ensure the CSS styles are clean and properly structured

        setMapComponent({ MapContainer, TileLayer, Marker, Popup, useMap })
      })
    })
  }, [])

  if (!isClient || !MapComponent) {
    return (
      <div className="h-full w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker, Popup } = MapComponent

  // Create a custom MapCenter component
  const MapCenter = ({ center }: { center: [number, number] }) => {
    const map = MapComponent.useMap ? MapComponent.useMap() : null
    useEffect(() => {
      if (map) {
        map.setView(center)
      }
    }, [center, map])
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 h-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Medical Centers in Ratnagiri
      </h2>
      
      <div className={`relative rounded-xl overflow-hidden border-2 border-gray-200 ${isFullscreen ? 'h-full' : 'h-[500px]'}`}>
        <MapContainer 
          key={mapKey}
          center={mapCenter} 
          zoom={13} 
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
          zoomControl={true}
          doubleClickZoom={true}
          scrollWheelZoom={true} // Enable scroll wheel zoom for better user experience
          dragging={true}
          easeLinearity={0.35}
          tap={true} // Enable tap for mobile devices
          maxZoom={18}
          minZoom={10}
          preferCanvas={true} // Use canvas for better performance
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            className="map-tiles"
          />
          
          {/* Hospital Markers - Render all hospitals with enhanced hover effects */}
          {Object.entries(hospitalData).map(([id, hospital]) => {
            return (
              <Marker 
                key={id}
                position={hospital.position}
                ref={(el) => { markersRef.current[id] = el }}
                eventHandlers={{
                  click: () => {
                    handleHospitalClick(id)
                    highlightCard(id)
                    
                    // Add active class to all markers
                    document.querySelectorAll('.leaflet-marker-icon').forEach(marker => {
                      marker.classList.remove('leaflet-marker-active');
                    });
                    
                    // Add active class to clicked marker
                    const marker = markersRef.current[id]
                    const markerElement = marker?._icon as HTMLElement;
                    if (markerElement) {
                      markerElement.classList.add('leaflet-marker-active');
                    }
                  },
                  mouseover: () => {
                    const marker = markersRef.current[id]
                    if (marker) {
                      marker.openPopup();
                      // Add hover effect via class if not already active
                      if (!marker._icon.classList.contains('leaflet-marker-active')) {
                        marker._icon.style.transform = 'scale(1.3)';
                        marker._icon.style.filter = 'drop-shadow(0 0 5px rgba(0, 100, 255, 0.5))';
                        marker._icon.style.zIndex = '1000';
                      }
                    }
                  },
                  mouseout: () => {
                    const marker = markersRef.current[id]
                    if (marker) {
                      // Keep popup open for a short time to allow user to move mouse to popup
                      setTimeout(() => {
                        if (marker && !marker._popup._container?.matches(':hover')) {
                          marker.closePopup();
                        }
                      }, 300);

                      // Remove hover effect if not active marker
                      if (!(marker._icon as HTMLElement).classList.contains('leaflet-marker-active')) {
                        (marker._icon as HTMLElement).style.transform = '';
                        (marker._icon as HTMLElement).style.filter = '';
                        (marker._icon as HTMLElement).style.zIndex = '';
                      }
                    }
                  }
                }}
              >
                <Popup className="hospital-popup" closeButton={false}>
                  <div className="p-3 bg-white rounded-lg shadow-md">
                    <h3 className="font-bold text-lg text-blue-700 mb-2">{hospital.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {hospital.address}
                    </p>
                    <div className="flex items-center mb-2 bg-yellow-50 p-1 rounded">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="text-sm font-medium text-green-600">{hospital.rating}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3 justify-center bg-blue-50 p-2 rounded">
                      {hospital.services && hospital.services.slice(0, 2).map((service, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {service}
                        </span>
                      ))}
                      {hospital.services && hospital.services.length > 2 && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded text-blue-500 font-medium">
                          +{hospital.services.length - 2} more
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        // Store selected hospital in localStorage for appointment page
                        localStorage.setItem('selectedHospital', JSON.stringify(hospital))
                        window.location.href = '/appointments'
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-2 px-3 rounded-lg hover:from-green-600 hover:to-green-800 transition-all transform hover:scale-105 shadow-md text-sm font-semibold flex items-center justify-center gap-1 mx-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Book Appointment
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {MapComponent.useMap && <MapCenter center={mapCenter} />}
        </MapContainer>
        
        {/* Map Attribution */}
        <div className="mt-4 text-center">
          <div className="bg-gray-100 px-4 py-2 rounded-lg inline-block">
            <span className="text-sm text-gray-600">
              Map data © <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenStreetMap</a> contributors
            </span>
          </div>
        </div>
        
        {/* Hospital Info Panel */}
        {showInfoPanel && selectedHospital && (
          <div className="absolute bottom-6 left-6 right-6 bg-white border-l-4 border-blue-500 rounded-xl p-6 shadow-xl z-[1000] transition-all duration-300 ease-in-out transform">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-blue-700">{selectedHospital.name}</h3>
              <button
                onClick={closeInfoPanel}
                className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors hover:scale-110"
                aria-label="Close panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{selectedHospital.address}</span>
              </div>
              <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{selectedHospital.phone}</span>
              </div>
              <div className="flex items-center text-gray-600 bg-yellow-50 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="flex items-center">
                  <span className="text-yellow-500 mr-1 font-medium">★</span>
                  {selectedHospital.rating}
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-3">Services Offered</h4>
              <div className="flex flex-wrap gap-2">
                {selectedHospital.services.map((service: string, idx: number) => (
                  <span key={idx} className="bg-white text-blue-800 px-3 py-1 rounded-full text-sm shadow-sm border border-blue-100">
                    {service}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // Store selected hospital in localStorage for appointment page
                  localStorage.setItem('selectedHospital', JSON.stringify(selectedHospital))
                  window.location.href = '/appointments'
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-800 transition-all transform hover:scale-105 shadow-md font-semibold flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Get Appointment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default HospitalMap