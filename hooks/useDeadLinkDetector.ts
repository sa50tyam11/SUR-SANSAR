import { useState, useEffect, useCallback, useRef } from 'react'
import { markTrackInactive } from '@/lib/queries'

type CheckStatus = 'idle' | 'checking' | 'alive' | 'dead'

interface UseDeadLinkDetectorReturn {
  status: CheckStatus
  isAlive: boolean
  isDead: boolean
  checkUrl: (url: string) => Promise<boolean>
}

// Hosts known to support CORS on HEAD requests — we can get a real status code
const CORS_ENABLED_HOSTS = [
  'archive.org',
  'ia800',     // Internet Archive CDN subdomains (ia800xxx.us.archive.org)
  'commons.wikimedia.org',
  'upload.wikimedia.org',
  'freemusicarchive.org',
]

function isCorsEnabled(url: string): boolean {
  return CORS_ENABLED_HOSTS.some(host => url.includes(host))
}

/**
 * Checks whether an external audio URL is reachable.
 *
 * Strategy:
 * - For known CORS-enabled hosts (Internet Archive, Wikimedia): use HEAD + CORS mode
 *   so we get a real HTTP status code and can detect 404s.
 * - For unknown hosts: try creating an Audio element and listening for 'canplay' vs 'error'.
 * - Local /public/* paths: always considered alive.
 * - Results are cached in sessionStorage (1 hour TTL) to avoid repeat checks.
 * - On confirmed dead URL (real 4xx response), calls markTrackInactive() in Supabase.
 * - On transient network failure, does NOT mark inactive — just returns false temporarily.
 */
export function useDeadLinkDetector(): UseDeadLinkDetectorReturn {
  const [status, setStatus] = useState<CheckStatus>('idle')
  const abortRef = useRef<AbortController | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const CACHE_KEY_PREFIX = 'sur_sansar_url_check_'
  const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

  const getCached = (url: string): boolean | null => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + btoa(url).slice(0, 40))
      if (!raw) return null
      const { result, timestamp } = JSON.parse(raw)
      if (Date.now() - timestamp > CACHE_TTL_MS) return null
      return result as boolean
    } catch {
      return null
    }
  }

  const setCached = (url: string, result: boolean) => {
    try {
      sessionStorage.setItem(
        CACHE_KEY_PREFIX + btoa(url).slice(0, 40),
        JSON.stringify({ result, timestamp: Date.now() })
      )
    } catch {
      // sessionStorage might be full — ignore
    }
  }

  /**
   * Strategy A: HEAD request with CORS mode.
   * Works for Internet Archive and Wikimedia Commons which set Access-Control-Allow-Origin: *.
   * Returns the HTTP status code, or null if the request failed (network error).
   */
  const tryHeadRequest = async (url: string, signal: AbortSignal): Promise<number | null> => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal,
        mode: 'cors',
        credentials: 'omit',
      })
      return response.status
    } catch {
      return null
    }
  }

  /**
   * Strategy B: Audio element probe.
   * Creates a hidden Audio element and checks if the browser can load it.
   * Works for any URL but is slower and less reliable than HEAD.
   * Times out after 8 seconds.
   */
  const tryAudioProbe = (url: string): Promise<boolean> => {
    return new Promise(resolve => {
      // Cleanup previous probe
      if (audioRef.current) {
        audioRef.current.src = ''
        audioRef.current.load()
      }

      const audio = new Audio()
      audioRef.current = audio
      audio.preload = 'metadata'

      const timeout = setTimeout(() => {
        audio.src = ''
        resolve(true) // Timeout = assume alive (don't aggressively kill tracks)
      }, 8000)

      audio.addEventListener('canplay', () => {
        clearTimeout(timeout)
        audio.src = ''
        resolve(true)
      }, { once: true })

      audio.addEventListener('error', () => {
        clearTimeout(timeout)
        audio.src = ''
        // audio.error.code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED (URL not found)
        // audio.error.code 2 = MEDIA_ERR_NETWORK (temporary network issue)
        const isDefinitelyDead = audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        resolve(!isDefinitelyDead)
      }, { once: true })

      audio.src = url
    })
  }

  const checkUrl = useCallback(async (url: string): Promise<boolean> => {
    // Local files are always alive
    if (!url.startsWith('http')) {
      setStatus('alive')
      return true
    }

    // Check cache
    const cached = getCached(url)
    if (cached !== null) {
      setStatus(cached ? 'alive' : 'dead')
      return cached
    }

    // Cancel previous check
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setStatus('checking')

    let alive: boolean

    if (isCorsEnabled(url)) {
      // Strategy A: HEAD request (reliable status code)
      const statusCode = await tryHeadRequest(url, abortRef.current.signal)

      if (statusCode === null) {
        // Network error — transient failure, don't mark as permanently dead
        setStatus('idle')
        return true
      }

      alive = statusCode < 400

      if (!alive && statusCode >= 400 && statusCode < 500) {
        // Confirmed 4xx: definitely dead — mark in DB
        console.warn(`[Sur Sansar] Dead link detected (HTTP ${statusCode}): ${url}`)
        markTrackInactive(url).catch(() => {})
      }
    } else {
      // Strategy B: Audio element probe for unknown hosts
      alive = await tryAudioProbe(url)

      if (!alive) {
        // Audio element confirms dead
        console.warn(`[Sur Sansar] Dead link detected (audio probe failed): ${url}`)
        markTrackInactive(url).catch(() => {})
      }
    }

    setCached(url, alive)
    setStatus(alive ? 'alive' : 'dead')
    return alive
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (audioRef.current) {
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  return {
    status,
    isAlive: status === 'alive',
    isDead: status === 'dead',
    checkUrl,
  }
}
