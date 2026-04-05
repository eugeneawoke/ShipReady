import * as cheerio from 'cheerio';
import type { Issue } from '@/types/scan';
import { T } from '@/lib/ai/issue-templates';

export async function runLinksCheck(url: string, html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const origin = new URL(url).origin;

  const links = $('a[href]')
    .map((_, el) => $(el).attr('href')!)
    .get()
    .filter(h => h?.startsWith('/') || h?.startsWith(origin))
    .map(h => (h.startsWith('/') ? origin + h : h))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 20);

  const results = await Promise.allSettled(
    links.map(link =>
      fetch(link, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).then(r => ({
        url: link,
        status: r.status,
      })),
    ),
  );

  const broken = results
    .filter((r): r is PromiseFulfilledResult<{ url: string; status: number }> => r.status === 'fulfilled')
    .filter(r => r.value.status === 404 || r.value.status >= 500)
    .map(r => r.value.url);

  return broken.length > 0
    ? [{ ...T['broken-links'], value: `${broken.length} broken` }]
    : [];
}
