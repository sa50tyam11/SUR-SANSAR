'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Play, Pause, Volume2, VolumeX, SkipForward, SkipBack,
  X, Copy, Check, ArrowLeft, Loader2, Music2, Users,
  Crown, WifiOff, ListMusic, Plus, Trash2, ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRoomSync } from '@/hooks/useRoomSync'
import { usePlayerSync } from '@/hooks/usePlayerSync'
import { useQueueSync } from '@/hooks/useQueueSync'
import { usePlayerStore } from '@/store/usePlayerStore'
import { getAllStates, getTracksForState } from '@/lib/queries'
import { Track, State } from '@/lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (s: number) => {
  if (isNaN(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function StatusDot({ status }: { status: string }) {
  const cls: Record<string, string> = {
    connecting: 'bg-community-gold animate-pulse',
    connected: 'bg-emerald-400',
    disconnected: 'bg-slate-600',
    error: 'bg-red-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${cls[status] ?? 'bg-slate-600'}`} />
}

// ─── Animated music bars (same pattern as StatePanel) ─────────────────────────
function MusicBars() {
  return (
    <div className="flex gap-[2px] h-4 items-end">
      <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-community-gold rounded-t" />
      <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-community-gold rounded-t" />
      <motion.div animate={{ height: [6, 10, 6] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-community-gold rounded-t" />
    </div>
  )
}

// ─── Track Row (same structure as StatePanel track rows) ──────────────────────
function TrackRow({
  track,
  isActive,
  isPlaying,
  action,
  actionIcon,
  onClick,
}: {
  track: Track
  isActive?: boolean
  isPlaying?: boolean
  action?: () => void
  actionIcon?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`group p-3 rounded-lg border transition-all duration-300 flex items-center gap-3
        ${onClick ? 'cursor-pointer hover:bg-slate-800/50' : ''}
        ${isActive ? 'border-community-gold/50 bg-slate-800/30' : 'border-slate-800/30 bg-transparent'}`}
    >
      {/* Icon / bars */}
      <div className="relative w-9 h-9 rounded bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-700/50">
        {isActive && isPlaying ? (
          <MusicBars />
        ) : (
          <Play size={13} className={`ml-0.5 transition-colors ${isActive ? 'text-community-gold' : 'text-slate-400 group-hover:text-white'}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 truncate">
        <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-community-gold' : 'text-slate-200 group-hover:text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {track.artist}{track.instrument_type ? ` • ${track.instrument_type}` : ''}
        </p>
      </div>

      {/* Optional action button */}
      {action && (
        <button
          onClick={e => { e.stopPropagation(); action() }}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all p-1 rounded"
        >
          {actionIcon}
        </button>
      )}
    </div>
  )
}

// ─── Room Page ─────────────────────────────────────────────────────────────────
export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuthStore()

  // ── Realtime
  const { users, isHost, playlist, playbackState, connectionStatus, roomClosed, broadcastPlayback, updatePlaylist } =
    useRoomSync(roomId)

  // ── Howler ↔ Realtime bridge
  const { seekAndBroadcast } = usePlayerSync({ isHost, playbackState, playlist, broadcastPlayback })

  // ── Queue management + auto-advance
  const { upNext, addTrack, removeTrack, skipToNext, playTrackNow } = useQueueSync({
    isHost, playlist, playbackState, broadcastPlayback, updatePlaylist,
  })

  // ── Local Howler state (for Host UI)
  const { currentTrack, isPlaying, progress, duration, volume, play, pause, setVolume, stop } = usePlayerStore()

  // ── Track browser state
  const [states, setStates] = useState<State[]>([])
  const [selectedStateId, setSelectedStateId] = useState<string>('')
  const [browserTracks, setBrowserTracks] = useState<Track[]>([])
  const [loadingBrowser, setLoadingBrowser] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)

  // ── Right panel tab: 'queue' | 'users'
  const [rightTab, setRightTab] = useState<'queue' | 'users'>('queue')

  // ── UI state
  const [isHoveringVolume, setIsHoveringVolume] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'warn' } | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Stop audio and clean up on unmount
  useEffect(() => {
    return () => { usePlayerStore.getState().stop() }
  }, [])

  // Toast when this client is promoted to Host
  useEffect(() => {
    if (isHost && users.length > 0) {
      const me = users.find(u => u.user_id === user?.id)
      if (me?.is_host) {
        showToast('You are now the Host — you control playback.', 'info')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost])

  // Redirect if not authed
  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/community')
  }, [user, isAuthLoading, router])

  const showToast = useCallback((message: string, type: 'info' | 'warn' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Load state list once
  useEffect(() => {
    getAllStates().then(setStates)
  }, [])

  // Load tracks when state selected in browser
  useEffect(() => {
    if (!selectedStateId) return
    setLoadingBrowser(true)
    getTracksForState(selectedStateId).then(tracks => {
      setBrowserTracks(tracks)
      setLoadingBrowser(false)
    })
  }, [selectedStateId])

  const copyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/community/${roomId}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [roomId])

  const handleLeaveRoom = useCallback(() => {
    stop()
    router.push('/community')
  }, [stop, router])

  const handleTogglePlayPause = useCallback(() => {
    const rawSeek = usePlayerStore.getState().howl?.seek()
    const pos = typeof rawSeek === 'number' ? rawSeek : progress
    if (isPlaying) {
      pause()
      broadcastPlayback({ isPlaying: false, seekSeconds: pos })
    } else {
      play()
      broadcastPlayback({ isPlaying: true, seekSeconds: pos })
    }
  }, [isPlaying, pause, play, progress, broadcastPlayback])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    seekAndBroadcast(Number(e.target.value))
  }, [seekAndBroadcast])

  // Derive the track object that guests are listening to
  const activeTrack = isHost ? currentTrack : (playlist.find(t => t.id === playbackState.activeTrackId) ?? null)
  const activeIsPlaying = isHost ? isPlaying : playbackState.isPlaying
  const activeProgress = isHost ? progress : playbackState.seekSeconds

  if (!mounted || isAuthLoading || !user) {
    return (
      <main className="h-screen bg-community-canvas flex items-center justify-center">
        <Loader2 className="animate-spin text-community-gold" size={40} />
      </main>
    )
  }

  // ── Room Closed Overlay ────────────────────────────────────────────────────
  if (roomClosed) {
    return (
      <main className="relative h-screen bg-community-canvas overflow-hidden flex flex-col items-center justify-center gap-6">
        <div className="absolute inset-0 z-0">
          <Image src="/bg-warm-sunset.jpg" alt="bg" fill className="object-cover opacity-10" />
          <div className="absolute inset-0 bg-community-canvas/90" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={28} className="text-community-gold" />
          </div>
          <h2 className="text-3xl font-display text-white mb-2">Room Ended</h2>
          <p className="text-slate-400 text-sm mb-8">The host left and the session has closed.</p>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 bg-community-crimson text-white font-semibold text-sm px-6 py-3 rounded-lg hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(220,20,60,0.35)]"
          >
            <ArrowLeft size={16} />
            Back to Community
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="relative h-screen bg-community-canvas overflow-hidden flex flex-col">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/bg-warm-sunset.jpg" alt="Room background" fill priority className="object-cover object-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-community-canvas/95 via-community-canvas/70 to-community-canvas/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-community-canvas via-transparent to-community-canvas/80" />
      </div>

      {/* ── Toast notifications ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-community-canvas/95 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-3 shadow-2xl"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'warn' ? 'bg-amber-400' : 'bg-community-gold'}`} />
            <p className="text-sm text-slate-200 font-medium">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-50 px-6 md:px-10 py-4 flex items-center justify-between bg-community-canvas/70 backdrop-blur-md border-b border-white/10 shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/community" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold tracking-widest uppercase hidden sm:block">Back</span>
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[#94a3b8] text-[0.6rem] font-sans tracking-[0.25em] uppercase">Live Room</span>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusDot status={connectionStatus} />
              <span className="text-white font-mono text-sm tracking-widest font-medium">{roomId}</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="w-7 h-7 text-community-gold">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0L55 35L90 10L65 45L100 50L65 55L90 90L55 65L50 100L45 65L10 90L35 55L0 50L35 45L10 10L45 35Z" />
              <circle cx="50" cy="50" r="15" fill="transparent" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-white to-white" style={{ fontFamily: 'var(--font-rozha)' }}>
            सुर • संसार
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 bg-community-canvas/60 hover:bg-community-canvas border border-white/10 hover:border-community-gold/30 text-slate-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-lg transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span className="hidden sm:block">{copied ? 'Copied!' : 'Invite'}</span>
          </button>
          <div className="flex items-center gap-1.5 bg-community-canvas/60 border border-white/10 px-3 py-2 rounded-lg">
            <Users size={14} className="text-community-gold" />
            <span className="text-slate-200 text-xs font-semibold">{users.length}</span>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: Player ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/10 min-w-0">

          {/* Now Playing */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 min-h-0">

            {/* Spinning disc */}
            <motion.div
              animate={{ rotate: activeIsPlaying ? 360 : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
              style={{ animationPlayState: activeIsPlaying ? 'running' : 'paused' }}
              className="w-40 h-40 md:w-52 md:h-52 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-2xl shadow-[0_0_60px_rgba(212,175,55,0.12)] mb-6 shrink-0 relative overflow-hidden"
            >
              <div className="absolute inset-2 rounded-full border border-community-gold/20" />
              <div className="absolute inset-6 rounded-full bg-community-canvas/60" />
              <div className="w-8 h-8 rounded-full bg-community-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.5)] z-10">
                <div className="w-2 h-2 rounded-full bg-community-canvas" />
              </div>
              <div className="absolute inset-0 rounded-full" style={{ background: 'repeating-radial-gradient(circle, transparent 0, transparent 6px, rgba(255,255,255,0.015) 7px, transparent 7px)' }} />
            </motion.div>

            {/* Track info */}
            <div className="text-center mb-6 w-full max-w-sm">
              {activeTrack ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-display text-white mb-1 drop-shadow-xl truncate">{activeTrack.title}</h2>
                  <p className="text-community-gold text-base font-medium truncate">
                    {activeTrack.artist}
                    {activeTrack.instrument_type && <span className="text-slate-500 font-normal"> • {activeTrack.instrument_type}</span>}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-display text-slate-500 mb-1">No track playing</h2>
                  <p className="text-slate-600 text-sm">
                    {isHost ? 'Add a track below to start the session' : 'Waiting for the host to start…'}
                  </p>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="w-full max-w-md">
              {/* Progress bar */}
              <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-medium mb-5">
                <span className="w-10 text-right">{formatTime(activeProgress)}</span>
                <input
                  type="range" min="0" max={duration || 0} value={activeProgress}
                  onChange={isHost ? handleSeek : undefined}
                  disabled={!isHost}
                  className={`flex-1 h-1 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-community-gold ${isHost ? 'cursor-pointer' : 'cursor-default opacity-60 pointer-events-none'}`}
                  style={{ background: `linear-gradient(to right, #D4AF37 ${(activeProgress / (duration || 1)) * 100}%, #1e293b ${(activeProgress / (duration || 1)) * 100}%)` }}
                />
                <span className="w-10">{formatTime(duration)}</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-6">
                <button disabled className="text-slate-700 disabled:cursor-not-allowed">
                  <SkipBack size={22} />
                </button>

                <button
                  onClick={isHost ? handleTogglePlayPause : undefined}
                  disabled={!isHost}
                  title={!isHost ? 'Only the host can control playback' : undefined}
                  className={`w-14 h-14 flex items-center justify-center rounded-full transition-all
                    ${isHost
                      ? 'bg-community-crimson text-white hover:scale-105 hover:brightness-110 shadow-[0_4px_20px_rgba(220,20,60,0.35)]'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  {activeIsPlaying
                    ? <Pause size={26} className={isHost ? 'fill-white' : 'fill-slate-600'} />
                    : <Play size={26} className={`${isHost ? 'fill-white' : 'fill-slate-600'} ml-1`} />}
                </button>

                {/* Skip Forward — now wired to queue */}
                <button
                  onClick={isHost ? skipToNext : undefined}
                  disabled={!isHost || upNext.length === 0}
                  title={!isHost ? 'Only the host can skip' : upNext.length === 0 ? 'Nothing up next' : 'Skip to next'}
                  className={`transition-colors ${isHost && upNext.length > 0 ? 'text-slate-400 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
                >
                  <SkipForward size={22} />
                </button>
              </div>

              {!isHost && (
                <p className="text-center text-community-gold/60 text-[0.65rem] tracking-[0.2em] uppercase mt-5">
                  Listen-only · Host controls playback
                </p>
              )}

              {/* Volume */}
              <div
                className="flex items-center justify-center gap-3 mt-5"
                onMouseEnter={() => setIsHoveringVolume(true)}
                onMouseLeave={() => setIsHoveringVolume(false)}
              >
                <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-slate-400 hover:text-white transition-colors">
                  {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <AnimatePresence>
                  {isHoveringVolume && (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 100, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden flex items-center h-6">
                      <input
                        type="range" min="0" max="1" step="0.01" value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        style={{ background: `linear-gradient(to right, white ${volume * 100}%, #1e293b ${volume * 100}%)` }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Track Browser (bottom of left panel) ──────────────────────── */}
          <div className="border-t border-white/10 bg-community-canvas/70 backdrop-blur-sm shrink-0">
            {/* Browser toggle header */}
            <button
              onClick={() => setBrowserOpen(v => !v)}
              className="w-full px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <Plus size={15} className="text-community-gold" />
              <span className="text-xs font-semibold tracking-widest text-slate-200 uppercase flex-1 text-left">
                Add Track to Queue
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform duration-300 ${browserOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {browserOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 260 }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {/* State selector */}
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <select
                      value={selectedStateId}
                      onChange={e => setSelectedStateId(e.target.value)}
                      className="w-full bg-community-canvas/60 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-community-gold/50"
                    >
                      <option value="">Select a state to browse…</option>
                      {states.map(s => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                    </select>
                  </div>

                  {/* Track list */}
                  <div className="overflow-y-auto px-4 pb-3 space-y-2" style={{ maxHeight: 200 }}>
                    {!selectedStateId ? (
                      <p className="text-slate-600 text-xs text-center py-4">Pick a state above.</p>
                    ) : loadingBrowser ? (
                      [1, 2].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />)
                    ) : browserTracks.length === 0 ? (
                      <p className="text-slate-600 text-xs text-center py-4">No tracks available.</p>
                    ) : browserTracks.map(track => {
                      const inQueue = playlist.some(t => t.id === track.id)
                      const isActive = track.id === playbackState.activeTrackId
                      return (
                        <TrackRow
                          key={track.id}
                          track={track}
                          isActive={isActive}
                          isPlaying={isActive && activeIsPlaying}
                          onClick={isHost ? () => playTrackNow(track) : undefined}
                          action={!inQueue ? () => addTrack(track) : undefined}
                          actionIcon={<Plus size={14} />}
                        />
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT PANEL: Queue + Users ──────────────────────────────────── */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.15 }}
          className="w-72 hidden lg:flex flex-col bg-community-canvas/90 backdrop-blur-xl border-l border-white/10"
        >
          {/* Tab bar */}
          <div className="flex border-b border-white/10 shrink-0">
            {(['queue', 'users'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-semibold tracking-widest uppercase transition-colors
                  ${rightTab === tab ? 'text-community-gold border-b border-community-gold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab === 'queue' ? <ListMusic size={14} /> : <Users size={14} />}
                {tab === 'queue' ? `Queue (${playlist.length})` : `Room (${users.length})`}
              </button>
            ))}
          </div>

          {/* Connection banner */}
          {connectionStatus !== 'connected' && (
            <div className="mx-4 mt-3 flex items-center gap-2 bg-community-gold/10 border border-community-gold/20 rounded-lg px-3 py-2">
              {connectionStatus === 'error'
                ? <WifiOff size={14} className="text-red-400 shrink-0" />
                : <Loader2 size={14} className="animate-spin text-community-gold shrink-0" />}
              <span className="text-xs text-community-gold capitalize">{connectionStatus}…</span>
            </div>
          )}

          {/* ── Queue Tab ───────────────────────────────────────────────── */}
          {rightTab === 'queue' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
              {playlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <ListMusic size={32} className="text-slate-700 mb-3" />
                  <p className="text-slate-600 text-sm">Queue is empty</p>
                  <p className="text-slate-700 text-xs mt-1">
                    {isHost ? 'Add tracks from the browser below' : 'Ask the host to add tracks'}
                  </p>
                </div>
              ) : playlist.map((track, idx) => {
                const isActive = track.id === playbackState.activeTrackId
                const isPast = !isActive && playlist.findIndex(t => t.id === playbackState.activeTrackId) > idx
                return (
                  <div key={`${track.id}-${idx}`} className={`transition-opacity ${isPast ? 'opacity-40' : 'opacity-100'}`}>
                    {/* Section label */}
                    {isActive && (
                      <p className="text-community-gold text-[0.6rem] font-semibold tracking-[0.2em] uppercase mb-1 px-1">
                        ♪ Now Playing
                      </p>
                    )}
                    {idx === playlist.findIndex(t => t.id === playbackState.activeTrackId) + 1 && playlist.some(t => t.id === playbackState.activeTrackId) && (
                      <p className="text-slate-600 text-[0.6rem] font-semibold tracking-[0.2em] uppercase mb-1 px-1 mt-3">
                        Up Next
                      </p>
                    )}
                    <TrackRow
                      track={track}
                      isActive={isActive}
                      isPlaying={isActive && activeIsPlaying}
                      onClick={isHost && !isActive ? () => playTrackNow(track) : undefined}
                      action={() => removeTrack(idx)}
                      actionIcon={<Trash2 size={13} />}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Users Tab ───────────────────────────────────────────────── */}
          {rightTab === 'users' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {users.length === 0 ? (
                <div className="p-8 text-center text-slate-600 text-sm">Waiting for listeners…</div>
              ) : users.map(u => (
                <div
                  key={u.user_id}
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-colors
                    ${u.is_host ? 'border-community-gold/30 bg-slate-800/20' : 'border-slate-800/30'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                    ${u.is_host ? 'bg-community-gold/20 text-community-gold border border-community-gold/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {u.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={`text-sm font-medium truncate ${u.is_host ? 'text-community-gold' : 'text-slate-200'}`}>
                      {u.display_name}{u.user_id === user.id && <span className="text-slate-500 font-normal"> (you)</span>}
                    </p>
                    <p className="text-[0.65rem] text-slate-600 tracking-wider uppercase mt-0.5">
                      {u.is_host ? 'Host' : 'Listening'}
                    </p>
                  </div>
                  {u.is_host && <Crown size={13} className="text-community-gold shrink-0" />}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                </div>
              ))}
            </div>
          )}

          {/* Leave room */}
          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              onClick={handleLeaveRoom}
              className="w-full flex items-center justify-center gap-2 bg-community-canvas/60 hover:bg-community-canvas border border-white/10 hover:border-community-crimson/30 text-slate-400 hover:text-community-crimson text-xs font-semibold tracking-widest uppercase py-3 rounded-lg transition-all"
            >
              <X size={14} />
              Leave Room
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
