import * as cheerio from 'cheerio';
import type { Issue } from '@/types/scan';

function makeIssue(
  id: string,
  category: Issue['category'],
  severity: Issue['severity'],
  title: string,
  plainEnglish: string,
): Issue {
  return { id, category, severity, title, description: title, plainEnglish, cursorPrompt: '', boltPrompt: '' };
}

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
    ? [
        {
          ...makeIssue(
            'broken-links',
            'seo',
            'high',
            'Broken internal links found',
            `${broken.length} internal link(s) return 404 or 5xx errors. Broken links hurt SEO rankings and frustrate visitors who can't reach the destination.`,
          ),
          value: `${broken.length} broken`,
        },
      ]
    : [];
}
