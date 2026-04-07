/**
 * End-to-end scan test against production.
 * Usage: node scripts/test-scan.mjs [url]
 * Default URL: https://example.com (lightweight, no JS, fast Lighthouse)
 */

const BASE_URL = 'https://ship-ready.vercel.app'
const TARGET = process.argv[2] ?? 'https://example.com'
const POLL_INTERVAL = 3000
const MAX_WAIT = 90_000

async function main() {
  console.log(`\nTarget: ${TARGET}`)
  console.log(`API:    ${BASE_URL}\n`)

  // 1. Create scan
  const createRes = await fetch(`${BASE_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
    body: JSON.stringify({ url: TARGET }),
  })

  if (!createRes.ok) {
    const body = await createRes.text()
    console.error(`Failed to create scan: ${createRes.status} ${body}`)
    process.exit(1)
  }

  const { id } = await createRes.json()
  console.log(`Scan created: ${id}`)
  console.log(`Report: ${BASE_URL}/report/${id}\n`)

  // 2. Poll for result
  const start = Date.now()
  let lastStatus = ''

  while (Date.now() - start < MAX_WAIT) {
    await sleep(POLL_INTERVAL)

    const pollRes = await fetch(`${BASE_URL}/api/scan/${id}`)
    const data = await pollRes.json()
    const { status, results } = data

    if (status !== lastStatus) {
      console.log(`Status: ${status}  (${Math.round((Date.now() - start) / 1000)}s)`)
      lastStatus = status
    }

    if (status === 'done') {
      printResults(results)
      return
    }

    if (status === 'error') {
      console.error('\nScan failed on server.')
      process.exit(1)
    }
  }

  console.error(`\nTimed out after ${MAX_WAIT / 1000}s`)
  process.exit(1)
}

function printResults(r) {
  console.log('\n' + '='.repeat(50))
  console.log(`URL:          ${r.url}`)
  console.log(`Total score:  ${r.totalScore}`)
  console.log(`Performance:  ${r.performance.score}  (${r.performance.label})`)
  console.log(`SEO:          ${r.seo.score}  (${r.seo.label})`)
  console.log(`Security:     ${r.security.score}  (${r.security.label})`)
  console.log(`Mobile:       ${r.mobile.score}  (${r.mobile.label})`)
  if (r.ai_visibility) {
    console.log(`AI Visibility: ${r.ai_visibility.score}  (${r.ai_visibility.label})`)
  }

  const allIssues = [
    ...r.performance.issues,
    ...r.seo.issues,
    ...r.security.issues,
    ...r.mobile.issues,
    ...(r.ai_visibility?.issues ?? []),
  ]

  const critical = allIssues.filter(i => i.severity === 'critical')
  const high = allIssues.filter(i => i.severity === 'high')

  console.log(`\nCritical issues (${critical.length}):`)
  critical.forEach(i => console.log(`  - [${i.category}] ${i.title}`))
  console.log(`High issues (${high.length}):`)
  high.forEach(i => console.log(`  - [${i.category}] ${i.title}`))

  if (r.aiSummary) {
    console.log(`\nAI Summary:\n${r.aiSummary}`)
  }

  console.log('='.repeat(50) + '\n')
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

main().catch(e => { console.error(e); process.exit(1) })
