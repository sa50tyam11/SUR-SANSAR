'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Play, Pause, Music2 } from 'lucide-react'
import { State, Track } from '@/lib/supabase'
import { getTracksForState } from '@/lib/queries'
import { usePlayerStore } from '@/store/usePlayerStore'

interface StatePanelProps {
  state: State
  onClose: () => void
}

export default function StatePanel({ state, onClose }: StatePanelProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  
  const { play, pause, currentTrack, isPlaying } = usePlayerStore()

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    
    getTracksForState(state.id).then(data => {
      if (isMounted) {
        setTracks(data)
        setLoading(false)
      }
    })

    return () => { isMounted = false }
  }, [state.id])

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-96 bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-50 flex flex-col"
    >
      <div className="p-6 border-b border-slate-800/60 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <div>
          <h2 className="text-3xl font-display text-[#D6A95B] mb-1 drop-shadow-md">{state.name_en}</h2>
          <p className="text-slate-400 font-sans text-lg">{state.name_hi}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar pb-32">
        <p className="text-slate-300 leading-relaxed mb-10 text-sm md:text-base opacity-90">
          {state.description}
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Music2 size={18} className="text-[#D6A95B]" />
            <h3 className="text-sm font-semibold tracking-widest text-slate-200 uppercase">
              Regional Tracks
            </h3>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-sm">
              No tracks available for this region yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map(track => {
                const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying
                
                return (
                  <div 
                    key={track.id}
                    className={`group p-3 rounded-lg border transition-all duration-300 flex items-center gap-4 cursor-pointer hover:bg-slate-800/50
                      ${currentTrack?.id === track.id ? 'border-[#D6A95B]/50 bg-slate-800/30' : 'border-slate-800/30 bg-transparent'}
                    `}
                    onClick={() => {
                      if (isThisTrackPlaying) {
                        pause()
                      } else {
                        play(track)
                      }
                    }}
                  >
                    <div className="relative w-10 h-10 rounded bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {isThisTrackPlaying ? (
                        <div className="flex gap-[2px] h-4 items-end">
                          <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-[#D6A95B] rounded-t"></motion.div>
                          <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-[#D6A95B] rounded-t"></motion.div>
                          <motion.div animate={{ height: [6, 10, 6] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-[#D6A95B] rounded-t"></motion.div>
                        </div>
                      ) : (
                        <Play size={16} className={`ml-0.5 ${currentTrack?.id === track.id ? 'text-[#D6A95B]' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                      )}
                    </div>
                    
                    <div className="flex-1 truncate">
                      <h4 className={`text-sm font-medium truncate transition-colors ${currentTrack?.id === track.id ? 'text-[#D6A95B]' : 'text-slate-200 group-hover:text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {track.artist} • {track.instrument_type}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
