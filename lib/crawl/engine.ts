import { load } from 'cheerio'

import { isRobotsAllowed, parseRobotsTxt } from '@/lib/crawl/robots'
import { isSameOriginUrl, normalizeCrawlUrl } from '@/lib/crawl/url'

export interface CrawlPage {
  url: string
  depth: number
  status: number
  html: string
  headers: Headers
}

export interface CrawlOptions {
  maxDepth: number
  maxPages: number
  userAgent?: string
}

export interface CrawlPageResponse {
  url: string
  html: string
  status: number
  headers: Headers
}

export interface CrawlRequest {
  startUrl: string
  options: CrawlOptions
  fetchPage: (url: string, depth: number) => Promise<CrawlPageResponse>
  loadRobotsTxt?: (origin: string) => Promise<string | null>
}

export interface CrawlResult {
  pages: CrawlPage[]
  visitedUrls: string[]
  discoveredUrls: string[]
  blockedByRobots: string[]
  skippedByLimit: string[]
}

interface QueueEntry {
  url: string
  depth: number
}

const DEFAULT_USER_AGENT = 'ShipReadyBot'

function extractLinks(html: string, currentUrl: string): string[] {
  const $ = load(html)
  return $('a[href]')
    .toArray()
    .map((element) => $(element).attr('href'))
    .filter((href): href is string => Boolean(href))
    .map((href) => normalizeCrawlUrl(href, currentUrl))
    .filter((href): href is string => Boolean(href))
}

export async function crawlSite(request: CrawlRequest): Promise<CrawlResult> {
  const startUrl = normalizeCrawlUrl(request.startUrl)
  if (!startUrl) {
    throw new Error('Invalid crawl start URL')
  }

  const userAgent = request.options.userAgent ?? DEFAULT_USER_AGENT
  const seen = new Set<string>([startUrl])
  const discoveredUrls = new Set<string>([startUrl])
  const blockedByRobots = new Set<string>()
  const skippedByLimit = new Set<string>()
  const pages: CrawlPage[] = []
  const queue: QueueEntry[] = [{ url: startUrl, depth: 0 }]

  let robotsPolicy = null as ReturnType<typeof parseRobotsTxt> | null
  if (request.loadRobotsTxt) {
    const robotsTxt = await request.loadRobotsTxt(new URL(startUrl).origin)
    if (robotsTxt) {
      robotsPolicy = parseRobotsTxt(robotsTxt)
    }
  }

  while (queue.length > 0 && pages.length < request.options.maxPages) {
    const current = queue.shift()!
    const page = await request.fetchPage(current.url, current.depth)

    pages.push({
      url: current.url,
      depth: current.depth,
      status: page.status,
      html: page.html,
      headers: page.headers,
    })

    if (current.depth >= request.options.maxDepth || pages.length >= request.options.maxPages) {
      continue
    }

    for (const candidate of extractLinks(page.html, current.url)) {
      if (!isSameOriginUrl(candidate, startUrl)) {
        continue
      }

      discoveredUrls.add(candidate)
      if (seen.has(candidate)) {
        continue
      }

      seen.add(candidate)

      if (robotsPolicy && !isRobotsAllowed(robotsPolicy, userAgent, candidate)) {
        blockedByRobots.add(candidate)
        continue
      }

      if (pages.length + queue.length >= request.options.maxPages) {
        skippedByLimit.add(candidate)
        continue
      }

      queue.push({ url: candidate, depth: current.depth + 1 })
    }
  }

  for (const remaining of queue) {
    skippedByLimit.add(remaining.url)
  }

  return {
    pages,
    visitedUrls: pages.map((page) => page.url),
    discoveredUrls: [...discoveredUrls],
    blockedByRobots: [...blockedByRobots],
    skippedByLimit: [...skippedByLimit],
  }
}
