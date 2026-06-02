/**
 * Batch scan + publish script for AI Readiness Ranking.
 *
 * Flow per domain:
 *   1. INSERT into scans via Supabase service role (no rate limit, no origin guard)
 *   2. POST to Railway /api/run-scan (triggers actual scan)
 *   3. Poll scans table until status = done/error
 *   4. POST to /api/admin/domains (publishes to /site/[slug] + AI ranking)
 *
 * Required env vars (copy from .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RAILWAY_SCANNER_URL     (e.g. https://your-app.railway.app)
 *   SCANNER_SECRET
 *   ADMIN_SECRET
 *
 * Usage:
 *   node scripts/batch-scan.mjs
 *   node scripts/batch-scan.mjs --dry-run      (only prints domains, no scans)
 *   node scripts/batch-scan.mjs --concurrency 3
 *   node scripts/batch-scan.mjs --skip-publish  (scan but don't auto-publish)
 *
 * Output:
 *   scripts/batch-scan-results.json — full results for review
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Auto-load .env.local — no need to manually export anything
function loadEnv() {
  const envFile = join(ROOT, '.env.local')
  if (!existsSync(envFile)) return
  const lines = readFileSync(envFile, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
}
loadEnv()

// ─── Config ────────────────────────────────────────────────────────────────

const APP_URL      = 'https://ship-ready.vercel.app'
const CONCURRENCY  = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1] ?? '1')
const DRY_RUN      = process.argv.includes('--dry-run')
const SKIP_PUBLISH = process.argv.includes('--skip-publish')
const POLL_MS      = 5_000
const TIMEOUT_MS   = 5 * 60_000  // 5 min per scan
const DELAY_MS     = 3_000       // pause between scans

const {
  SUPABASE_SERVICE_ROLE_KEY,
  SCANNER_SECRET,
  ADMIN_SECRET,
} = process.env

// Normalize URLs — add https:// if missing
function normalizeUrl(raw) {
  if (!raw) return ''
  raw = raw.trim().replace(/\/$/, '')
  return raw.startsWith('http') ? raw : `https://${raw}`
}

const SUPABASE_URL         = normalizeUrl(process.env.SUPABASE_URL)
const RAILWAY_SCANNER_URL  = normalizeUrl(process.env.RAILWAY_SCANNER_URL)

// ─── Target domains ────────────────────────────────────────────────────────
// 50 well-known sites across categories — good signal for AI Readiness ranking

const DOMAINS = [
  // Dev tools / Cloud
  'https://vercel.com',
  'https://netlify.com',
  'https://supabase.com',
  'https://railway.app',
  'https://github.com',
  'https://cloudflare.com',
  'https://fly.io',
  'https://render.com',
  'https://digitalocean.com',

  // AI companies
  'https://openai.com',
  'https://anthropic.com',
  'https://perplexity.ai',
  'https://cursor.com',
  'https://mistral.ai',
  'https://huggingface.co',
  'https://replicate.com',
  'https://groq.com',

  // Vibe coding / No-code
  'https://lovable.dev',
  'https://bolt.new',
  'https://v0.dev',
  'https://webflow.com',
  'https://framer.com',
  'https://bubble.io',

  // Popular SaaS
  'https://stripe.com',
  'https://notion.so',
  'https://linear.app',
  'https://figma.com',
  'https://loom.com',
  'https://airtable.com',
  'https://zapier.com',
  'https://retool.com',

  // Web frameworks / docs
  'https://nextjs.org',
  'https://react.dev',
  'https://svelte.dev',
  'https://astro.build',
  'https://nuxt.com',
  'https://tailwindcss.com',
  'https://typescriptlang.org',

  // Community / Indie
  'https://producthunt.com',
  'https://indiehackers.com',
  'https://news.ycombinator.com',
  'https://hashnode.com',
  'https://dev.to',

  // E-commerce / No-code
  'https://shopify.com',
  'https://wordpress.com',
  'https://wix.com',
  'https://squarespace.com',

  // Other notable
  'https://cal.com',
  'https://posthog.com',
  'https://resend.com',
]

// ─── Validation ────────────────────────────────────────────────────────────

function validate() {
  if (DRY_RUN) {
    console.log('DRY RUN — no actual scans will be performed\n')
    console.log('Domains to scan:')
    DOMAINS.forEach((d, i) => console.log(`  ${i + 1}. ${d}`))
    process.exit(0)
  }

  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RAILWAY_SCANNER_URL', 'SCANNER_SECRET', 'ADMIN_SECRET']
    .filter(k => !process.env[k])

  if (missing.length) {
    console.error('Missing required env vars:', missing.join(', '))
    console.error('\nSet them in .env.local or export them before running:')
    console.error('  export SUPABASE_URL=...')
    console.error('  export SUPABASE_SERVICE_ROLE_KEY=...')
    console.error('  export RAILWAY_SCANNER_URL=...')
    console.error('  export SCANNER_SECRET=...')
    console.error('  export ADMIN_SECRET=...')
    process.exit(1)
  }
}

// ─── Core functions ────────────────────────────────────────────────────────

function makeSupabase() {
  // Fresh client per call — prevents connection exhaustion over long runs
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch: (...args) => fetch(...args) },
  })
}

async function createScan(url, attempt = 1) {
  const supabase = makeSupabase()
  const { data, error } = await supabase
    .from('scans')
    .insert({ url, status: 'pending', scan_goal: 'full' })
    .select('id')
    .single()

  if (error) {
    if (attempt < 4) {
      await sleep(2000 * attempt)
      return createScan(url, attempt + 1)
    }
    throw new Error(`Insert scan failed for ${url}: ${error.message}`)
  }
  return data.id
}

async function pollUntilDoneById(scanId) {
  return pollUntilDone(makeSupabase(), scanId)
}

async function triggerRailwayScan(scanId, url) {
  const railwayUrl = RAILWAY_SCANNER_URL.replace(/\/$/, '')
  const res = await fetch(`${railwayUrl}/api/run-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SCANNER_SECRET}`,
    },
    body: JSON.stringify({ url, scanId, scanGoal: 'full' }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Railway trigger failed (${res.status}): ${text}`)
  }
}

async function pollUntilDone(supabase, scanId) {
  const deadline = Date.now() + TIMEOUT_MS
  while (Date.now() < deadline) {
    await sleep(POLL_MS)
    const { data, error } = await supabase
      .from('scans')
      .select('status, results')
      .eq('id', scanId)
      .single()

    if (error) continue

    if (data.status === 'done') return { success: true, results: data.results }
    if (data.status === 'error') return { success: false, results: null }
  }
  return { success: false, results: null, timedOut: true }
}

async function publishDomain(scanId, url) {
  const res = await fetch(`${APP_URL}/api/admin/domains`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_SECRET}`,
    },
    body: JSON.stringify({ scanId, domain: url, category: 'tech' }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Publish failed (${res.status}): ${text}`)
  }

  const { slug } = await res.json()
  return slug
}

async function processDomain(url, index, total) {
  const tag = `[${index + 1}/${total}] ${url}`
  const result = { url, scanId: null, slug: null, status: 'pending', error: null }

  // Stagger starts to avoid connection bursts
  if (index > 0) await sleep(DELAY_MS)

  try {
    process.stdout.write(`\n${tag}\n  → inserting scan...`)
    const scanId = await createScan(url)   // fresh client each time
    result.scanId = scanId
    process.stdout.write(` ✓ (${scanId.slice(0, 8)})\n  → triggering Railway...`)

    await triggerRailwayScan(scanId, url)
    process.stdout.write(` ✓\n  → waiting for scan to complete...`)

    const { success, timedOut } = await pollUntilDoneById(scanId)   // fresh client

    if (!success) {
      result.status = timedOut ? 'timeout' : 'error'
      process.stdout.write(` ✗ ${result.status}\n`)
      return result
    }

    process.stdout.write(` ✓ done`)

    if (!SKIP_PUBLISH) {
      process.stdout.write(`\n  → publishing...`)
      const slug = await publishDomain(scanId, url)
      result.slug = slug
      result.status = 'published'
      process.stdout.write(` ✓ /site/${slug}\n`)
    } else {
      result.status = 'done'
      process.stdout.write(` (skipped publish)\n`)
    }
  } catch (err) {
    result.status = 'failed'
    result.error = err.message
    process.stdout.write(`\n  ✗ FAILED: ${err.message}\n`)
  }

  return result
}

// ─── Concurrency helpers ───────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runWithConcurrency(items, fn, concurrency) {
  const results = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i], i)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker)
  await Promise.all(workers)
  return results
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  validate()

  const total = DOMAINS.length

  console.log(`\nShipReady Batch Scan`)
  console.log(`${'─'.repeat(40)}`)
  console.log(`Domains:     ${total}`)
  console.log(`Concurrency: ${CONCURRENCY}`)
  console.log(`Auto-publish:${SKIP_PUBLISH ? ' no' : ' yes'}`)
  console.log(`${'─'.repeat(40)}\n`)

  const startTime = Date.now()

  const results = await runWithConcurrency(
    DOMAINS,
    (url, i) => processDomain(url, i, total),
    CONCURRENCY,
  )

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const published = results.filter(r => r.status === 'published').length
  const failed    = results.filter(r => ['error', 'timeout', 'failed'].includes(r.status)).length
  const done      = results.filter(r => r.status === 'done').length

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Done in ${elapsed}s`)
  console.log(`Published: ${published}`)
  console.log(`Scanned (not published): ${done}`)
  console.log(`Failed/timeout: ${failed}`)

  const outputPath = join(__dirname, 'batch-scan-results.json')
  writeFileSync(outputPath, JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2))
  console.log(`\nResults saved to: scripts/batch-scan-results.json`)

  if (published > 0) {
    console.log(`\nView AI Readiness Ranking:`)
    console.log(`  ${APP_URL}/ai-readiness-report`)
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
