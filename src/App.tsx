import React from 'react'
import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { VehicleDetail } from './components/VehicleDetail'
import { AdminDashboard } from './components/AdminDashboard'
import { SalespersonUpload } from './components/SalespersonUpload'
import { DownloadProject } from './components/DownloadProject'


function App() {
  const [route, setRoute] = useState('/')
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
    const handleHashChange = () => {
      try {
      const hash = window.location.hash.slice(1) || '/'
      
      if (hash.startsWith('/vehicle/')) {
        const id = hash.split('/')[2]
        setVehicleId(id)
        setRoute('/vehicle')
      } else {
        setRoute(hash)
        setVehicleId(null)
      }
      } catch (error) {
        console.error('Routing error:', error)
        setRoute('/')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange() // Initial route
      setLoading(false)

    return () => window.removeEventListener('hashchange', handleHashChange)
    } catch (error) {
      console.error('App initialization error:', error)
      setError('Failed to initialize application')
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Toyota Dealership System...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Application Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (route) {
      case '/admin':
        return <AdminDashboard />
      case '/upload':
        return <SalespersonUpload />
      case '/download':
        return <DownloadProject />
      case '/vehicle':
        return vehicleId ? <VehicleDetail vehicleId={vehicleId} /> : <HomePage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin={route === '/admin'} />
      <main>
        {renderContent()}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Pedersen Toyota</h3>
            <p className="text-gray-300 text-sm">
              Pre-Owned Vehicle Showcase • Quality Vehicles in Reconditioning
            </p>
            <p className="text-gray-400 text-xs mt-4">
              All vehicles shown are currently going through our reconditioning process.
              Availability subject to completion of safety and mechanical inspections.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
