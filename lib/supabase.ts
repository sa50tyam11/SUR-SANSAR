import { createClient } from '@supabase/supabase-js'

export type Region = 'North' | 'South' | 'East' | 'West' | 'Northeast' | 'Central' | 'Unknown'
export type LicenseType = 'CC-BY' | 'AI-Generated' | 'Licensed' | 'Wikimedia'

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

/**
 * Represents a row in the `state_music_links` table.
 * Only external stream URLs are stored here — no audio uploads to Supabase.
 */
export interface StateMusicLink {
  id: string
  state_name: string           // e.g. "Rajasthan"
  track_title: string
  artist: string | null
  stream_url: string           // external .mp3 or .ogg URL
  source: string               // "Internet Archive" | "Wikimedia Commons"
  duration_seconds: number | null
  license_type: LicenseType
  is_active: boolean
  created_at: string
}

/**
 * A unified track shape used throughout the UI (player, panels, queue).
 * Adapts both local `Track` objects and `StateMusicLink` rows.
 */
export interface UnifiedTrack {
  id: string
  state_id: string
  title: string
  artist: string | null
  instrument_type: string | null
  audio_url: string            // may be /local.mp3 or https://external.org/file.mp3
  duration_seconds: number | null
  license_type: LicenseType | null
  play_count: number
  created_at: string
  source?: string              // "Internet Archive" | "Wikimedia Commons" | "local"
  is_active?: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Graceful degradation: if env vars are missing, the client is null and
// all queries fall back to dummy data. No hard crash on the client side.
let supabaseClient: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_PROJECT_ID') &&
  !supabaseAnonKey.includes('YOUR_ANON_PUBLIC_KEY')
) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient
export const isSupabaseConfigured = supabaseClient !== null
