'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Headphones, ArrowRight, Map as MapIcon, Music, Users, Disc, MapPin, AudioLines, UsersRound, Mouse, Search } from 'lucide-react'
import { getAllStates } from '@/lib/queries'
import { State } from '@/lib/supabase'
import IndiaMap from '@/components/map/IndiaMap'
import StatePanel from '@/components/panel/StatePanel'
import AudioPlayer from '@/components/player/AudioPlayer'
import Image from 'next/image'

export default function Home() {
  const [states, setStates] = useState<State[]>([])
  const [selectedState, setSelectedState] = useState<State | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isStatesOpen, setIsStatesOpen] = useState(false)

  useEffect(() => {
    getAllStates().then(setStates)
  }, [])

  return (
    <main className="relative h-screen bg-black overflow-hidden flex flex-col">
      {/* Interactive Header */}
      <header className="absolute top-0 w-full z-50 px-6 md:px-12 lg:px-24 py-4 md:py-6 flex items-center justify-between pointer-events-none bg-black/30 backdrop-blur-md border-b border-white/10 shadow-2xl">
        
        {/* Logo */}
        <div className="flex items-center gap-3 md:gap-5 pointer-events-auto group cursor-pointer w-1/3 text-white">
          {/* Indian Flag */}
          <div className="relative w-10 h-7 md:w-12 md:h-8 rounded-sm overflow-hidden shadow-lg border border-white/20 opacity-95 shrink-0 hover:scale-105 transition-transform">
            <Image 
              src="/indflag.jpg"
              alt="Indian Flag"
              fill
              className="object-cover"
            />
          </div>

          {/* Star Logo */}
          <div className="w-8 h-8 md:w-10 md:h-10 text-[#D6A95B] group-hover:rotate-90 transition-transform duration-700 ease-in-out hidden sm:block shrink-0">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0L55 35L90 10L65 45L100 50L65 55L90 90L55 65L50 100L45 65L10 90L35 55L0 50L35 45L10 10L45 35Z" />
              <circle cx="50" cy="50" r="15" fill="transparent" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="5" fill="currentColor" />
            </svg>
          </div>
          
          {/* Text Logo */}
          <div className="flex flex-col ml-1">
            <h1 className="text-4xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-white to-white leading-none drop-shadow-md" style={{ fontFamily: 'var(--font-rozha)' }}>
              सुर <span className="text-[#D6A95B] text-2xl px-2 drop-shadow-none font-sans">•</span> संसार
            </h1>
            <p className="text-[#94a3b8] text-[0.65rem] font-sans tracking-[0.25em] mt-1.5 ml-1 uppercase">
              Music of every state
            </p>
          </div>
        </div>

        {/* Center Navigation */}
        <div className="hidden lg:flex items-center gap-8 pointer-events-auto flex-1 justify-center lg:pl-16">
          <div className="flex items-center gap-8 font-sans text-slate-300 text-sm font-semibold tracking-widest drop-shadow-sm">
            <button className="text-[#D6A95B] transition-colors duration-300 relative group flex flex-col items-center">
              HOME
              <span className="absolute -bottom-2 w-8 h-px bg-[#D6A95B]"></span>
              <span className="absolute -bottom-2.5 w-1 h-1 rounded-full bg-[#D6A95B]"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => {
                  setIsStatesOpen(!isStatesOpen);
                  setIsSearchOpen(false);
                }}
                className="hover:text-[#D6A95B] transition-colors duration-300"
              >
                STATES
              </button>
              {isStatesOpen && (
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 bg-black/60 backdrop-blur-xl rounded-md shadow-2xl p-2 z-50 max-h-80 overflow-y-auto border border-white/10">
                  <div className="grid grid-cols-1 gap-1">
                    {states.map(state => (
                      <button 
                        key={state.id}
                        onClick={() => {
                          setSelectedState(state);
                          setIsStatesOpen(false);
                        }}
                        className="text-left px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white text-sm font-medium rounded transition-colors"
                      >
                        {state.name_en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="hover:text-[#D6A95B] transition-colors duration-300">COMMUNITY</button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-6 pointer-events-auto text-white w-1/3 drop-shadow-md">
          <button 
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsStatesOpen(false);
            }}
            className="hover:opacity-80 transition-opacity"
          >
            <Search size={22} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 w-full bg-black/60 backdrop-blur-xl shadow-2xl border-b border-white/10 p-6 z-40 pointer-events-auto"
          >
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search for a state (e.g., Bengal, Punjab...)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D6A95B] text-lg border border-white/10"
                  autoFocus
                />
              </div>
              
              {/* Search Results */}
              {searchQuery && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {states.filter(s => (s.name_en || '').toLowerCase().includes(searchQuery.toLowerCase())).map(state => (
                    <button
                      key={state.id}
                      onClick={() => {
                        setSelectedState(state);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="text-left px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-md shadow-sm border border-white/5 transition-colors flex items-center justify-between group"
                    >
                      <span className="font-medium">{state.name_en}</span>
                      <ArrowRight size={14} className="text-[#D6A95B] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {states.filter(s => (s.name_en || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400 font-medium">
                      No states found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="font-[family-name:var(--font-great-vibes)] text-6xl md:text-7xl lg:text-[5.5rem] font-normal text-slate-100 leading-[1.15] tracking-normal drop-shadow-2xl pr-4"
          >
            One Bharat.<br />
            <span className="text-[#D6A95B]">Endless Souls.</span>
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
            Explore the rich, diverse and vibrant music<br />from every state of India.<br />
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
        <div className="relative w-full h-[65vh] min-h-0 flex items-center justify-center lg:col-span-7 mt-8 lg:mt-6">
          <IndiaMap
            states={states}
            selectedStateId={selectedState?.id || null}
            onStateSelect={setSelectedState}
          />
        </div>
      </div>

      {/* Bottom Right Identity Text */}
      <div className="absolute bottom-10 right-10 md:bottom-12 md:right-16 z-20 flex flex-col items-end pointer-events-none drop-shadow-2xl opacity-90">
        <div className="text-xl md:text-2xl font-medium text-slate-100 mb-2">संगीत ही हमारी पहचान है</div>
        <div className="flex items-center gap-3">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#D6A95B]"></div>
          <div className="text-[#D6A95B] text-[10px] tracking-[0.25em] font-medium uppercase">MUSIC IS OUR IDENTITY</div>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#D6A95B]"></div>
        </div>
        <div className="mt-2 text-[#D6A95B] opacity-70">
          <svg width="20" height="20" viewBox="0 0 100 100" fill="currentColor" className="mx-auto">
            <path d="M50 20 L55 45 L80 50 L55 55 L50 80 L45 55 L20 50 L45 45 Z" />
          </svg>
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
