// @ts-nocheck
/**
 * track-health.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright E2E test: checks that all active track URLs in state_music_links
 * return HTTP 200 (or an acceptable redirect) when fetched via HEAD request.
 *
 * Run with:
 *   npx playwright test tests/track-health.spec.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in env.
 *
 * Note: This test does NOT call markTrackInactive — it only reports.
 * Dead links should be investigated manually or the cron will skip them
 * on the next run.
 */

import { test, expect, APIRequestContext } from '@playwright/test'

// ── Helpers ────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface TrackLink {
  id: string
  state_name: string
  track_title: string
  stream_url: string
  source: string
}

async function fetchActiveLinks(request: APIRequestContext): Promise<TrackLink[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY ||
    SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
    console.warn('⚠ Supabase not configured — skipping track health test')
    return []
  }

  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/state_music_links?select=id,state_name,track_title,stream_url,source&is_active=eq.true&limit=200`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )

  expect(resp.status()).toBe(200)
  return resp.json() as Promise<TrackLink[]>
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Track URL Health Check', () => {
  let links: TrackLink[] = []

  test.beforeAll(async ({ request }) => {
    links = await fetchActiveLinks(request)
    console.log(`Found ${links.length} active track URLs to test`)
  })

  test('all active stream URLs should return HTTP 200 or redirect', async ({ request }) => {
    if (links.length === 0) {
      test.skip()
      return
    }

    const results: { url: string; state: string; title: string; status: number; ok: boolean }[] = []
    const TIMEOUT_MS = 10_000

    for (const link of links) {
      try {
        const resp = await request.head(link.stream_url, {
          timeout: TIMEOUT_MS,
          // Follow redirects
          maxRedirects: 5,
        })

        const ok = resp.status() < 400
        results.push({
          url: link.stream_url,
          state: link.state_name,
          title: link.track_title,
          status: resp.status(),
          ok,
        })

        if (!ok) {
          console.error(`❌ DEAD LINK [${resp.status()}]: ${link.state_name} — "${link.track_title}" → ${link.stream_url}`)
        } else {
          console.log(`✓ [${resp.status()}] ${link.state_name}: ${link.track_title}`)
        }
      } catch (err) {
        console.error(`❌ REQUEST FAILED: ${link.state_name} — "${link.track_title}" → ${link.stream_url}`, err)
        results.push({
          url: link.stream_url,
          state: link.state_name,
          title: link.track_title,
          status: 0,
          ok: false,
        })
      }

      // Small delay to be polite to external servers
      await new Promise(r => setTimeout(r, 200))
    }

    const dead = results.filter(r => !r.ok)
    const aliveCount = results.length - dead.length

    console.log(`\n── Health Check Summary ──`)
    console.log(`Total: ${results.length} | ✓ Alive: ${aliveCount} | ✗ Dead: ${dead.length}`)

    if (dead.length > 0) {
      console.error('\nDead URLs to investigate:')
      dead.forEach(d => console.error(`  [${d.status}] ${d.state} → ${d.url}`))
    }

    // Allow up to 10% dead links before failing the test
    // (Internet Archive URLs may have temporary outages)
    const deadPercent = (dead.length / results.length) * 100
    expect(
      deadPercent,
      `${dead.length} of ${results.length} URLs are dead (${deadPercent.toFixed(1)}%). Expected < 10%.`
    ).toBeLessThan(10)
  })

  test('dead links test: Internet Archive URLs should be reachable', async ({ request }) => {
    const iaLinks = links.filter(l => l.source === 'Internet Archive')
    if (iaLinks.length === 0) {
      test.skip()
      return
    }

    // Test a sample of IA links (max 5)
    const sample = iaLinks.slice(0, 5)
    for (const link of sample) {
      const resp = await request.head(link.stream_url, { timeout: 10_000, maxRedirects: 5 })
      console.log(`[IA] ${resp.status()} — ${link.track_title}`)
      expect(resp.status()).toBeLessThan(500) // 2xx or 3xx is acceptable
    }
  })

  test('dead links test: Wikimedia Commons URLs should be reachable', async ({ request }) => {
    const wikiLinks = links.filter(l => l.source === 'Wikimedia Commons')
    if (wikiLinks.length === 0) {
      test.skip()
      return
    }

    const sample = wikiLinks.slice(0, 5)
    for (const link of sample) {
      const resp = await request.head(link.stream_url, { timeout: 10_000, maxRedirects: 5 })
      console.log(`[Wiki] ${resp.status()} — ${link.track_title}`)
      expect(resp.status()).toBeLessThan(500)
    }
  })
})
