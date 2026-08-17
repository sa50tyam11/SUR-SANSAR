'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatePath from './StatePath'
import { State } from '@/lib/supabase'
import { Play } from 'lucide-react'
import IndiaMapData from '@svg-maps/india'

interface IndiaMapProps {
  states: State[]
  selectedStateId: string | null
  onStateSelect: (state: State) => void
}

const REGIONS = ['north', 'south', 'east', 'west', 'central', 'northeast']

const getRegion = (stateName: string) => {
  const name = stateName.toLowerCase()
  if (["jammu", "kashmir", "ladakh", "himachal", "punjab", "uttarakhand", "haryana", "delhi", "uttar pradesh", "chandigarh"].some(n => name.includes(n))) return "north"
  if (["andhra", "karnataka", "kerala", "tamil", "telangana", "puducherry", "lakshadweep", "andaman"].some(n => name.includes(n))) return "south"
  if (["rajasthan", "gujarat", "maharashtra", "goa", "daman", "dadra"].some(n => name.includes(n))) return "west"
  if (["bihar", "jharkhand", "bengal", "odisha"].some(n => name.includes(n))) return "east"
  if (["madhya", "chhattisgarh"].some(n => name.includes(n))) return "central"
  return "northeast"
}

export default function IndiaMap({ states, selectedStateId, onStateSelect }: IndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<{ state: State | { name_en: string }, x: number, y: number } | null>(null)

  const handleMouseEnter = (e: React.MouseEvent, dbState: State | undefined, mapLocation: any) => {
    setHoveredState({
      state: dbState || { name_en: mapLocation.name },
      x: e.clientX,
      y: e.clientY
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredState) {
      setHoveredState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
    }
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center min-h-0"
      onMouseMove={handleMouseMove}
    >
      <svg
        viewBox={IndiaMapData.viewBox}
        className="w-full h-auto max-w-3xl drop-shadow-[0_0_30px_rgba(245,158,11,0.15)]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {REGIONS.map(region => (
            <pattern 
              key={region}
              id={`pat-${region}`} 
              patternUnits="objectBoundingBox" 
              width="1" 
              height="1"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Added a fallback background color just in case image doesn't load immediately */}
              <rect width="100" height="100" fill="#1e1e1e" />
              <image 
                href={`/pattern_${region}.jpg`} 
                x="0"
                y="0"
                width="100" 
                height="100" 
                preserveAspectRatio="xMidYMid slice" 
                style={{ opacity: 0.9 }}
              />
            </pattern>
          ))}
        </defs>

        <g strokeLinecap="round" strokeLinejoin="round">
          {IndiaMapData.locations.map((location: { id: string, name: string, path: string }) => {
            // Find corresponding state from DB
            const dbState = states.find(s => s.name_en.toLowerCase() === location.name.toLowerCase() || s.svg_path_id === location.id)
            const region = getRegion(location.name)

            return (
              <StatePath
                key={location.id}
                id={location.id}
                d={location.path}
                name={location.name}
                region={region}
                isSelected={dbState ? selectedStateId === dbState.id : false}
                onClick={() => {
                  if (dbState) onStateSelect(dbState)
                }}
                onMouseEnter={(e) => handleMouseEnter(e, dbState, location)}
                onMouseLeave={() => setHoveredState(null)}
              />
            )
          })}
        </g>
      </svg>

      {/* Floating Hover Card */}
      <AnimatePresence>
        {hoveredState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed pointer-events-none z-50 w-72 p-3 bg-[#0a0a0a]/80 backdrop-blur-md border border-[#D6A95B]/30 rounded shadow-2xl flex gap-4 items-center"
            style={{
              left: hoveredState.x + 20,
              top: hoveredState.y - 40
            }}
          >
            <div className="w-16 h-16 bg-black rounded-sm overflow-hidden shrink-0 border border-[#D6A95B]/20 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D6A95B]/30 to-black"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Play size={20} className="text-[#D6A95B]/60" />
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <h4 className="text-white font-display text-lg mb-1 tracking-wide">{hoveredState.state.name_en}</h4>
              <div className="flex items-center gap-2 text-[#D6A95B] text-[9px] font-semibold uppercase tracking-widest mt-1">
                CLICK TO EXPLORE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
