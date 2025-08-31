import { useState } from 'react'
import { supabase, Vehicle } from '../lib/supabase'
import { Mail, Phone, User, MessageSquare } from 'lucide-react'

interface CustomerInquiryFormProps {
  vehicleId: string
  vehicleInfo: string
  assignedSalesperson: string
  vehicle?: Vehicle
}

export default function CustomerInquiryForm({ vehicleId, vehicleInfo, assignedSalesperson, vehicle }: CustomerInquiryFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('customer_inquiries')
        .insert({
          vehicle_id: vehicleId,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          message: formData.message,
          assigned_salesperson: assignedSalesperson
        })

      if (error) throw error

      // Send email notification
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-inquiry-email`
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inquiry: {
              customer_name: formData.customerName,
              customer_email: formData.customerEmail,
              customer_phone: formData.customerPhone,
              message: formData.message
            },
            vehicle: {
              year: vehicleInfo.split(' ')[0],
              make: vehicleInfo.split(' ')[1],
              model: vehicleInfo.split(' ')[2],
              trim: vehicleInfo.split('(')[0].split(' ').slice(3).join(' ').trim(),
              stock_number: vehicleInfo.match(/Stock #(\w+)/)?.[1] || 'Unknown',
              price: 0,
              mileage: 0,
              exterior_color: 'Unknown'
            }
          })
        })
      } catch (emailError) {
        console.error('Email notification failed:', emailError)
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('There was an error submitting your inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Thank You!</h3>
        <p className="text-green-700 mb-4">
          Your inquiry about the {vehicleInfo} has been sent to our used car manager.
        </p>
        <p className="text-green-600 text-sm">
          {assignedSalesperson && `Your assigned salesperson, ${assignedSalesperson}, will be notified and will contact you soon.`}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Mail className="h-5 w-5 mr-2 text-red-600" />
        Interested in This Vehicle?
      </h3>
      
      <p className="text-gray-600 text-sm mb-6">
        Submit your information and our used car manager will contact you about reserving this vehicle.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Name *
          </label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline h-4 w-4 mr-1" />
            Email *
          </label>
          <input
            type="email"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={formData.customerEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline h-4 w-4 mr-1" />
            Phone
          </label>
          <input
            type="tel"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={formData.customerPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="inline h-4 w-4 mr-1" />
            Message
          </label>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Tell us about your interest in this vehicle, financing needs, or any questions..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? 'Sending...' : 'Send Inquiry'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-blue-700 text-sm">
          <strong>Reserve Process:</strong> After test driving, you can reserve this vehicle with a signed agreement (no deposit required). 
          If we discover major mechanical issues during reconditioning, you won't be expected to purchase.
        </p>
      </div>
    </div>
  )
}
