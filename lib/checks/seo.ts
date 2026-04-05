import * as cheerio from 'cheerio';
import type { Issue } from '@/types/scan';
import { T } from '@/lib/ai/issue-templates';

export async function runSEOChecks(url: string, html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];

  const title = $('title').text().trim();
  if (!title) {
    issues.push({ ...T['missing-title'] });
  } else if (title.length < 30 || title.length > 60) {
    issues.push({ ...T['title-length'], value: `${title.length} chars` });
  }

  const desc = $('meta[name="description"]').attr('content') ?? '';
  if (!desc) {
    issues.push({ ...T['missing-description'] });
  }

  const h1s = $('h1');
  if (h1s.length !== 1) {
    issues.push({ ...T['missing-h1'], value: `${h1s.length} found` });
  }

  if (!$('link[rel="canonical"]').attr('href')) {
    issues.push({ ...T['missing-canonical'] });
  }

  const ogImage = $('meta[property="og:image"]').attr('content');

  if (!$('meta[property="og:title"]').attr('content')) {
    issues.push({ ...T['missing-og-title'] });
  }

  if (!$('meta[property="og:description"]').attr('content')) {
    issues.push({ ...T['missing-og-description'] });
  }

  if (!ogImage) {
    issues.push({ ...T['missing-og-image'] });
  } else {
    try {
      const r = await fetch(ogImage, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
      if (!r.ok) {
        issues.push({ ...T['og-image-invalid'] });
      }
    } catch {
      issues.push({ ...T['og-image-invalid'] });
    }
  }

  if (!$('meta[name="twitter:card"]').attr('content')) {
    issues.push({ ...T['missing-twitter-card'] });
  }

  const body = $('body').text().toLowerCase();
  if (['lorem ipsum', 'your name here'].some(p => body.includes(p))) {
    issues.push({ ...T['placeholder-text'] });
  }

  return issues;
}
