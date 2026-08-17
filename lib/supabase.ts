import { createClient } from '@supabase/supabase-js'

export type Region = 'North' | 'South' | 'East' | 'West' | 'Northeast' | 'Central' | 'Unknown'
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SUR-SANSAR] Missing Supabase environment variables.\n' +
    'Create a .env.local file in the project root with:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n' +
    'Get these from: Supabase Dashboard → Settings → API'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
