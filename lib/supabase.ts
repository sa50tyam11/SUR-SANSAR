import { createClient } from '@supabase/supabase-js'

export type Region = 'North' | 'South' | 'East' | 'West' | 'Northeast' | 'Central'
export type LicenseType = 'CC-BY' | 'AI-Generated' | 'Licensed'

export interface State {
  id: string
  name_en: string
  name_hi: string
  slug: string
  region: Region
  svg_path_id: string
  cover_image_url: string | null
  description: string | null
}

export interface Track {
  id: string
  state_id: string
  title: string
  artist: string | null
  instrument_type: string | null
  audio_url: string
  duration_seconds: number | null
  license_type: LicenseType | null
  play_count: number
  created_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
