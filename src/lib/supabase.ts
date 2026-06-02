import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxvakrfqlldsjofoxdcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dmFrcmZxbGxkc2pvZm94ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTE2ODQsImV4cCI6MjA2NzA4NzY4NH0.JM2o1YdaYVgbda6wKJRGZl4t_40lPiQZBuo9L-qsBiI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Transaction {
  id: string
  brand: string
  model: string
  category: string
  detail: string
  date: string
  price: number
  cost: number
  profit: number
  repair_detail?: string
  accessory_detail?: string
  service_detail?: string
  created_at?: string
  updated_at?: string
}
