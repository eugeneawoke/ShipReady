import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runSEOChecks } from '../lib/checks/seo'

const baseHead = `
  <title>Test Page Title Long Enough For SEO Checks Here</title>
  <meta name="description" content="Adequate meta description for the page that is long enough to pass length checks in the SEO checker automatically." />
`

describe('seo-og-image-dimensions', () => {
  it('flags when og:image is present but dimensions are missing', async () => {
    const html = `<html><head>${baseHead}<meta property="og:image" content="https://test.com/img.png" /></head><body></body></html>`
    const issues = await runSEOChecks('https://test.com', html, { includeLikely: true })
    assert.ok(issues.some(i => i.id === 'seo-og-image-dimensions'), 'should flag missing dimensions')
  })

  it('flags when only width is present (height missing)', async () => {
    const html = `<html><head>${baseHead}
      <meta property="og:image" content="https://test.com/img.png" />
      <meta property="og:image:width" content="1200" />
    </head><body></body></html>`
    const issues = await runSEOChecks('https://test.com', html, { includeLikely: true })
    assert.ok(issues.some(i => i.id === 'seo-og-image-dimensions'), 'should flag when height missing')
  })

  it('does not flag when both width and height are present', async () => {
    const html = `<html><head>${baseHead}
      <meta property="og:image" content="https://test.com/img.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
    </head><body></body></html>`
    const issues = await runSEOChecks('https://test.com', html, { includeLikely: true })
    assert.ok(!issues.some(i => i.id === 'seo-og-image-dimensions'), 'should not flag when dimensions present')
  })

  it('does not flag when og:image is absent', async () => {
    const html = `<html><head>${baseHead}</head><body></body></html>`
    const issues = await runSEOChecks('https://test.com', html, { includeLikely: true })
    assert.ok(!issues.some(i => i.id === 'seo-og-image-dimensions'), 'should not flag when no og:image')
  })

  it('does not flag when includeLikely is false', async () => {
    const html = `<html><head>${baseHead}<meta property="og:image" content="https://test.com/img.png" /></head><body></body></html>`
    const issues = await runSEOChecks('https://test.com', html, { includeLikely: false })
    assert.ok(!issues.some(i => i.id === 'seo-og-image-dimensions'), 'should not flag when likely disabled')
  })
})
