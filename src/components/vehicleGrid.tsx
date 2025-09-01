import { useState, useEffect } from 'react'
import { supabase, Vehicle } from '../lib/supabase'
import { VehicleCard } from './VehicleCard' // Ensure this import is correct too
import { Search, Filter } from 'lucide-react'

export function VehicleGrid() { // <--- This line is crucial
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])

  useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        setVehicles([])
        return
      }
      
      let { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching vehicles:', error)
        alert('Error loading vehicles: ' + error.message)
        return
      }
      
      console.log('Fetched vehicles:', data)
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      alert('Failed to load vehicles. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.year.toString().includes(searchTerm) ||
      vehicle.stock_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPrice = vehicle.price >= priceRange[0] && vehicle.price <= priceRange[1]
    
    return matchesSearch && matchesPrice
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filter Controls */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by make, model, year, or stock number..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Filter className="text-gray-400 h-5 w-5" />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Price Range:</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number)
                  setPriceRange([min, max])
                }}
              >
                <option value="0-100000">All Prices</option>
                <option value="0-15000">Under $15,000</option>
                <option value="15000-25000">$15,000 - $25,000</option>
                <option value="25000-35000">$25,000 - $35,000</option>
                <option value="35000-50000">$35,000 - $50,000</option>
                <option value="50000-100000">Over $50,000</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Available
        </h2>
        <p className="text-gray-600 mt-1">
          Currently going through our reconditioning process
        </p>
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or check back later for new arrivals.
          </p>
        </div>
      )}
    </div>
  )
}

