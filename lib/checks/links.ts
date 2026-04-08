import * as cheerio from 'cheerio'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'
import { fetchWithHeadFallback } from '@/lib/checks/fetch-context'

export async function runLinksCheck(url: string, html: string): Promise<Issue[]> {
  const $ = cheerio.load(html)
  const origin = new URL(url).origin

  const links = $('a[href]')
    .map((_, el) => $(el).attr('href')!)
    .get()
    .filter(href => href?.startsWith('/') || href?.startsWith(origin))
    .map(href => (href.startsWith('/') ? origin + href : href))
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 20)

  if (links.length === 0) return []

  const results = await Promise.allSettled(
    links.map(async (link) => {
      const response = await fetchWithHeadFallback(link, 3000)
      return { ...response, url: link }
    }),
  )

  const broken = results
    .filter((result): result is PromiseFulfilledResult<{ ok: boolean; status: number; method: 'HEAD' | 'GET'; url: string }> => result.status === 'fulfilled')
    .filter(result => result.value.status === 404 || result.value.status >= 500)

  if (broken.length === 0) return []

  return [
    withIssueMeta(
      { ...T['broken-links'], value: `${broken.length} broken` },
      'link-check',
      [
        evidence('count', 'Broken links found', broken.length),
        evidence('response', 'Sample broken link', broken[0].value.url),
        evidence('response', 'Sample status', broken[0].value.status),
      ],
    ),
  ]
}
