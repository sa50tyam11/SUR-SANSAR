/**
 * useQueueSync.ts
 *
 * Manages the shared live playlist for a SUR-SANSAR Community Room.
 *
 * Responsibilities:
 *  - Add tracks to the shared queue (any user)
 *  - Remove tracks from the shared queue (any user)
 *  - Skip to the next track (Host only)
 *  - Auto-advance on track end (Host only, via registerOnEnd)
 *  - Broadcast every queue mutation so all clients stay in sync
 *
 * Architecture:
 *  The "queue" is the `playlist` array owned by useRoomSync.
 *  `playbackState.activeTrackId` marks what is currently playing.
 *  "Up Next" = tracks in playlist after the activeTrackId index.
 *  When a track ends, the Host finds the next index and plays it.
 */

import { useEffect, useCallback, useRef } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Track } from '@/lib/supabase'
import { PlaybackState, UseRoomSyncReturn } from './useRoomSync'

interface UseQueueSyncOptions {
  isHost: boolean
  playlist: Track[]
  playbackState: PlaybackState
  broadcastPlayback: UseRoomSyncReturn['broadcastPlayback']
  updatePlaylist: UseRoomSyncReturn['updatePlaylist']
}

export interface UseQueueSyncReturn {
  /** Index of the currently active track in the playlist, or -1. */
  activeIndex: number
  /** Tracks queued after the currently active one. */
  upNext: Track[]
  /** Add a track to the end of the shared queue. */
  addTrack: (track: Track) => void
  /** Remove a track by its position in the queue. */
  removeTrack: (index: number) => void
  /**
   * HOST ONLY — skip the current track and immediately play the next one.
   * No-op if there is no next track.
   */
  skipToNext: () => void
  /**
   * HOST ONLY — play a specific track (loads + starts + broadcasts).
   * Adds the track to the queue first if it isn't already in it.
   */
  playTrackNow: (track: Track) => void
}

export function useQueueSync({
  isHost,
  playlist,
  playbackState,
  broadcastPlayback,
  updatePlaylist,
}: UseQueueSyncOptions): UseQueueSyncReturn {
  const { play, registerOnEnd } = usePlayerStore.getState()

  // Keep a ref to the latest values so the onEnd callback never goes stale.
  const latestRef = useRef({ isHost, playlist, playbackState, broadcastPlayback, updatePlaylist, play })
  useEffect(() => {
    latestRef.current = { isHost, playlist, playbackState, broadcastPlayback, updatePlaylist, play }
  })

  // ─── Derived ────────────────────────────────────────────────────────────────
  const activeIndex = playlist.findIndex(t => t.id === playbackState.activeTrackId)
  const upNext = activeIndex >= 0 ? playlist.slice(activeIndex + 1) : playlist

  // ─── Auto-advance: register onEnd with playerStore (Host only) ───────────
  useEffect(() => {
    if (!isHost) return

    const unregister = registerOnEnd(() => {
      const { playlist: pl, playbackState: ps, broadcastPlayback: bp } = latestRef.current
      const idx = pl.findIndex(t => t.id === ps.activeTrackId)
      const next = pl[idx + 1]

      if (!next) {
        // End of queue — broadcast stopped state.
        bp({ isPlaying: false, activeTrackId: null, seekSeconds: 0 })
        usePlayerStore.getState().stop() // Ensures Host UI resets to 'No track playing'
        return
      }

      // Load and play next track locally (Host).
      usePlayerStore.getState().play(next)

      // Broadcast the new track to all guests.
      bp({ isPlaying: true, activeTrackId: next.id, seekSeconds: 0 })
    })

    return unregister
  }, [isHost, registerOnEnd])

  // ─── Public API ──────────────────────────────────────────────────────────
  const addTrack = useCallback((track: Track) => {
    // Avoid exact-ID duplicates.
    if (playlist.some(t => t.id === track.id)) return
    updatePlaylist([...playlist, track])
  }, [playlist, updatePlaylist])

  const removeTrack = useCallback((index: number) => {
    const next = playlist.filter((_, i) => i !== index)
    updatePlaylist(next)
  }, [playlist, updatePlaylist])

  const skipToNext = useCallback(() => {
    if (!isHost) return
    const { playlist: pl, playbackState: ps, broadcastPlayback: bp } = latestRef.current
    const idx = pl.findIndex(t => t.id === ps.activeTrackId)
    const next = pl[idx + 1]
    if (!next) return

    usePlayerStore.getState().play(next)
    bp({ isPlaying: true, activeTrackId: next.id, seekSeconds: 0 })
  }, [isHost])

  const playTrackNow = useCallback((track: Track) => {
    if (!isHost) return

    // Ensure the track is in the queue.
    let newPlaylist = playlist
    if (!playlist.some(t => t.id === track.id)) {
      newPlaylist = [...playlist, track]
      updatePlaylist(newPlaylist)
    }

    // Play locally.
    usePlayerStore.getState().play(track)

    // Broadcast.
    broadcastPlayback({ isPlaying: true, activeTrackId: track.id, seekSeconds: 0 })
  }, [isHost, playlist, updatePlaylist, broadcastPlayback])

  return { activeIndex, upNext, addTrack, removeTrack, skipToNext, playTrackNow }
}
