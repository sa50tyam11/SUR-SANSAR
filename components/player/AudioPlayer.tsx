'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, X,
  Radio, ExternalLink
} from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function SourceBadge({ source }: { source?: string }) {
  if (!source || source === 'local') return null
  const label = source === 'Internet Archive' ? 'IA' : source === 'Wikimedia Commons' ? 'Wiki' : source
  return (
    <span
      className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded"
      style={{ color: '#D4AF37', border: '1px solid #D4AF37', lineHeight: 1 }}
    >
      {label}
    </span>
  )
}

// ── Vinyl disc animation ──────────────────────────────────────────────────────
function VinylDisc({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative w-14 h-14 shrink-0">
      {/* Spinning outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, #D4AF37 0deg, #1a1a2e 60deg, #D4AF37 120deg, #1a1a2e 180deg, #D4AF37 240deg, #1a1a2e 300deg, #D4AF37 360deg)',
          boxShadow: isPlaying ? '0 0 16px rgba(212,175,55,0.5)' : 'none',
        }}
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner dark circle */}
      <div
        className="absolute inset-[3px] rounded-full"
        style={{ background: '#000080', border: '1px solid #D4AF37' }}
      />
      {/* Center groove rings */}
      <div className="absolute inset-[10px] rounded-full border border-[#D4AF37]/30" />
      <div className="absolute inset-[15px] rounded-full border border-[#D4AF37]/20" />
      {/* Center dot — crimson */}
      <div
        className="absolute w-3 h-3 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: '#DC143C',
          boxShadow: isPlaying ? '0 0 8px #DC143C, 0 0 20px rgba(220,20,60,0.4)' : 'none',
        }}
      />
    </div>
  )
}

// ── Waveform bars (playing indicator) ────────────────────────────────────────
function WaveformBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex gap-[2px] h-4 items-end">
      {[0.4, 0.8, 1, 0.6, 0.9, 0.5].map((amp, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-t-sm"
          style={{ background: '#DC143C' }}
          animate={isPlaying ? {
            height: [`${amp * 6}px`, `${amp * 16}px`, `${amp * 6}px`],
          } : { height: '4px' }}
          transition={{
            duration: 0.6 + i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    playlist,
    currentIndex,
    play,
    pause,
    seek,
    setVolume,
    stop,
    playNext,
    playPrev,
  } = usePlayerStore()

  const [isHoveringVolume, setIsHoveringVolume] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const lastProgressRef = useRef(0)
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Detect buffering (progress stalls while playing)
  useEffect(() => {
    // Always clear the previous timeout on every effect run
    if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current)

    if (!isPlaying) {
      setIsBuffering(false)
      return
    }
    if (progress !== lastProgressRef.current) {
      lastProgressRef.current = progress
      setIsBuffering(false)
    } else {
      bufferTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setIsBuffering(true)
      }, 3000)
    }
    return () => {
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current)
    }
  }, [progress, isPlaying])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }, [seek])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }, [setVolume])

  const toggleVolume = useCallback(() => {
    setVolume(volume === 0 ? 1 : 0)
  }, [volume, setVolume])

  const progressPct = (progress / (duration || 1)) * 100

  if (!mounted) return null

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          key="audio-player"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed bottom-0 left-0 right-0 z-[100] px-3 md:px-6 pb-3 pt-0 pointer-events-none"
        >
          {/* ── Main bar ── */}
          <div
            className="max-w-5xl mx-auto pointer-events-auto relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #000080 0%, #000060 60%, #000080 100%)',
              border: '1.5px solid #D4AF37',
              borderRadius: '12px',
              boxShadow: '0 -4px 40px rgba(0,0,128,0.6), 0 8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(212,175,55,0.2)',
            }}
          >
            {/* Gold shimmer overlay when buffering */}
            {isBuffering && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.08), transparent)',
                  zIndex: 0,
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Gold top accent line */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #D4AF37, #DC143C, #D4AF37, transparent)' }} />

            <div className="relative z-10 flex items-center gap-3 md:gap-4 p-3 md:p-4">

              {/* ── Vinyl + Track Info ── */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <VinylDisc isPlaying={isPlaying} />

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className="text-sm md:text-base font-semibold truncate"
                      style={{ color: '#FFFFFF' }}
                    >
                      {currentTrack.title}
                    </h4>
                    <SourceBadge source={currentTrack.source} />
                  </div>

                  <p className="text-xs truncate mt-0.5" style={{ color: '#D4AF37', opacity: 0.85 }}>
                    {currentTrack.artist || 'Unknown Artist'}
                    {currentTrack.instrument_type && ` • ${currentTrack.instrument_type}`}
                  </p>

                  {/* Playlist position */}
                  {playlist.length > 0 && currentIndex >= 0 && (
                    <p className="text-[10px] mt-0.5" style={{ color: '#D4AF37', opacity: 0.5 }}>
                      Track {currentIndex + 1} of {playlist.length}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Controls + Progress ── */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0 w-[280px] md:w-[360px] px-2 md:px-4">

                {/* Transport controls */}
                <div className="flex items-center gap-4 md:gap-5">
                  {/* Prev */}
                  <button
                    id="audio-player-prev"
                    onClick={playPrev}
                    disabled={playlist.length <= 1}
                    className="transition-all disabled:opacity-30"
                    style={{ color: '#D4AF37' }}
                    title="Previous track"
                  >
                    <SkipBack size={18} />
                  </button>

                  {/* Play / Pause — Crimson */}
                  <button
                    id="audio-player-play-pause"
                    onClick={() => isPlaying ? pause() : play()}
                    className="w-12 h-12 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #DC143C, #a00028)',
                      border: '2px solid #D4AF37',
                      boxShadow: isPlaying
                        ? '0 0 20px rgba(220,20,60,0.6), 0 0 40px rgba(220,20,60,0.2)'
                        : '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isBuffering ? (
                      <motion.div
                        className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : isPlaying ? (
                      <Pause size={22} className="fill-white text-white" />
                    ) : (
                      <Play size={22} className="fill-white text-white ml-0.5" />
                    )}
                  </button>

                  {/* Next */}
                  <button
                    id="audio-player-next"
                    onClick={playNext}
                    disabled={playlist.length <= 1}
                    className="transition-all disabled:opacity-30"
                    style={{ color: '#D4AF37' }}
                    title="Next track"
                  >
                    <SkipForward size={18} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full flex items-center gap-2 text-[10px] font-medium" style={{ color: '#D4AF37', opacity: 0.8 }}>
                  <span className="w-8 text-right tabular-nums">{formatTime(progress)}</span>

                  <div className="relative flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    {/* Filled portion — crimson */}
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all"
                      style={{
                        width: `${progressPct}%`,
                        background: 'linear-gradient(90deg, #DC143C, #ff1a4a)',
                        boxShadow: '0 0 6px rgba(220,20,60,0.8)',
                      }}
                    />
                    {/* Invisible range input on top for interaction */}
                    <input
                      id="audio-player-seek"
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={progress}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  <span className="w-8 tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>

              {/* ── Volume + Actions ── */}
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

                {/* Waveform indicator (md+) */}
                <div className="hidden md:flex items-center">
                  <WaveformBars isPlaying={isPlaying} />
                </div>

                {/* Volume control */}
                <div
                  className="hidden md:flex items-center gap-2"
                  onMouseEnter={() => setIsHoveringVolume(true)}
                  onMouseLeave={() => setIsHoveringVolume(false)}
                >
                  <button
                    id="audio-player-volume"
                    onClick={toggleVolume}
                    className="transition-colors"
                    style={{ color: '#D4AF37' }}
                    title={volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  <AnimatePresence>
                    {isHoveringVolume && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 70, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="overflow-hidden flex items-center"
                      >
                        <input
                          id="audio-player-volume-slider"
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-full h-1 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #D4AF37 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* External link for Internet Archive tracks */}
                {currentTrack.source && currentTrack.source !== 'local' && (
                  <a
                    href={currentTrack.audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:flex transition-colors hover:opacity-70"
                    style={{ color: '#D4AF37' }}
                    title="Open source"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}

                {/* Divider */}
                <div className="hidden md:block w-px h-6" style={{ background: 'rgba(212,175,55,0.3)' }} />

                {/* Close */}
                <button
                  id="audio-player-close"
                  onClick={stop}
                  className="p-2 rounded-full transition-all hover:opacity-80"
                  style={{ color: '#D4AF37' }}
                  title="Close player"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Source attribution line */}
            {currentTrack.source && currentTrack.source !== 'local' && (
              <div
                className="flex items-center justify-center gap-1.5 pb-2 text-[9px] tracking-widest"
                style={{ color: '#D4AF37', opacity: 0.45 }}
              >
                <Radio size={8} />
                <span>STREAMING FROM {currentTrack.source.toUpperCase()} · CC-BY</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
