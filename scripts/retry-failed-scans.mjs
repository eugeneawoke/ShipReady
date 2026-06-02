/**
 * Retry only failed domains from a previous batch-scan run.
 * Reads scripts/batch-scan-results.json and re-runs failed/timeout/error entries.
 *
 * Usage:
 *   node scripts/retry-failed-scans.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Reuse batch-scan logic by dynamically importing it after setting DOMAINS
// Instead, just set DOMAINS from failed results and run same logic inline

// Load .env.local
const ROOT = join(__dirname, '..')
try {
  const lines = readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (k && !process.env[k]) process.env[k] = v
  }
} catch {}

const resultsPath = join(__dirname, 'batch-scan-results.json')
let results
try {
  results = JSON.parse(readFileSync(resultsPath, 'utf8'))
} catch {
  console.error('No batch-scan-results.json found. Run batch-scan.mjs first.')
  process.exit(1)
}

const failed = results.results
  .filter(r => ['failed', 'timeout', 'error'].includes(r.status))
  .map(r => r.url)

if (!failed.length) {
  console.log('No failed domains to retry.')
  process.exit(0)
}

console.log(`\nRetrying ${failed.length} failed domains...\n`)

// Override DOMAINS and run via batch-scan
// Simplest: write a temp override and exec batch-scan
// Better: just inline the same logic

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

function normalizeUrl(raw) {
  if (!raw) return ''
  raw = raw.trim().replace(/\/$/, '')
  return raw.startsWith('http') ? raw : `https://${raw}`
}

const SUPABASE_URL        = normalizeUrl(process.env.SUPABASE_URL)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RAILWAY_SCANNER_URL = normalizeUrl(process.env.RAILWAY_SCANNER_URL)
const SCANNER_SECRET      = process.env.SCANNER_SECRET
const ADMIN_SECRET        = process.env.ADMIN_SECRET
const APP_URL             = 'https://ship-ready.vercel.app'
const POLL_MS             = 5_000
const TIMEOUT_MS          = 5 * 60_000
const DELAY_MS            = 5_000

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function makeSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

async function createScan(url, attempt = 1) {
  const sb = makeSupabase()
  const { data, error } = await sb
    .from('scans')
    .insert({ url, status: 'pending', scan_goal: 'full' })
    .select('id')
    .single()
  if (error) {
    if (attempt < 4) { await sleep(2000 * attempt); return createScan(url, attempt + 1) }
    throw new Error(`Insert failed: ${error.message}`)
  }
  return data.id
}

async function triggerRailway(scanId, url) {
  const res = await fetch(`${RAILWAY_SCANNER_URL}/api/run-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SCANNER_SECRET}` },
    body: JSON.stringify({ url, scanId, scanGoal: 'full' }),
  })
  if (!res.ok) throw new Error(`Railway ${res.status}: ${await res.text()}`)
}

async function poll(scanId) {
  const deadline = Date.now() + TIMEOUT_MS
  while (Date.now() < deadline) {
    await sleep(POLL_MS)
    const { data } = await makeSupabase().from('scans').select('status').eq('id', scanId).single()
    if (data?.status === 'done') return true
    if (data?.status === 'error') return false
  }
  return false
}

async function publish(scanId, url) {
  const res = await fetch(`${APP_URL}/api/admin/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_SECRET}` },
    body: JSON.stringify({ scanId, domain: url, category: 'tech' }),
  })
  if (!res.ok) throw new Error(`Publish ${res.status}: ${await res.text()}`)
  const { slug } = await res.json()
  return slug
}

async function main() {
  const retryResults = []

  for (let i = 0; i < failed.length; i++) {
    const url = failed[i]
    const tag = `[${i + 1}/${failed.length}] ${url}`
    if (i > 0) await sleep(DELAY_MS)

    process.stdout.write(`\n${tag}\n  → inserting...`)
    try {
      const scanId = await createScan(url)
      process.stdout.write(` ✓\n  → Railway...`)
      await triggerRailway(scanId, url)
      process.stdout.write(` ✓\n  → scanning...`)
      const ok = await poll(scanId)
      if (!ok) { process.stdout.write(` ✗ error\n`); retryResults.push({ url, status: 'error' }); continue }
      process.stdout.write(` ✓\n  → publishing...`)
      const slug = await publish(scanId, url)
      process.stdout.write(` ✓ /site/${slug}\n`)
      retryResults.push({ url, status: 'published', slug })
    } catch (err) {
      process.stdout.write(`\n  ✗ ${err.message}\n`)
      retryResults.push({ url, status: 'failed', error: err.message })
    }
  }

  const published = retryResults.filter(r => r.status === 'published').length
  const stillFailed = retryResults.filter(r => r.status !== 'published').length
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Published: ${published} | Still failed: ${stillFailed}`)

  // Merge back into results file
  const updated = { ...results }
  for (const r of retryResults) {
    const idx = updated.results.findIndex(x => x.url === r.url)
    if (idx !== -1) updated.results[idx] = { ...updated.results[idx], ...r }
  }
  writeFileSync(resultsPath, JSON.stringify(updated, null, 2))
  console.log('Results updated in batch-scan-results.json')
}

main().catch(e => { console.error(e.message); process.exit(1) })
