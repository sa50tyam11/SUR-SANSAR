import { create } from 'zustand'
import { Howl, Howler } from 'howler'
import { Track } from '@/lib/supabase'

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  howl: Howl | null
  
  // Actions
  play: (track?: Track) => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  _updateProgress: () => void
}

let progressInterval: NodeJS.Timeout | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  howl: null,

  play: (track?: Track) => {
    const state = get()
    
    // If playing the same track, just resume
    if (!track && state.howl) {
      state.howl.play()
      set({ isPlaying: true })
      return
    }

    // If there's an existing track playing, stop it
    if (state.howl) {
      state.howl.stop()
      state.howl.unload()
    }

    if (!track) return

    // Create new Howl instance
    const howl = new Howl({
      src: [track.audio_url],
      html5: true, // Force HTML5 audio to allow streaming and avoid CORS issues with big files
      volume: state.volume,
      onplay: () => {
        set({ isPlaying: true, duration: howl.duration() })
        
        // Start progress tracker
        if (progressInterval) clearInterval(progressInterval)
        progressInterval = setInterval(() => {
          get()._updateProgress()
        }, 1000)
      },
      onpause: () => {
        set({ isPlaying: false })
        if (progressInterval) clearInterval(progressInterval)
      },
      onend: () => {
        set({ isPlaying: false, progress: 0 })
        if (progressInterval) clearInterval(progressInterval)
      },
      onstop: () => {
        set({ isPlaying: false, progress: 0 })
        if (progressInterval) clearInterval(progressInterval)
      },
      onloaderror: () => {
        console.error("Audio failed to load")
        set({ isPlaying: false })
      },
      onplayerror: () => {
        console.error("Audio failed to play")
        howl.once('unlock', () => howl.play())
      }
    })

    howl.play()
    set({ currentTrack: track, howl, isPlaying: true, progress: 0, duration: track.duration_seconds || 0 })
  },

  pause: () => {
    const { howl } = get()
    if (howl) {
      howl.pause()
    }
  },

  stop: () => {
    const { howl } = get()
    if (howl) {
      howl.stop()
      howl.unload()
    }
    if (progressInterval) clearInterval(progressInterval)
    set({ currentTrack: null, isPlaying: false, progress: 0, duration: 0, howl: null })
  },

  seek: (time: number) => {
    const { howl } = get()
    if (howl) {
      howl.seek(time)
      set({ progress: time })
    }
  },

  setVolume: (volume: number) => {
    Howler.volume(volume)
    set({ volume })
  },

  _updateProgress: () => {
    const { howl, isPlaying } = get()
    if (howl && isPlaying) {
      set({ progress: howl.seek() as number })
    }
  }
}))
