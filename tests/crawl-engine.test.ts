import test from 'node:test'
import assert from 'node:assert/strict'

import { crawlSite } from '../lib/crawl/engine'
import { isRobotsAllowed, parseRobotsTxt } from '../lib/crawl/robots'
import { normalizeCrawlUrl } from '../lib/crawl/url'

test('normalizeCrawlUrl canonicalizes host, default ports, hashes, and query ordering', () => {
  assert.equal(
    normalizeCrawlUrl('HTTPS://Example.com:443/docs/?b=2&a=1#section'),
    'https://example.com/docs?a=1&b=2',
  )
  assert.equal(
    normalizeCrawlUrl('https://example.com'),
    'https://example.com/',
  )
})

test('parseRobotsTxt applies user-agent specific rules with wildcard fallback', () => {
  const robots = parseRobotsTxt(`
User-agent: *
Disallow: /private

User-agent: ShipReadyBot
Allow: /private/allowed
Disallow: /private
`)

  assert.equal(isRobotsAllowed(robots, 'ShipReadyBot', 'https://example.com/'), true)
  assert.equal(isRobotsAllowed(robots, 'ShipReadyBot', 'https://example.com/private'), false)
  assert.equal(isRobotsAllowed(robots, 'ShipReadyBot', 'https://example.com/private/allowed'), true)
})

test('crawlSite respects same-origin boundaries, deduplicates URLs, and enforces depth/page limits', async () => {
  const htmlByUrl = new Map<string, string>([
    ['https://example.com/', `
      <a href="/about">About</a>
      <a href="/about#team">About team</a>
      <a href="/blog?b=2&a=1">Blog</a>
      <a href="https://external.example.net/ignore">External</a>
    `],
    ['https://example.com/about', `
      <a href="/team">Team</a>
      <a href="/private">Private</a>
    `],
    ['https://example.com/blog?a=1&b=2', `
      <a href="/blog/post-1">Post</a>
    `],
    ['https://example.com/team', '<p>Team</p>'],
    ['https://example.com/private', '<p>Private</p>'],
    ['https://example.com/blog/post-1', '<p>Post</p>'],
  ])

  const fetched: string[] = []

  const result = await crawlSite({
    startUrl: 'https://example.com/',
    options: {
      maxDepth: 2,
      maxPages: 3,
      userAgent: 'ShipReadyBot',
    },
    loadRobotsTxt: async () => `
User-agent: *
Disallow: /private
`,
    fetchPage: async (url) => {
      fetched.push(url)
      const html = htmlByUrl.get(url)
      if (!html) {
        throw new Error(`Unexpected fetch for ${url}`)
      }

      return {
        url,
        html,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
      }
    },
  })

  assert.deepEqual(result.visitedUrls, [
    'https://example.com/',
    'https://example.com/about',
    'https://example.com/blog?a=1&b=2',
  ])
  assert.deepEqual(fetched, result.visitedUrls)
  assert.equal(result.pages.length, 3)
  assert.equal(result.pages[0]?.depth, 0)
  assert.equal(result.pages[1]?.depth, 1)
  assert.equal(result.pages[2]?.depth, 1)
  assert.equal(result.discoveredUrls.includes('https://external.example.net/ignore'), false)
  assert.equal(result.blockedByRobots.includes('https://example.com/private'), true)
  assert.equal(result.skippedByLimit.includes('https://example.com/team'), true)
})

test('crawlSite tracks URLs skipped once the page budget is exhausted', async () => {
  const result = await crawlSite({
    startUrl: 'https://example.com/',
    options: {
      maxDepth: 2,
      maxPages: 2,
    },
    fetchPage: async (url) => ({
      url,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      html: url === 'https://example.com/'
        ? '<a href="/a">A</a><a href="/b">B</a>'
        : '<a href="/c">C</a>',
    }),
  })

  assert.deepEqual(result.visitedUrls, [
    'https://example.com/',
    'https://example.com/a',
  ])
  assert.deepEqual(result.skippedByLimit, ['https://example.com/b'])
})
