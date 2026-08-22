'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Users, ArrowRight, Loader2, LogIn, UserCircle2, Music2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

// ─── Room Code Generator ──────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateRoomCode(): string {
  let code = ''
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  for (const byte of array) {
    code += ALPHABET[byte % ALPHABET.length]
  }
  return code
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function SurSansarLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 md:gap-5 group cursor-pointer text-white">
      <div className="relative w-10 h-7 md:w-12 md:h-8 rounded-sm overflow-hidden shadow-lg border border-white/20 opacity-95 shrink-0 hover:scale-105 transition-transform">
        <Image src="/indflag.jpg" alt="Indian Flag" fill className="object-cover" />
      </div>

      <div className="w-8 h-8 md:w-10 md:h-10 text-community-gold group-hover:rotate-90 transition-transform duration-700 ease-in-out hidden sm:block shrink-0">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0L55 35L90 10L65 45L100 50L65 55L90 90L55 65L50 100L45 65L10 90L35 55L0 50L35 45L10 10L45 35Z" />
          <circle cx="50" cy="50" r="15" fill="transparent" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>
      </div>

      <div className="flex flex-col ml-1">
        <span
          className="text-3xl md:text-4xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-white to-white leading-none drop-shadow-md"
          style={{ fontFamily: 'var(--font-rozha)' }}
        >
          सुर <span className="text-community-gold text-2xl px-1 drop-shadow-none font-sans">•</span> संसार
        </span>
        <p className="text-[#94a3b8] text-[0.65rem] font-sans tracking-[0.25em] mt-1.5 ml-1 uppercase">
          Music of every state
        </p>
      </div>
    </Link>
  )
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────
function AuthGate() {
  const { signInWithGoogle, signInAsGuest, isLoading } = useAuthStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
      className="w-full max-w-md"
    >
      {/* Gold ornament */}
      <div className="flex items-center gap-3 justify-center mb-8 opacity-70">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-community-gold/60" />
        <div className="text-community-gold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          </svg>
        </div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-community-gold/60" />
      </div>

      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#D6A95B]/10 border border-[#D6A95B]/20 mb-4">
            <Users size={26} className="text-[#D6A95B]" />
          </div>
          <h2 className="text-3xl font-[family-name:var(--font-great-vibes)] text-slate-100 mb-2">Community Hub</h2>
          <p className="text-slate-200 text-sm font-light leading-relaxed">
            Listen to the music of India with friends,<br />in real-time, together.
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign-In */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-6 rounded-sm transition-colors text-xs tracking-widest disabled:opacity-60 shadow-md"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            CONTINUE WITH GOOGLE
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-1">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D6A95B]/40" />
            <span className="text-[#D6A95B] text-[10px] tracking-widest font-medium uppercase">or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D6A95B]/40" />
          </div>

          {/* Guest CTA */}
          <button
            onClick={signInAsGuest}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#D6A95B] hover:brightness-110 text-slate-900 font-semibold py-3 px-6 rounded-sm transition-all text-xs tracking-widest disabled:opacity-60 shadow-xl cursor-pointer"
          >
            <UserCircle2 size={16} />
            JOIN AS GUEST
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Community Hub Dashboard ──────────────────────────────────────────────────
function CommunityDashboard() {
  const { user, signOut } = useAuthStore()
  const router = useRouter()

  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const displayName = user?.is_anonymous
    ? `Guest · ${user.id.slice(0, 4).toUpperCase()}`
    : (user?.user_metadata?.full_name as string | undefined) ?? 'Music Lover'

  const handleCreateRoom = () => {
    setIsCreating(true)
    router.push(`/community/${generateRoomCode()}`)
  }

  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) {
      setJoinError('Please enter a valid room code.')
      return
    }
    setJoinError('')
    router.push(`/community/${code}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
      className="w-full max-w-lg"
    >
      {/* Gold ornament */}
      <div className="flex items-center gap-3 justify-center mb-8 opacity-70">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-community-gold/60" />
        <div className="text-community-gold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          </svg>
        </div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-community-gold/60" />
      </div>

      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl overflow-hidden">

        {/* Header strip */}
        <div className="px-8 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-[0.65rem] font-sans tracking-[0.25em] uppercase mb-1">Signed in as</p>
              <p className="text-slate-100 font-medium text-sm truncate max-w-[220px]">{displayName}</p>
            </div>
            <button
              onClick={signOut}
              className="text-[10px] font-semibold tracking-widest text-slate-400 hover:text-white transition-colors uppercase"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">

          {/* Create Room */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Music2 size={16} className="text-[#D6A95B]" />
              <h3 className="text-xs font-semibold tracking-widest text-slate-200 uppercase">
                Start a Session
              </h3>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-3 bg-[#D6A95B] hover:brightness-110 text-slate-900 font-semibold py-3 px-6 rounded-sm transition-all shadow-xl disabled:opacity-70 text-xs tracking-widest cursor-pointer group"
            >
              {isCreating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Users size={16} />
                  CREATE NEW ROOM
                  <ArrowRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <p className="text-slate-400 text-xs mt-4 leading-relaxed font-light">
              A unique invite code is auto-generated. Share it with friends to listen together.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D6A95B]/40" />
            <span className="text-[#D6A95B] text-[10px] tracking-widest font-medium uppercase">or join one</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D6A95B]/40" />
          </div>

          {/* Join Room */}
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  setJoinError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="ENTER CODE"
                maxLength={8}
                className="flex-1 bg-black/40 border border-white/10 focus:border-[#D6A95B]/50 focus:outline-none rounded-sm py-3 px-4 text-slate-200 placeholder:text-slate-500 text-xs tracking-widest font-mono transition-colors"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!joinCode.trim()}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold rounded-sm transition-all text-xs tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                JOIN
              </button>
            </div>

            <AnimatePresence>
              {joinError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-community-crimson text-xs mt-2 ml-1"
                >
                  {joinError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user, isLoading } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <main className="relative h-screen bg-community-canvas overflow-hidden flex flex-col">

      {/* Cinematic Background (Matches Home Page) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-cinematic-v2.jpg"
          alt="Community background"
          fill
          priority
          className="object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-transparent to-transparent"></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 w-full z-50 px-6 md:px-12 lg:px-24 py-4 md:py-6 flex items-center justify-between pointer-events-none bg-community-canvas/60 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="pointer-events-auto">
          <SurSansarLogo />
        </div>

        {/* Center nav */}
        <div className="hidden lg:flex items-center gap-8 pointer-events-auto">
          <div className="flex items-center gap-8 font-sans text-slate-300 text-sm font-semibold tracking-widest drop-shadow-sm">
            <Link href="/" className="hover:text-community-gold transition-colors duration-300">
              HOME
            </Link>
            <button className="text-community-gold transition-colors duration-300 relative group flex flex-col items-center">
              COMMUNITY
              <span className="absolute -bottom-2 w-10 h-px bg-community-gold" />
              <span className="absolute -bottom-2.5 w-1 h-1 rounded-full bg-community-gold" />
            </button>
          </div>
        </div>

        <div className="w-1/3 flex justify-end pointer-events-auto">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* Identity watermark */}
      <div className="absolute bottom-10 right-10 md:bottom-12 md:right-16 z-20 flex flex-col items-end pointer-events-none drop-shadow-2xl opacity-60">
        <div className="text-base md:text-lg font-medium text-slate-100 mb-2">संगीत ही हमारी पहचान है</div>
        <div className="flex items-center gap-3">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-community-gold" />
          <div className="text-community-gold text-[10px] tracking-[0.25em] font-medium uppercase">Music is our identity</div>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-community-gold" />
        </div>
      </div>

      {/* Central content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-32">

        {/* Page title (Matches Home Page Text Aesthetics) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="text-center mb-12"
        >
          <h1
            className="font-[family-name:var(--font-great-vibes)] text-6xl md:text-7xl lg:text-[5.5rem] font-normal text-slate-100 leading-[1.15] tracking-normal drop-shadow-2xl"
          >
            Listen <span className="text-[#D6A95B]">Together.</span>
          </h1>
          <p className="text-slate-200 text-sm md:text-lg font-light mt-4 tracking-wide max-w-md mx-auto leading-relaxed drop-shadow-md">
            Create a room, share the code, and enjoy folk music in sync.
          </p>
        </motion.div>

        {/* Auth gate or Dashboard */}
        {!mounted || isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-community-gold" size={36} />
          </div>
        ) : !user ? (
          <AuthGate />
        ) : (
          <CommunityDashboard />
        )}
      </div>

    </main>
  )
}
