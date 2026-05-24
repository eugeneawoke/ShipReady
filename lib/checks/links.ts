import * as cheerio from 'cheerio'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'
import { fetchWithHeadFallback } from '@/lib/checks/fetch-context'
import { assertPublicHost } from '@/lib/server/url-safety'

async function countRedirectHops(startUrl: string, maxHops = 5): Promise<number> {
  let current = startUrl
  let hops = 0

  for (let i = 0; i < maxHops; i++) {
    try {
      const res = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      })

      if (res.status < 300 || res.status >= 400) break

      const location = res.headers.get('location')
      if (!location) break

      const nextUrl = location.startsWith('http') ? location : new URL(location, current).href

      // SSRF guard: validate redirect destination before following
      try {
        await assertPublicHost(new URL(nextUrl).hostname)
      } catch {
        // Redirect leads to private/blocked host — stop counting, don't follow
        break
      }

      hops++
      current = nextUrl
    } catch {
      break
    }
  }

  return hops
}

export async function runLinksCheck(url: string, html: string): Promise<Issue[]> {
  const issues: Issue[] = []

  const hops = await countRedirectHops(url)
  if (hops >= 2) {
    issues.push(
      withIssueMeta(
        { ...T['redirect-chain'], value: `${hops} hops` },
        'link-check',
        [evidence('count', 'Redirect hops', hops)],
      ),
    )
  }

  const $ = cheerio.load(html)
  const origin = new URL(url).origin

  const links = $('a[href]')
    .map((_, el) => $(el).attr('href')!)
    .get()
    .filter(href => href?.startsWith('/') || href?.startsWith(origin))
    .map(href => (href.startsWith('/') ? origin + href : href))
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 20)

  if (links.length === 0) return issues

  const results = await Promise.allSettled(
    links.map(async (link) => {
      const response = await fetchWithHeadFallback(link, 3000)
      return { ...response, url: link }
    }),
  )

  const broken = results
    .filter((result): result is PromiseFulfilledResult<{ ok: boolean; status: number; method: 'HEAD' | 'GET'; url: string }> => result.status === 'fulfilled')
    .filter(result => result.value.status === 404 || result.value.status >= 500)

  if (broken.length > 0) {
    issues.push(
      withIssueMeta(
        { ...T['broken-links'], value: `${broken.length} broken` },
        'link-check',
        [
          evidence('count', 'Broken links found', broken.length),
          evidence('response', 'Sample broken link', broken[0].value.url),
          evidence('response', 'Sample status', broken[0].value.status),
        ],
      ),
    )
  }

  return issues
}
