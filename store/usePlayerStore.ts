import { create } from 'zustand'
import { Howl, Howler } from 'howler'
import { UnifiedTrack } from '@/lib/supabase'

// Re-export so consumers can import from one place
export type { UnifiedTrack }
// Backward compat alias
export type Track = UnifiedTrack

interface PlayerState {
  currentTrack: UnifiedTrack | null
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  howl: Howl | null

  /** Ordered playlist for the currently-selected state */
  playlist: UnifiedTrack[]
  /** Index of the current track within playlist (-1 if not in playlist) */
  currentIndex: number

  // ── Playback actions ──────────────────────────────────────────────────────
  play: (track?: UnifiedTrack) => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  _updateProgress: () => void

  // ── Playlist actions ──────────────────────────────────────────────────────
  /**
   * Load a full playlist and optionally start playing from a given index.
   * Replaces any existing playlist for the state.
   */
  setPlaylist: (tracks: UnifiedTrack[], startIndex?: number) => void

  /** Append more tracks to the existing playlist (lazy loading). */
  appendToPlaylist: (tracks: UnifiedTrack[]) => void

  /** Play the next track. Wraps at end of playlist. */
  playNext: () => void

  /** Play the previous track. Wraps at start of playlist. */
  playPrev: () => void

  /**
   * Register a callback to fire when the current track naturally ends.
   * Only one callback supported at a time (last registration wins).
   * Returns an unregister function.
   */
  registerOnEnd: (cb: () => void) => () => void

  /**
   * Register a callback that fires when the player is about to run out of
   * tracks (triggered when currentIndex reaches playlist.length - 3).
   * Use this to lazy-load more tracks from the server.
   */
  registerOnNeedMoreTracks: (cb: () => void) => () => void

  /**
   * Called when a track fails to load.
   * Marks it inactive externally and skips to next.
   */
  markCurrentTrackFailed: () => void
}

let progressInterval: NodeJS.Timeout | null = null

// Module-level callback refs — survive Zustand state updates without
// causing re-subscriptions or stale-closure issues inside the Howl instance.
let _onEndCallback: (() => void) | null = null
let _onNeedMoreTracksCallback: (() => void) | null = null

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  howl: null,
  playlist: [],
  currentIndex: -1,

  registerOnEnd: (cb: () => void) => {
    _onEndCallback = cb
    return () => {
      if (_onEndCallback === cb) _onEndCallback = null
    }
  },

  registerOnNeedMoreTracks: (cb: () => void) => {
    _onNeedMoreTracksCallback = cb
    return () => {
      if (_onNeedMoreTracksCallback === cb) _onNeedMoreTracksCallback = null
    }
  },

  setPlaylist: (tracks: UnifiedTrack[], startIndex = 0) => {
    set({ playlist: tracks, currentIndex: startIndex })
    if (tracks.length > 0 && startIndex >= 0 && startIndex < tracks.length) {
      get().play(tracks[startIndex])
    }
  },

  appendToPlaylist: (tracks: UnifiedTrack[]) => {
    const { playlist } = get()
    // Dedupe by id
    const existingIds = new Set(playlist.map(t => t.id))
    const newTracks = tracks.filter(t => !existingIds.has(t.id))
    if (newTracks.length > 0) {
      set({ playlist: [...playlist, ...newTracks] })
    }
  },

  playNext: () => {
    const { playlist, currentIndex } = get()
    if (playlist.length === 0) return
    const nextIndex = (currentIndex + 1) % playlist.length
    set({ currentIndex: nextIndex })
    get().play(playlist[nextIndex])

    // Fire "need more tracks" when we're 3 tracks from the end
    if (nextIndex >= playlist.length - 3) {
      _onNeedMoreTracksCallback?.()
    }
  },

  playPrev: () => {
    const { playlist, currentIndex } = get()
    if (playlist.length === 0) return
    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    set({ currentIndex: prevIndex })
    get().play(playlist[prevIndex])
  },

  markCurrentTrackFailed: () => {
    // Skip to next — the component layer handles marking DB inactive
    get().playNext()
  },

  play: (track?: UnifiedTrack) => {
    const state = get()

    // Resume same track
    if (!track && state.howl) {
      state.howl.play()
      set({ isPlaying: true })
      return
    }

    // Stop existing Howl
    if (state.howl) {
      state.howl.stop()
      state.howl.unload()
    }

    if (!track) return

    // Update currentIndex if this track is in the playlist
    const { playlist } = get()
    const idx = playlist.findIndex(t => t.id === track.id)
    if (idx !== -1) {
      set({ currentIndex: idx })
      // Fire "need more tracks" when approaching end
      if (idx >= playlist.length - 3) {
        _onNeedMoreTracksCallback?.()
      }
    }

    const howl = new Howl({
      src: [track.audio_url],
      html5: true, // Force HTML5 audio for streaming + CORS support
      volume: state.volume,
      format: (() => {
        const url = track.audio_url.toLowerCase()
        if (url.endsWith('.ogg') || url.includes('.ogg?')) return ['ogg']
        if (url.endsWith('.wav') || url.includes('.wav?')) return ['wav']
        if (url.endsWith('.flac') || url.includes('.flac?')) return ['flac']
        return ['mp3'] // Default — also works for ambiguous IA stream URLs
      })(),
      onplay: () => {
        set({ isPlaying: true, duration: howl.duration() || track.duration_seconds || 0 })
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
        // Auto-advance via registered callback (queue manager), or advance playlist directly
        if (_onEndCallback) {
          _onEndCallback()
        } else {
          get().playNext()
        }
      },
      onstop: () => {
        set({ isPlaying: false, progress: 0 })
        if (progressInterval) clearInterval(progressInterval)
      },
      onloaderror: () => {
        console.warn('[Sur Sansar] Audio failed to load:', track.audio_url)
        // Clear the progress interval before advancing to prevent zombie intervals
        if (progressInterval) clearInterval(progressInterval)
        set({ isPlaying: false })
        get().markCurrentTrackFailed()
      },
      onplayerror: () => {
        console.warn('[Sur Sansar] Audio failed to play:', track.audio_url)
        howl.once('unlock', () => howl.play())
      },
    })

    howl.play()
    set({
      currentTrack: track,
      howl,
      isPlaying: true,
      progress: 0,
      duration: track.duration_seconds || 0,
    })
  },

  pause: () => {
    const { howl } = get()
    if (howl) howl.pause()
  },

  stop: () => {
    const { howl } = get()
    if (howl) {
      howl.stop()
      howl.unload()
    }
    if (progressInterval) clearInterval(progressInterval)
    set({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      howl: null,
      playlist: [],
      currentIndex: -1,
    })
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
      const pos = howl.seek()
      if (typeof pos === 'number') {
        set({ progress: pos })
      }
    }
  },
}))
