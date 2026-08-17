'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Headphones, ArrowRight, Map as MapIcon, Music, Users, Disc, MapPin, AudioLines, UsersRound, Mouse } from 'lucide-react'
import { getAllStates } from '@/lib/queries'
import { State } from '@/lib/supabase'
import IndiaMap from '@/components/map/IndiaMap'
import StatePanel from '@/components/panel/StatePanel'
import AudioPlayer from '@/components/player/AudioPlayer'
import Image from 'next/image'

export default function Home() {
  const [states, setStates] = useState<State[]>([])
  const [selectedState, setSelectedState] = useState<State | null>(null)

  useEffect(() => {
    getAllStates().then(setStates)
  }, [])

  return (
    <main className="relative h-screen bg-black overflow-hidden flex flex-col">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg-cinematic-v2.jpg" 
          alt="Indian heritage landscape" 
          fill
          priority
          className="object-cover object-center opacity-80"
        />
        {/* Gradients to blend image into the UI */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-transparent to-transparent"></div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 px-6 md:px-12 lg:px-24 pt-32 pb-4 items-center min-h-0">
        
        {/* Left Column: Text */}
        <div className="flex flex-col lg:col-span-5 pl-0">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl md:text-6xl lg:text-[5rem] font-medium text-slate-100 leading-[1.05] tracking-tight drop-shadow-2xl"
          >
            ONE INDIA.<br/>
            <span className="text-[#D6A95B]">ENDLESS SOULS.</span>
          </motion.h1>
          
          <div className="flex items-center gap-3 mt-6 mb-5 opacity-80">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#D6A95B]/60"></div>
            <div className="text-[#D6A95B]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" opacity="0.9" />
              </svg>
            </div>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#D6A95B]/60"></div>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-200 text-base md:text-lg font-light mb-8 max-w-md leading-relaxed drop-shadow-md"
          >
            Explore the rich, diverse and vibrant music<br/>from every state of India.<br/>
            Select a state and let the music tell its story.
          </motion.p>

          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => {
              if (states.length > 0) {
                const randomState = states[Math.floor(Math.random() * states.length)]
                setSelectedState(randomState)
              }
            }}
            className="flex items-center gap-4 bg-[#D6A95B] hover:brightness-110 text-slate-900 px-6 py-3 rounded-sm w-max font-semibold text-xs tracking-widest transition-all shadow-xl cursor-pointer pointer-events-auto"
          >
            <MapIcon size={16} strokeWidth={2.5} />
            EXPLORE STATES
            <ArrowRight size={16} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Right Column: Map */}
        <div className="relative w-full h-[70vh] min-h-0 flex items-center justify-center lg:col-span-7">
          <IndiaMap 
            states={states} 
            selectedStateId={selectedState?.id || null} 
            onStateSelect={setSelectedState} 
          />
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-24 pb-8 flex flex-col items-center mt-auto shrink-0 pointer-events-none">
        
        {/* Ornate subtle border above stats */}
        <div className="w-full max-w-[80rem] flex items-center justify-center opacity-30 mb-8 pointer-events-none">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D6A95B]"></div>
          <div className="text-[#D6A95B] mx-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D6A95B]"></div>
        </div>

        <div className="w-full max-w-[70rem] flex flex-wrap md:flex-nowrap items-center justify-between gap-6 relative">
          
          {/* Stat 1 */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            <div className="w-12 h-12 rounded-full border border-[#D6A95B]/40 flex items-center justify-center text-[#D6A95B]">
              <Music size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <div className="text-xl lg:text-2xl font-display text-slate-100 leading-none mb-1">28</div>
              <div className="text-[#D6A95B]/80 text-[9px] tracking-[0.15em] uppercase font-medium">States<br/>8 Union Territories</div>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-[#D6A95B]/20"></div>

          {/* Stat 2 */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            <div className="w-12 h-12 rounded-full border border-[#D6A95B]/40 flex items-center justify-center text-[#D6A95B]">
              {/* Inline Sitar SVG to match design perfectly */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="16" r="4" />
                <path d="M18 4l2 2" />
                <path d="M12.5 11.5L20 4" />
                <path d="M10.5 13.5L18 6" />
                <circle cx="19" cy="5" r="1" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="text-xl lg:text-2xl font-display text-slate-100 leading-none mb-1">700+</div>
              <div className="text-[#D6A95B]/80 text-[9px] tracking-[0.15em] uppercase font-medium">Folk & Traditional<br/>Songs</div>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-[#D6A95B]/20"></div>

          {/* Stat 3 */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            <div className="w-12 h-12 rounded-full border border-[#D6A95B]/40 flex items-center justify-center text-[#D6A95B]">
              <Users size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <div className="text-xl lg:text-2xl font-display text-slate-100 leading-none mb-1">120+</div>
              <div className="text-[#D6A95B]/80 text-[9px] tracking-[0.15em] uppercase font-medium">Artists &<br/>Communities</div>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-[#D6A95B]/20"></div>

          {/* Stat 4 */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            <div className="w-12 h-12 rounded-full border border-[#D6A95B]/40 flex items-center justify-center text-[#D6A95B]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="text-xl lg:text-2xl font-display text-slate-100 leading-none mb-1">10K+</div>
              <div className="text-[#D6A95B]/80 text-[9px] tracking-[0.15em] uppercase font-medium">Listeners &<br/>Growing</div>
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {selectedState && (
          <StatePanel 
            state={selectedState} 
            onClose={() => setSelectedState(null)} 
          />
        )}
      </AnimatePresence>

      <AudioPlayer />
    </main>
  )
}
