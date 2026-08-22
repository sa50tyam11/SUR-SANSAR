'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Music2, Loader2, Radio, Globe } from 'lucide-react'
import { State } from '@/lib/supabase'
import { UnifiedTrack } from '@/store/usePlayerStore'
import { getTracksForState, getMoreTracksForState, markTrackInactive } from '@/lib/queries'
import { usePlayerStore } from '@/store/usePlayerStore'
import Image from 'next/image'

interface StatePanelProps {
  state: State
  onClose: () => void
}

const getRegion = (stateName: string) => {
  const name = stateName.toLowerCase()
  if (['jammu', 'kashmir', 'ladakh', 'himachal', 'punjab', 'uttarakhand', 'haryana', 'delhi', 'uttar pradesh', 'chandigarh'].some(n => name.includes(n))) return 'north'
  if (['andhra', 'karnataka', 'kerala', 'tamil', 'telangana', 'puducherry', 'lakshadweep', 'andaman'].some(n => name.includes(n))) return 'south'
  if (['rajasthan', 'gujarat', 'maharashtra', 'goa', 'daman', 'dadra'].some(n => name.includes(n))) return 'west'
  if (['bihar', 'jharkhand', 'bengal', 'odisha'].some(n => name.includes(n))) return 'east'
  if (['madhya', 'chhattisgarh'].some(n => name.includes(n))) return 'central'
  return 'northeast'
}

function SourcePill({ source }: { source?: string }) {
  if (!source || source === 'local') return null
  const isIA = source === 'Internet Archive'
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded shrink-0"
      style={{
        color: '#D4AF37',
        border: '1px solid rgba(212,175,55,0.5)',
        background: 'rgba(212,175,55,0.08)',
        lineHeight: 1,
      }}
    >
      {isIA ? <Radio size={7} /> : <Globe size={7} />}
      {isIA ? 'IA' : 'Wiki'}
    </span>
  )
}

const PAGE_SIZE = 10

export default function StatePanel({ state, onClose }: StatePanelProps) {
  const [tracks, setTracks] = useState<UnifiedTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [supabaseOffset, setSupabaseOffset] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isFetchingRef = useRef(false)

  const { play, pause, setPlaylist, playNext, currentTrack, isPlaying } = usePlayerStore()

  // ── Show toast ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setTracks([])
    setSupabaseOffset(0)
    setHasMore(true)

    getTracksForState(state.id, 0, PAGE_SIZE)
      .then(data => {
        if (!isMounted) return
        setTracks(data)
        setLoading(false)
        // If Supabase returned fewer than PAGE_SIZE, no more to load
        const supabaseTracks = data.filter(t => t.source !== 'local')
        if (supabaseTracks.length < PAGE_SIZE) setHasMore(false)
        setSupabaseOffset(supabaseTracks.length)
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [state.id])

  // ── Load more tracks (lazy) ───────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return
    isFetchingRef.current = true
    setLoadingMore(true)

    const more = await getMoreTracksForState(state.id, supabaseOffset, PAGE_SIZE)

    setTracks(prev => {
      const existingIds = new Set(prev.map(t => t.id))
      const deduped = more.filter(t => !existingIds.has(t.id))
      return [...prev, ...deduped]
    })
    setSupabaseOffset(prev => prev + more.filter(t => t.source !== 'local').length)
    if (more.filter(t => t.source !== 'local').length < PAGE_SIZE) setHasMore(false)

    setLoadingMore(false)
    isFetchingRef.current = false
  }, [state.id, supabaseOffset, hasMore])

  // ── IntersectionObserver on sentinel ─────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, loadingMore, hasMore])

  // ── Register onNeedMoreTracks when playlist is set ────────────────────────
  useEffect(() => {
    const { registerOnNeedMoreTracks, appendToPlaylist } = usePlayerStore.getState()
    const unregister = registerOnNeedMoreTracks(async () => {
      if (isFetchingRef.current || !hasMore) return
      isFetchingRef.current = true
      try {
        const more = await getMoreTracksForState(state.id, supabaseOffset, PAGE_SIZE)
        const existingIds = new Set(usePlayerStore.getState().playlist.map(t => t.id))
        const deduped = more.filter(t => !existingIds.has(t.id))
        if (deduped.length > 0) {
          appendToPlaylist(deduped)
          setTracks(prev => {
            const pIds = new Set(prev.map(t => t.id))
            return [...prev, ...deduped.filter(t => !pIds.has(t.id))]
          })
          setSupabaseOffset(prev => prev + deduped.filter(t => t.source !== 'local').length)
        }
      } finally {
        // Always release the fetch lock, even if an error occurred
        isFetchingRef.current = false
      }
    })
    return unregister
  }, [state.id, supabaseOffset, hasMore])

  // ── Track click handler ───────────────────────────────────────────────────
  const handleTrackClick = useCallback((track: UnifiedTrack, index: number) => {
    const isThisPlaying = currentTrack?.id === track.id && isPlaying
    if (isThisPlaying) {
      pause()
    } else {
      // Load the full playlist starting from this track
      setPlaylist(tracks, index)
    }
  }, [currentTrack, isPlaying, pause, setPlaylist, tracks])

  // ── Dead link handler (called by parent when player fires onloaderror) ──────
  // Note: primary dead-link handling is in usePlayerStore's onloaderror → markCurrentTrackFailed.
  // This callback is available for external callers to also remove the track from the UI list.
  const handleTrackError = useCallback(async (track: UnifiedTrack) => {
    showToast(`"${track.title}" unavailable. Skipping...`)
    if (track.source && track.source !== 'local') {
      await markTrackInactive(track.audio_url)
    }
    setTracks(prev => prev.filter(t => t.id !== track.id))
    playNext()
  }, [showToast, playNext, markTrackInactive])

  const region = getRegion(state.name_en)

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-96 shadow-2xl z-50 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #000060 0%, #000040 100%)',
        borderLeft: '1.5px solid #D4AF37',
      }}
    >
      {/* ── Header image ── */}
      <div
        className="relative h-56 shrink-0 flex flex-col justify-end p-6"
        style={{ borderBottom: '1px solid rgba(212,175,55,0.3)' }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src={`/pattern_${region}.jpg`}
            alt={state.name_en}
            fill
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000060, rgba(0,0,64,0.7) 50%, transparent)' }} />
        </div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full z-10 transition-all hover:opacity-80"
          style={{
            background: 'rgba(0,0,128,0.7)',
            border: '1px solid #D4AF37',
            color: '#D4AF37',
          }}
        >
          <X size={20} />
        </button>

        <div className="relative z-10">
          <h2
            className="text-3xl font-display text-white mb-0.5 drop-shadow-xl"
          >
            {state.name_en}
          </h2>
          <p className="text-lg tracking-wide font-medium" style={{ color: '#D4AF37' }}>
            {state.name_hi}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex-1 overflow-y-auto pb-32" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 transparent' }}>
        <p className="text-sm leading-relaxed mb-8 opacity-80" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {state.description}
        </p>

        {/* Track list header */}
        <div className="flex items-center gap-3 mb-4">
          <Music2 size={16} style={{ color: '#D4AF37' }} />
          <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>
            Regional Tracks
          </h3>
          {tracks.length > 0 && (
            <span className="ml-auto text-xs opacity-50" style={{ color: '#D4AF37' }}>
              {tracks.length}{hasMore ? '+' : ''} tracks
            </span>
          )}
        </div>

        {/* ── Loading skeleton ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-16 rounded-lg animate-pulse"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.1)' }}
              />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div
            className="p-8 rounded-xl flex flex-col items-center justify-center gap-3 text-sm"
            style={{ border: '1px dashed rgba(212,175,55,0.3)', color: 'rgba(255,255,255,0.4)' }}
          >
            <Music2 size={24} style={{ color: 'rgba(212,175,55,0.3)' }} />
            No tracks available yet.
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => {
              const isThisTrack = currentTrack?.id === track.id
              const isThisPlaying = isThisTrack && isPlaying

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  onClick={() => handleTrackClick(track, index)}
                  className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: isThisTrack
                      ? 'rgba(220,20,60,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    border: isThisTrack
                      ? '1px solid rgba(220,20,60,0.4)'
                      : '1px solid rgba(212,175,55,0.1)',
                  }}
                  onMouseEnter={e => {
                    if (!isThisTrack) {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.08)'
                      ;(e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(212,175,55,0.3)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isThisTrack) {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                      ;(e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(212,175,55,0.1)'
                    }
                  }}
                >
                  {/* Play icon / waveform */}
                  <div
                    className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                    style={{
                      background: isThisTrack ? 'rgba(220,20,60,0.2)' : 'rgba(212,175,55,0.08)',
                      border: `1px solid ${isThisTrack ? 'rgba(220,20,60,0.4)' : 'rgba(212,175,55,0.2)'}`,
                    }}
                  >
                    {isThisPlaying ? (
                      <div className="flex gap-[2px] h-3.5 items-end">
                        {[0.6, 1, 0.8].map((amp, i) => (
                          <motion.div
                            key={i}
                            className="w-[3px] rounded-t-sm"
                            style={{ background: '#DC143C' }}
                            animate={{ height: [`${amp * 5}px`, `${amp * 14}px`, `${amp * 5}px`] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Play
                        size={14}
                        className="ml-0.5 transition-colors"
                        style={{ color: isThisTrack ? '#DC143C' : '#D4AF37' }}
                      />
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4
                        className="text-sm font-medium truncate"
                        style={{ color: isThisTrack ? '#ffffff' : 'rgba(255,255,255,0.85)' }}
                      >
                        {track.title}
                      </h4>
                      <SourcePill source={track.source} />
                    </div>
                    <p className="text-xs truncate" style={{ color: 'rgba(212,175,55,0.6)' }}>
                      {track.artist || 'Unknown'}
                      {track.instrument_type ? ` • ${track.instrument_type}` : ''}
                    </p>
                  </div>

                  {/* Pause icon on hover if playing */}
                  {isThisPlaying && (
                    <Pause size={14} style={{ color: '#DC143C', flexShrink: 0 }} />
                  )}
                </motion.div>
              )
            })}

            {/* Sentinel for IntersectionObserver */}
            <div ref={sentinelRef} className="h-1" />

            {/* Loading more spinner */}
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-4" style={{ color: '#D4AF37', opacity: 0.6 }}>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs tracking-widest">Loading more tracks...</span>
              </div>
            )}

            {/* End of list */}
            {!hasMore && tracks.length > 0 && (
              <div className="flex items-center justify-center py-3 opacity-30" style={{ color: '#D4AF37' }}>
                <div className="h-px flex-1" style={{ background: '#D4AF37' }} />
                <span className="text-[9px] mx-2 tracking-widest">END</span>
                <div className="h-px flex-1" style={{ background: '#D4AF37' }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      <AnimatePresenceWrapper show={!!toast}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-4 left-4 right-4 text-xs px-4 py-3 rounded-lg text-center font-medium"
          style={{
            background: 'rgba(220,20,60,0.9)',
            border: '1px solid #D4AF37',
            color: 'white',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast}
        </motion.div>
      </AnimatePresenceWrapper>
    </motion.div>
  )
}

function AnimatePresenceWrapper({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <AnimatePresence>{show ? children : null}</AnimatePresence>
}
