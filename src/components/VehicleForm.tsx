import { useState, useEffect } from 'react'
import { supabase, Vehicle } from '../lib/supabase'

interface VehicleFormProps {
  vehicle: Vehicle | null
  onSave: () => void
  onCancel: () => void
}

export function VehicleForm({ vehicle, onSave, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    stock_number: '',
    year: new Date().getFullYear(),
    make: 'Toyota',
    model: '',
    trim: '',
    mileage: 0,
    price: 0,
    exterior_color: '',
    interior_color: '',
    transmission: '',
    engine: '',
    features: [] as string[],
    description: '',
    assigned_salesperson: ''
  })
  const [newFeature, setNewFeature] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stockError, setStockError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (vehicle) {
      setFormData({
        stock_number: vehicle.stock_number,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        mileage: vehicle.mileage,
        price: vehicle.price,
        exterior_color: vehicle.exterior_color,
        interior_color: vehicle.interior_color,
        transmission: vehicle.transmission,
        engine: vehicle.engine,
        features: vehicle.features || [],
        description: vehicle.description,
        assigned_salesperson: vehicle.assigned_salesperson
      })
    }
  }, [vehicle])

  const checkStockNumber = async (stockNumber: string) => {
    if (!stockNumber.trim()) {
      setStockError('')
      return
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id')
        .eq('stock_number', stockNumber.trim())
        .neq('id', vehicle?.id || '')

      if (error) {
        console.error('Error checking stock number:', error)
        return
      }

      if (data && data.length > 0) {
        setStockError('This stock number already exists. Please use a different one.')
      } else {
        setStockError('')
      }
    } catch (error) {
      console.error('Error checking stock number:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (stockError) {
      alert('Please fix the stock number error before saving.')
      return
    }
    
    setIsSubmitting(true)

    try {
      console.log('Attempting to save vehicle with data:', formData)
      
      if (!supabase) {
        alert('Database connection not available. Please refresh the page and try again.')
        setIsSubmitting(false)
        return
      }

      if (vehicle) {
        console.log('Updating existing vehicle:', vehicle.id)
        const { error } = await supabase
          .from('vehicles')
          .update(formData)
          .eq('id', vehicle.id)
        
        if (error) {
          console.error('Update error:', error)
          throw error
        }
      } else {
        console.log('Creating new vehicle')
        const { error } = await supabase
          .from('vehicles')
          .insert(formData)
        
        if (error) {
          console.error('Insert error:', error)
          throw error
        }
      }

      console.log('Vehicle saved successfully')
      onSave()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      
      if (error?.code === '23505' && error?.message?.includes('vehicles_stock_number_key')) {
        alert('This stock number already exists. Please use a different stock number.')
      } else if (error?.code === '23502') {
        alert('Please fill in all required fields (marked with *).')
      } else if (error?.message?.includes('JWT')) {
        alert('Session expired. Please refresh the page and try again.')
      } else if (error?.message?.includes('network')) {
        alert('Network error. Please check your internet connection and try again.')
      } else {
        alert(`Error saving vehicle: ${error?.message || 'Unknown error'}. Please try again.`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Number *
            </label>
            <input
              type="text"
              required
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                stockError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.stock_number}
              onChange={(e) => {
                const value = e.target.value
                setFormData(prev => ({ ...prev, stock_number: value }))
                checkStockNumber(value)
              }}
              onBlur={(e) => checkStockNumber(e.target.value)}
            />
            {stockError && (
              <p className="text-red-600 text-sm mt-1">{stockError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <input
              type="number"
              required
              min="1990"
              max="2025"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Make *
            </label>
            <select
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.make}
              onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
            >
              <option value="Acura">Acura</option>
              <option value="Alfa Romeo">Alfa Romeo</option>
              <option value="Audi">Audi</option>
              <option value="BMW">BMW</option>
              <option value="Buick">Buick</option>
              <option value="Cadillac">Cadillac</option>
              <option value="Chevrolet">Chevrolet</option>
              <option value="Chrysler">Chrysler</option>
              <option value="Dodge">Dodge</option>
              <option value="Ford">Ford</option>
              <option value="Genesis">Genesis</option>
              <option value="GMC">GMC</option>
              <option value="Honda">Honda</option>
              <option value="Hyundai">Hyundai</option>
              <option value="Infiniti">Infiniti</option>
              <option value="Jaguar">Jaguar</option>
              <option value="Jeep">Jeep</option>
              <option value="Kia">Kia</option>
              <option value="Land Rover">Land Rover</option>
              <option value="Lexus">Lexus</option>
              <option value="Lincoln">Lincoln</option>
              <option value="Lucid">Lucid</option>
              <option value="Maserati">Maserati</option>
              <option value="Mazda">Mazda</option>
              <option value="Mercedes-Benz">Mercedes-Benz</option>
              <option value="Mini">Mini</option>
              <option value="Mitsubishi">Mitsubishi</option>
              <option value="Nissan">Nissan</option>
              <option value="Polestar">Polestar</option>
              <option value="Porsche">Porsche</option>
              <option value="Ram">Ram</option>
              <option value="Rivian">Rivian</option>
              <option value="Subaru">Subaru</option>
              <option value="Tesla">Tesla</option>
              <option value="Toyota">Toyota</option>
              <option value="Volkswagen">Volkswagen</option>
              <option value="Volvo">Volvo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trim
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.trim}
              onChange={(e) => setFormData(prev => ({ ...prev, trim: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mileage
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.mileage}
              onChange={(e) => setFormData(prev => ({ ...prev, mileage: parseInt(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <input
              type="number"
              required
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter selling price (or 0 if unknown)"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can enter 0 now and update the price later in the photo upload section
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exterior Color
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.exterior_color}
              onChange={(e) => setFormData(prev => ({ ...prev, exterior_color: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interior Color
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.interior_color}
              onChange={(e) => setFormData(prev => ({ ...prev, interior_color: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transmission
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.transmission}
              onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value }))}
            >
              <option value="">Select Transmission</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
              <option value="CVT">CVT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engine
            </label>
            <input
              type="text"
              placeholder="e.g., 2.5L 4-Cylinder"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.engine}
              onChange={(e) => setFormData(prev => ({ ...prev, engine: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Salesperson
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={formData.assigned_salesperson}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_salesperson: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add a feature..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <button
              type="button"
              onClick={addFeature}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Describe the vehicle condition, special features, etc..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
          </button>
        </div>
      </form>
    </div>
  )
}
