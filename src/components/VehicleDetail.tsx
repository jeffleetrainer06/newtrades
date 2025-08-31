import { useState, useEffect } from 'react'
import { supabase, Vehicle, VehiclePhoto } from '../lib/supabase'
import CustomerInquiryForm from './CustomerInquiryForm'
import { Calendar, Gauge, Palette, Cog, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from './Link'

interface VehicleDetailProps {
  vehicleId: string
}

export function VehicleDetail({ vehicleId }: VehicleDetailProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [photos, setPhotos] = useState<VehiclePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    fetchVehicleDetails()
  }, [vehicleId])

  async function fetchVehicleDetails() {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        return
      }
      
      let { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()

      if (vehicleError) throw vehicleError

      const { data: photosData, error: photosError } = await supabase
        .from('vehicle_photos')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('sort_order')

      if (photosError) {
        console.error('Error fetching photos:', photosError)
      }

      setVehicle(vehicleData)
      setPhotos(photosData || [])
    } catch (error) {
      console.error('Error fetching vehicle details:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getPhotoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      front_corner: 'Passenger Front Corner',
      driver_side: 'Driver\'s Front Corner',
      rear_corner: 'Driver\'s Rear Corner',
      passenger_side: 'Passenger\'s Rear Corner',
      interior_front: 'Interior - Front Seats',
      interior_rear: 'Interior - Rear Seats',
      damage: 'Damage/Scratches/Wear',
      undercarriage: 'Undercarriage',
      additional: 'Additional'
    }
    return labels[type] || type
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vehicle Not Found</h2>
        <p className="text-gray-600 mb-6">The vehicle you're looking for is no longer available.</p>
        <Link href="/" className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 font-medium">
          View All Vehicles
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to All Vehicles
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {photos.length > 0 && (
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                src={photos[currentPhotoIndex].photo_url}
                alt={getPhotoTypeLabel(photos[currentPhotoIndex].photo_type)}
                className="w-full h-96 object-cover"
              />
            </div>
            
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentPhotoIndex + 1} of {photos.length} - {getPhotoTypeLabel(photos[currentPhotoIndex].photo_type)}
              </div>
            </div>
          </div>
        )}

        {photos.length > 1 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                    index === currentPhotoIndex ? 'border-red-600' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt={getPhotoTypeLabel(photo.photo_type)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
              </h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                Stock #{vehicle.stock_number}
              </span>
            </div>

            <div className="text-3xl font-bold text-red-600 mb-6">
              {vehicle.price > 0 ? (
                formatPrice(vehicle.price)
              ) : (
                <span className="text-xl text-gray-600 bg-yellow-100 px-4 py-2 rounded">
                  Price To Be Determined
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Gauge className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Mileage</div>
                  <div className="text-sm text-gray-600">{formatMileage(vehicle.mileage)} miles</div>
                </div>
              </div>

              <div className="flex items-center">
                <Palette className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Exterior Color</div>
                  <div className="text-sm text-gray-600">{vehicle.exterior_color}</div>
                </div>
              </div>

              <div className="flex items-center">
                <Cog className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Transmission</div>
                  <div className="text-sm text-gray-600">{vehicle.transmission}</div>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Interior</div>
                  <div className="text-sm text-gray-600">{vehicle.interior_color}</div>
                </div>
              </div>
            </div>

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {vehicle.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Currently in Reconditioning</h3>
              <p className="text-yellow-700 text-sm">
                This vehicle is going through our comprehensive reconditioning process. 
                You can reserve it now with a signed agreement (no deposit required) after a test drive.
              </p>
            </div>
          </div>

          <div>
            <CustomerInquiryForm
              vehicleId={vehicle.id}
              vehicleInfo={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} (Stock #${vehicle.stock_number})`}
              assignedSalesperson={vehicle.assigned_salesperson}
              vehicle={vehicle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
