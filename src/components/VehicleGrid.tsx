import { useState, useEffect } from 'react'
import { supabase, Vehicle, VehiclePhoto } from '../lib/supabase'
import { Calendar, Gauge, Palette, DollarSign, User } from 'lucide-react'
import { Link } from './Link'

interface VehicleCardProps {
  vehicle: Vehicle
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const [primaryPhoto, setPrimaryPhoto] = useState<string>('')

  useEffect(() => {
    async function fetchPrimaryPhoto() {
      if (!supabase) return;
      
      try {
        const { data: photoData, error } = await supabase
          .from('vehicle_photos')
          .select('photo_url')
          .eq('vehicle_id', vehicle.id)
          .eq('photo_type', 'front_corner')
          .order('sort_order', { ascending: true })
          .limit(1)

        if (photoData && photoData.length > 0 && !error) {
          setPrimaryPhoto(photoData[0].photo_url)
        }
      } catch (error) {
        console.error('Error fetching photo:', error)
      }
    }

    fetchPrimaryPhoto()
  }, [vehicle.id])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/vehicle/${vehicle.id}`}>
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
              <span className="text-gray-500">No photo available</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6">
        <Link href={`/vehicle/${vehicle.id}`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600 transition-colors">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-4">
          {vehicle.price > 0 ? (
            <span className="text-2xl font-bold text-red-600">
              {formatPrice(vehicle.price)}
            </span>
          ) : (
            <span className="text-lg font-medium text-gray-500 bg-yellow-100 px-3 py-1 rounded">
              Price Pending
            </span>
          )}
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Stock #{vehicle.stock_number}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Gauge className="h-4 w-4 mr-2 text-gray-400" />
            {formatMileage(vehicle.mileage)} miles
          </div>
          <div className="flex items-center">
            <Palette className="h-4 w-4 mr-2 text-gray-400" />
            {vehicle.exterior_color}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {vehicle.transmission}
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            {vehicle.assigned_salesperson}
          </div>
        </div>

        {vehicle.features && vehicle.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {vehicle.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {feature}
                </span>
              ))}
              {vehicle.features.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{vehicle.features.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Link
            href={`/vehicle/${vehicle.id}`}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium text-center block"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
