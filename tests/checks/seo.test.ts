import test from 'node:test'
import assert from 'node:assert/strict'
import { runSEOChecks } from '../../lib/checks/seo'

function issueIds(issues: Awaited<ReturnType<typeof runSEOChecks>>) {
  return issues.map(issue => issue.id)
}

test('flags incomplete social previews during the fast SEO pass', async () => {
  const html = `
    <html>
      <head>
        <title>Example product launch readiness platform</title>
        <meta name="description" content="A practical platform for checking launch readiness before teams ship client websites." />
        <link rel="canonical" href="https://example.com/" />
        <meta property="og:title" content="Example" />
        <meta property="og:description" content="Example description" />
        <meta property="og:image" content="https://example.com/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body><h1>Example</h1></body>
    </html>
  `

  const ids = issueIds(await runSEOChecks('https://example.com/', html, {
    includeLikely: false,
    includeHeuristics: false,
  }))

  assert.ok(ids.includes('missing-og-url'))
  assert.ok(ids.includes('missing-twitter-image'))
})

test('flags malformed canonical URLs and cross-domain canonicals', async () => {
  const doubleSlashHtml = `
    <html>
      <head>
        <title>Example product launch readiness platform</title>
        <meta name="description" content="A practical platform for checking launch readiness before teams ship client websites." />
        <link rel="canonical" href="https://example.com//pricing" />
        <meta property="og:title" content="Example" />
        <meta property="og:description" content="Example description" />
        <meta property="og:image" content="https://example.com/og.png" />
        <meta property="og:url" content="https://example.com//pricing" />
        <meta name="twitter:card" content="summary" />
      </head>
      <body><h1>Example</h1></body>
    </html>
  `

  const mismatchHtml = doubleSlashHtml.replaceAll('https://example.com//pricing', 'https://other.example/pricing')

  const doubleSlashIds = issueIds(await runSEOChecks('https://example.com/pricing', doubleSlashHtml, {
    includeLikely: false,
    includeHeuristics: false,
  }))
  const mismatchIds = issueIds(await runSEOChecks('https://example.com/pricing', mismatchHtml, {
    includeLikely: false,
    includeHeuristics: false,
  }))

  assert.ok(doubleSlashIds.includes('canonical-double-slash'))
  assert.ok(doubleSlashIds.includes('og-url-double-slash'))
  assert.ok(mismatchIds.includes('canonical-mismatch'))
  assert.ok(mismatchIds.includes('og-url-mismatch'))
})
