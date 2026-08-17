'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, X } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'

// Helper to format time (e.g., 65 -> "1:05")
const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AudioPlayer() {
  const { currentTrack, isPlaying, progress, duration, volume, play, pause, seek, setVolume, stop } = usePlayerStore()
  const [isHoveringVolume, setIsHoveringVolume] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  const toggleVolume = () => {
    if (volume === 0) setVolume(1)
    else setVolume(0)
  }

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] px-4 md:px-8 pb-4 pt-0 pointer-events-none"
        >
          <div className="max-w-5xl mx-auto bg-black/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex items-center p-4 md:p-5 pointer-events-auto shadow-[0_10px_40px_rgba(214,169,91,0.1)]">
            
            {/* Track Info */}
            <div className="flex-1 flex items-center gap-4 truncate">
              <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden relative group">
                <div className="absolute inset-0 bg-[#D6A95B]/20 group-hover:bg-[#D6A95B]/40 transition-colors"></div>
                <div className="w-4 h-4 rounded-full bg-[#D6A95B] flex items-center justify-center shadow-[0_0_10px_#D6A95B]">
                  <div className="w-1 h-1 rounded-full bg-black"></div>
                </div>
              </div>
              <div className="flex flex-col truncate">
                <h4 className="text-white font-medium text-sm md:text-base truncate">{currentTrack.title}</h4>
                <p className="text-slate-400 text-xs md:text-sm truncate">{currentTrack.artist} • {currentTrack.instrument_type}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col items-center max-w-lg px-4 md:px-8">
              <div className="flex items-center gap-6 mb-2">
                <button className="text-slate-400 hover:text-white transition-colors disabled:opacity-50" disabled>
                  <SkipBack size={20} />
                </button>
                
                <button 
                  onClick={() => isPlaying ? pause() : play()}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[#D6A95B] text-black hover:scale-105 hover:bg-[#ebd097] transition-all"
                >
                  {isPlaying ? (
                    <Pause size={24} className="fill-black" />
                  ) : (
                    <Play size={24} className="fill-black ml-1" />
                  )}
                </button>
                
                <button className="text-slate-400 hover:text-white transition-colors disabled:opacity-50" disabled>
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-medium">
                <span className="w-10 text-right">{formatTime(progress)}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 0}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D6A95B]"
                  style={{
                    background: `linear-gradient(to right, #D6A95B ${(progress / (duration || 1)) * 100}%, #1e293b ${(progress / (duration || 1)) * 100}%)`
                  }}
                />
                <span className="w-10">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume & Extras */}
            <div className="flex-1 flex justify-end items-center gap-2 md:gap-4">
              <div 
                className="hidden md:flex items-center gap-3"
                onMouseEnter={() => setIsHoveringVolume(true)}
                onMouseLeave={() => setIsHoveringVolume(false)}
              >
                <button onClick={toggleVolume} className="text-slate-400 hover:text-white transition-colors">
                  {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <AnimatePresence>
                  {isHoveringVolume && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 80, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="overflow-hidden flex items-center h-8"
                    >
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        style={{
                          background: `linear-gradient(to right, white ${volume * 100}%, #1e293b ${volume * 100}%)`
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="hidden md:block w-px h-6 bg-slate-800 ml-2"></div>
              
              <button 
                onClick={stop}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all p-2"
                title="Close Player"
              >
                <X size={20} />
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
