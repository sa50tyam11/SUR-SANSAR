'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatePathProps {
  id: string
  d: string
  name: string
  region: string
  isSelected: boolean
  onClick: () => void
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseLeave: () => void
}

export default function StatePath({ id, d, name, region, isSelected, onClick, onMouseEnter, onMouseLeave }: StatePathProps) {
  return (
    <motion.path
      d={d}
      id={id}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      fill={`url(#pat-${region})`}
      className={cn(
        "cursor-pointer transition-all duration-300 stroke-[1] stroke-[#D6A95B]/40 hover:stroke-[#D6A95B]",
        isSelected && "stroke-[#D6A95B] stroke-[2] shadow-[0_0_15px_rgba(214,169,91,0.5)] z-20 relative"
      )}
      style={{ 
        strokeDasharray: isSelected ? "none" : "2 2",
        filter: isSelected ? "brightness(1.2)" : "brightness(0.9)",
      }}
      whileHover={{ scale: 1.01, zIndex: 10, filter: "brightness(1.1)" }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ opacity: 1, pathLength: 1 }}
      transition={{ 
        pathLength: { type: "spring", duration: 1.5, bounce: 0 },
        opacity: { duration: 0.5 }
      }}
    />
  )
}
