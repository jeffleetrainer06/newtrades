import { useState, useEffect } from 'react'
import { supabase, Vehicle, CustomerInquiry } from '../lib/supabase'
import { VehicleForm } from './VehicleForm'
import { PhotoUploadManager } from './PhotoUploadManager'
import { Plus, Edit2, Trash2, Eye, Mail, Phone } from 'lucide-react'

export function AdminDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [activeTab, setActiveTab] = useState<'vehicles' | 'photos' | 'inquiries'>('vehicles')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchVehicles()
    fetchInquiries()
  }, [])

  async function fetchVehicles() {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        setVehicles([])
        return
      }

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching vehicles:', error)
        alert('Error loading vehicles: ' + error.message)
        return
      }
      
      console.log('Fetched vehicles for admin:', data)
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      alert('Failed to load vehicles. Please refresh the page.')
    }
  }

  async function fetchInquiries() {
    const { data } = await supabase
      .from('customer_inquiries')
      .select(`
        *,
        vehicles (year, make, model, stock_number)
      `)
      .order('created_at', { ascending: false })
    
    setInquiries(data || [])
  }

  async function deleteVehicle(id: string) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
      
      if (error) {
        alert('Error deleting vehicle')
      } else {
        fetchVehicles()
      }
    }
  }

  async function markAsSold(id: string) {
    if (confirm('Mark this vehicle as sold?')) {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: 'sold' })
        .eq('id', id)
      
      if (error) {
        alert('Error updating vehicle status')
      } else {
        alert('Vehicle marked as sold!')
        fetchVehicles()
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage pre-owned vehicles and customer inquiries</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'vehicles', label: 'Vehicles', count: vehicles.length },
            { id: 'photos', label: 'Photo Management', count: null },
            { id: 'inquiries', label: 'Customer Inquiries', count: inquiries.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'vehicles' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Vehicle Inventory</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedVehicle(null)
                  setShowForm(true)
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Vehicle
              </button>
            </div>
          </div>

          {showForm && (
            <div className="mb-8">
              <VehicleForm
                vehicle={selectedVehicle}
                onSave={() => {
                  setShowForm(false)
                  setSelectedVehicle(null)
                  fetchVehicles()
                }}
                onCancel={() => {
                  setShowForm(false)
                  setSelectedVehicle(null)
                }}
              />
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                          </p>
                          <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                            vehicle.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : vehicle.status === 'sold'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {vehicle.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>Stock #{vehicle.stock_number}</span>
                          <span className="mx-2">•</span>
                          <span className={vehicle.price > 0 ? '' : 'text-red-600 font-medium'}>
                            {vehicle.price > 0 ? `$${vehicle.price.toLocaleString()}` : 'Not Priced Yet'}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{vehicle.assigned_salesperson}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.location.hash = `/vehicle/${vehicle.id}`}
                        className="text-gray-400 hover:text-gray-500"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle)
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      {vehicle.status === 'active' && (
                        <button
                          onClick={() => markAsSold(vehicle.id)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                          title="Mark as Sold"
                        >
                          Sold
                        </button>
                      )}
                      {vehicle.status === 'sold' && (
                        <button
                          onClick={() => deleteVehicle(vehicle.id)}
                         className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                         title="Remove from Inventory"
                        >
                         Remove
                        </button>
                      )}
                      {vehicle.status === 'active' && (
                      <button
                        onClick={() => deleteVehicle(vehicle.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 font-medium"
                        title="Delete"
                      >
                        Delete
                      </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Photo Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.filter(v => v.status === 'active').map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  {vehicle.year} {vehicle.make} {vehicle.model} - Stock #{vehicle.stock_number}
                </h3>
                <PhotoUploadManager vehicleId={vehicle.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Customer Inquiries</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {inquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {inquiry.customer_name}
                          </p>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-1" />
                            <a href={`mailto:${inquiry.customer_email}`} className="hover:text-gray-700">
                              {inquiry.customer_email}
                            </a>
                            {inquiry.customer_phone && (
                              <>
                                <span className="mx-2">•</span>
                                <Phone className="h-4 w-4 mr-1" />
                                <a href={`tel:${inquiry.customer_phone}`} className="hover:text-gray-700">
                                  {inquiry.customer_phone}
                                </a>
                              </>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            Vehicle: {(inquiry as any).vehicles?.year} {(inquiry as any).vehicles?.make} {(inquiry as any).vehicles?.model} 
                            (Stock #{(inquiry as any).vehicles?.stock_number})
                          </p>
                          {inquiry.message && (
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              {inquiry.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-right text-sm text-gray-500">
                          <p>{formatDate(inquiry.created_at)}</p>
                          {inquiry.assigned_salesperson && (
                            <p className="mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Assigned: {inquiry.assigned_salesperson}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
