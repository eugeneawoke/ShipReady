import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runAIVisibilityChecks } from '../lib/checks/ai-visibility'

const minimalHtml = (head = '', body = '<p>Content</p>') =>
  `<html><head>${head}</head><body>${body}</body></html>`

const orgSchema = (extra = '') =>
  `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Test","url":"https://test.com"${extra}}</script>`

describe('geo-missing-org-sameas', () => {
  it('flags when Organization schema has no sameAs', async () => {
    const html = minimalHtml(orgSchema())
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(issues.some(i => i.id === 'geo-missing-org-sameas'), 'should flag missing sameAs')
  })

  it('does not flag when Organization schema has sameAs', async () => {
    const html = minimalHtml(orgSchema(',"sameAs":["https://twitter.com/test"]'))
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(!issues.some(i => i.id === 'geo-missing-org-sameas'), 'should not flag when sameAs present')
  })

  it('does not flag when Organization schema is absent', async () => {
    const html = minimalHtml(
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Test"}</script>',
    )
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(!issues.some(i => i.id === 'geo-missing-org-sameas'), 'should not flag when no org schema')
  })
})

describe('geo-missing-date-signal', () => {
  it('flags when no date signal is present', async () => {
    const html = minimalHtml()
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(issues.some(i => i.id === 'geo-missing-date-signal'), 'should flag missing date')
  })

  it('does not flag when datePublished in JSON-LD', async () => {
    const html = minimalHtml(
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","datePublished":"2026-05-09"}</script>',
    )
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(!issues.some(i => i.id === 'geo-missing-date-signal'), 'should not flag when datePublished present')
  })

  it('does not flag when article:published_time meta present', async () => {
    const html = minimalHtml('<meta property="article:published_time" content="2026-05-09T00:00:00Z" />')
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(!issues.some(i => i.id === 'geo-missing-date-signal'), 'should not flag when og meta date present')
  })

  it('does not flag when <time datetime> in body', async () => {
    const html = minimalHtml('', '<p>Content</p><time datetime="2026-05-09">May 9, 2026</time>')
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(!issues.some(i => i.id === 'geo-missing-date-signal'), 'should not flag when time element present')
  })

  it('does not flag when dateModified in JSON-LD', async () => {
    const html = minimalHtml(
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","dateModified":"2026-05-09"}</script>',
    )
    const issues = await runAIVisibilityChecks('https://test.com', html)
    assert.ok(!issues.some(i => i.id === 'geo-missing-date-signal'), 'should not flag when dateModified present')
  })
})

describe('geo-no-question-headings', () => {
  it('flags when H2/H3 exist but none are question-format', async () => {
    const html = minimalHtml(
      '',
      '<h2>Features</h2><h3>Pricing</h3><p>Content paragraph here.</p>',
    )
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: true })
    assert.ok(issues.some(i => i.id === 'geo-no-question-headings'), 'should flag non-question headings')
  })

  it('does not flag when an H2 starts with a question word', async () => {
    const html = minimalHtml('', '<h2>How does it work?</h2><h2>Pricing</h2><p>Content</p>')
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: true })
    assert.ok(!issues.some(i => i.id === 'geo-no-question-headings'), 'should not flag when question heading present')
  })

  it('does not flag when an H3 ends with "?"', async () => {
    const html = minimalHtml('', '<h3>Is this free?</h3><p>Content</p>')
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: true })
    assert.ok(!issues.some(i => i.id === 'geo-no-question-headings'), 'should not flag when ? heading present')
  })

  it('does not generate issue when no H2 or H3 exist', async () => {
    const html = minimalHtml('', '<h1>Title only</h1><p>Content</p>')
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: true })
    assert.ok(!issues.some(i => i.id === 'geo-no-question-headings'), 'should not flag when no h2/h3')
  })

  it('does not flag when includeHeuristics is false', async () => {
    const html = minimalHtml('', '<h2>Features</h2><h3>Pricing</h3><p>Content</p>')
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: false })
    assert.ok(!issues.some(i => i.id === 'geo-no-question-headings'), 'should not flag when heuristics disabled')
  })
})

describe('geo-answer-first-paragraph', () => {
  it('flags when first paragraph has fewer than 50 words', async () => {
    const html = minimalHtml('', '<h1>Title</h1><p>Short intro.</p>')
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: true })
    assert.ok(issues.some(i => i.id === 'geo-answer-first-paragraph'), 'should flag short first paragraph')
  })

  it('flags when no paragraph found', async () => {
    const html = minimalHtml('', '<h1>Title</h1><div>No paragraphs here</div>')
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: true })
    assert.ok(issues.some(i => i.id === 'geo-answer-first-paragraph'), 'should flag when no <p> found')
  })

  it('does not flag when first paragraph is 50+ words', async () => {
    const longPara =
      'This product is a comprehensive web audit tool that helps developers and founders understand exactly why their website is not getting found in Google search results, ChatGPT answers, Claude AI responses, and Perplexity citations. It runs automated checks and provides clear, actionable fix prompts for every single issue it finds across all categories.'
    const html = minimalHtml('', `<h1>Title</h1><p>${longPara}</p>`)
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: true })
    assert.ok(!issues.some(i => i.id === 'geo-answer-first-paragraph'), 'should not flag 50+ word paragraph')
  })

  it('does not flag when includeHeuristics is false', async () => {
    const html = minimalHtml('', '<h1>Title</h1><p>Short.</p>')
    const issues = await runAIVisibilityChecks('https://test.com', html, { includeHeuristics: false })
    assert.ok(!issues.some(i => i.id === 'geo-answer-first-paragraph'), 'should not flag when heuristics disabled')
  })
})
