/**
 * usePlayerSync.ts
 *
 * A bridge between useRoomSync (Realtime) and usePlayerStore (Howler.js).
 *
 * SEPARATION OF CONCERNS:
 *   - useRoomSync  → owns the Supabase channel, presence, playback state object
 *   - usePlayerStore → owns the Howler.js instance, local audio state
 *   - usePlayerSync → bridges the two: listens to one, drives the other
 *
 * HOST flow:
 *   Host calls playerStore.play / pause / seek as normal.
 *   This hook intercepts those state changes via a Zustand subscription
 *   and calls broadcastPlayback() so all guests receive the update.
 *
 * GUEST flow:
 *   This hook watches playbackState from useRoomSync.
 *   When it changes, it commands playerStore to match exactly,
 *   including drift-corrected seek position.
 *
 * KEY DESIGN DECISIONS:
 *   - Uses a guardRef to prevent broadcast loops:
 *     when a guest applies a received state, it must NOT re-broadcast it.
 *   - Track loading is handled by comparing activeTrackId — if the track
 *     changed, load it first, then seek+play.
 *   - Zustand subscriptions (not useEffect on store state) are used for
 *     the Host-side interception to avoid React re-render lag.
 */

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { PlaybackState, UseRoomSyncReturn } from './useRoomSync'
import { Track } from '@/lib/supabase'

interface UsePlayerSyncOptions {
  isHost: boolean
  playbackState: PlaybackState
  playlist: Track[]
  broadcastPlayback: UseRoomSyncReturn['broadcastPlayback']
}

export function usePlayerSync({
  isHost,
  playbackState,
  playlist,
  broadcastPlayback,
}: UsePlayerSyncOptions) {
  /**
   * guardRef: when TRUE, we are programmatically controlling Howler
   * as a guest applying a received broadcast. We must not re-broadcast.
   */
  const applyingBroadcastRef = useRef(false)

  /**
   * Track the last playback state we processed to avoid redundant seeks.
   */
  const lastAppliedRef = useRef<PlaybackState | null>(null)

  // ─── HOST: Intercept local Howler events → broadcast to room ───────────────
  useEffect(() => {
    if (!isHost) return

    // Subscribe to the player store and watch for changes.
    // Zustand subscribeWithSelector is not available without middleware,
    // so we use a manual subscription on the entire store.
    const unsub = usePlayerStore.subscribe((state, prevState) => {
      // Guard: don't re-broadcast if we are applying a received broadcast.
      if (applyingBroadcastRef.current) return

      const trackChanged = state.currentTrack?.id !== prevState.currentTrack?.id
      const playChanged = state.isPlaying !== prevState.isPlaying
      // Only broadcast meaningful changes, not every progress tick.
      if (!trackChanged && !playChanged) return

      const rawSeek = state.howl?.seek()
      const currentSeek = typeof rawSeek === 'number' ? rawSeek : state.progress

      broadcastPlayback({
        isPlaying: state.isPlaying,
        seekSeconds: currentSeek,
        activeTrackId: state.currentTrack?.id ?? null,
      })
    })

    return unsub
  }, [isHost, broadcastPlayback])

  // ─── GUEST: Apply received playback state → drive Howler ──────────────────
  useEffect(() => {
    if (isHost) return
    // Nothing to apply yet.
    if (playbackState.eventAt === 0) return

    const last = lastAppliedRef.current

    // Skip if this is the exact same event we already applied.
    if (last && last.eventAt === playbackState.eventAt) return
    lastAppliedRef.current = playbackState

    const store = usePlayerStore.getState()

    applyingBroadcastRef.current = true

    try {
      const trackChanged = playbackState.activeTrackId !== store.currentTrack?.id

      if (playbackState.activeTrackId === null) {
        // Host stopped everything.
        store.stop()
        return
      }

      if (trackChanged) {
        // Load the new track from the room playlist.
        const track = playlist.find(t => t.id === playbackState.activeTrackId)
        if (!track) return

        // play() will load + start the track, then we seek below.
        store.play(track)

        // Seek after a short delay to allow Howler to load.
        // We poll until howl is fully loaded before seeking.
        let attempts = 0
        const seekWhenReady = setInterval(() => {
          attempts++
          const h = usePlayerStore.getState().howl
          if (h && h.state() === 'loaded') {
            clearInterval(seekWhenReady)
            h.seek(playbackState.seekSeconds)
            if (!playbackState.isPlaying) h.pause()
          } else if (attempts > 30) {
            // 3s hard timeout — try to seek anyway if possible
            clearInterval(seekWhenReady)
            if (h && typeof h.seek === 'function') h.seek(playbackState.seekSeconds)
          }
        }, 100)
      } else {
        // Same track — just sync play/pause/seek.
        const { howl } = store

        if (!howl) return

        // Seek to corrected position.
        howl.seek(playbackState.seekSeconds)

        if (playbackState.isPlaying && !store.isPlaying) {
          store.play()
        } else if (!playbackState.isPlaying && store.isPlaying) {
          store.pause()
        }
      }
    } finally {
      // Release the guard after a tick so the store subscription above
      // doesn't catch the mutations we just made.
      setTimeout(() => {
        applyingBroadcastRef.current = false
      }, 50)
    }
  }, [isHost, playbackState, playlist])

  // ─── GUEST: Periodic drift correction ─────────────────────────────────────
  // If a guest's network hiccups for a second, they fall behind.
  // Every 5s we recalculate the expected position from the Host's last
  // eventAt timestamp and nudge howler.seek() back into alignment.
  // Tolerance is 2s — small drift is normal and jarring to snap.
  const playbackStateRef = useRef(playbackState)
  useEffect(() => { playbackStateRef.current = playbackState }, [playbackState])

  useEffect(() => {
    if (isHost) return

    const SYNC_INTERVAL_MS = 5_000
    const DRIFT_TOLERANCE_S = 2

    const id = setInterval(() => {
      const ps = playbackStateRef.current

      // Only correct while actively playing and host has sent at least one event.
      if (!ps.isPlaying || ps.eventAt === 0) return

      const store = usePlayerStore.getState()
      if (!store.howl || !store.isPlaying) return

      const actualSeek = store.howl.seek()
      if (typeof actualSeek !== 'number') return

      const elapsedSinceEvent = (Date.now() - ps.eventAt) / 1000
      const expectedSeek = ps.seekSeconds + elapsedSinceEvent
      const drift = Math.abs(actualSeek - expectedSeek)

      if (drift > DRIFT_TOLERANCE_S) {
        console.info(
          `[usePlayerSync] Drift detected: ${drift.toFixed(2)}s — resyncing to ${expectedSeek.toFixed(2)}s`
        )
        store.howl.seek(expectedSeek)
      }
    }, SYNC_INTERVAL_MS)

    return () => clearInterval(id)
  }, [isHost]) // Stable — reads latest playback state via ref

  // ─── HOST: Also broadcast seek events from the progress bar ──────────────
  // The store subscription above misses seek-only changes (progress updates
  // every second). We expose a manual seekAndBroadcast helper for the
  // Host's seek bar onChange handler.
  const seekAndBroadcast = (seconds: number) => {
    if (!isHost) return
    usePlayerStore.getState().seek(seconds)
    broadcastPlayback({ seekSeconds: seconds })
  }

  return { seekAndBroadcast }
}
