import test from 'node:test'
import assert from 'node:assert/strict'
import { extractBusinessContextSignals } from '../lib/ai/analyze-business-context'

test('extracts SaaS subscription and agency ICP signals from page copy', () => {
  const html = `
    <html>
      <head>
        <title>Audit tool for agencies</title>
        <meta name="description" content="Client-ready audits for web agencies." />
      </head>
      <body>
        <h1>Website audits for agencies</h1>
        <a href="/pricing">Pricing</a>
        <a href="/demo">View demo report</a>
        <button>Start free scan</button>
      </body>
    </html>
  `

  const signals = extractBusinessContextSignals(html)

  assert.equal(signals.monetizationModel, 'subscription')
  assert.equal(signals.productType, 'saas_tool')
  assert.equal(signals.primaryConversionPath, 'free_scan')
  assert.equal(signals.icpHint, 'agency')
})
