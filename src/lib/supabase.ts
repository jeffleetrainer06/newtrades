import { createClient } from '@supabase/supabase-js'

// Ensure environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpilihdwpyagpjbahqwi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaWxpaGR3cHlhZ3BqYmFocXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTg2MDQsImV4cCI6MjA3MDE3NDYwNH0.ePSwZq9tbxtMG_l4jqGGIYYgWIZ2fYGuyMO4XBwR3VA'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration')
  console.log('URL available:', !!supabaseUrl)
  console.log('Key available:', !!supabaseAnonKey)
} else {
  console.log('Supabase configuration loaded successfully')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

console.log('Supabase client initialized')

export interface Vehicle {
  id: string
  stock_number: string
  year: number
  make: string
  model: string
  trim: string
  mileage: number
  price: number
  exterior_color: string
  interior_color: string
  transmission: string
  engine: string
  features: string[]
  description: string
  status: 'active' | 'sold' | 'removed'
  assigned_salesperson: string
  created_at: string
  updated_at: string
}

export interface VehiclePhoto {
  id: string
  vehicle_id: string
  photo_type: 'front_corner' | 'rear_corner' | 'driver_side' | 'passenger_side' | 'interior_front' | 'interior_rear' | 'damage' | 'undercarriage' | 'additional'
  photo_url: string
  caption: string
  sort_order: number
  uploaded_at: string
}

export interface CustomerInquiry {
  id: string
  vehicle_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  message: string
  assigned_salesperson: string
  created_at: string
}
