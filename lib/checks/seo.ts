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

export async function runSEOChecks(url: string, html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];

  const title = $('title').text().trim();
  if (!title) {
    issues.push(makeIssue('missing-title', 'seo', 'high', 'Title tag missing', 'Your page has no title tag. Search engines use this as the headline in results — without it your page will barely rank.'));
  } else if (title.length < 30 || title.length > 60) {
    issues.push({
      ...makeIssue('title-length', 'seo', 'medium', 'Title tag length is off', `Your title is ${title.length} characters. Google truncates titles outside 30–60 chars, hurting click-through rates.`),
      value: `${title.length} chars`,
    });
  }

  const desc = $('meta[name="description"]').attr('content') ?? '';
  if (!desc) {
    issues.push(makeIssue('missing-description', 'seo', 'high', 'Meta description missing', 'No meta description found. Google often pulls this as the snippet under your title — a missing one means auto-generated, usually worse text.'));
  }

  const h1s = $('h1');
  if (h1s.length !== 1) {
    issues.push({
      ...makeIssue('missing-h1', 'seo', 'high', 'H1 tag count is wrong', `You have ${h1s.length} H1 tags. Every page should have exactly one — it signals the main topic to search engines.`),
      value: `${h1s.length} found`,
    });
  }

  if (!$('link[rel="canonical"]').attr('href')) {
    issues.push(makeIssue('missing-canonical', 'seo', 'medium', 'Canonical link missing', 'No canonical URL declared. This can cause duplicate-content penalties if the same page is accessible via multiple URLs.'));
  }

  const ogImage = $('meta[property="og:image"]').attr('content');

  if (!$('meta[property="og:title"]').attr('content')) {
    issues.push(makeIssue('missing-og-title', 'seo', 'high', 'og:title missing', 'When someone shares your link, social platforms show no title — just a bare URL. Add an og:title to control the preview.'));
  }

  if (!$('meta[property="og:description"]').attr('content')) {
    issues.push(makeIssue('missing-og-description', 'seo', 'medium', 'og:description missing', 'Social share previews will have no description text, making your link look unfinished and lowering click-through.'));
  }

  if (!ogImage) {
    issues.push(makeIssue('missing-og-image', 'seo', 'high', 'og:image missing', 'When someone shares your link on Twitter or Telegram, no image appears. This cuts click-through rates by up to 3×.'));
  } else {
    try {
      const r = await fetch(ogImage, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
      if (!r.ok) {
        issues.push(makeIssue('og-image-invalid', 'seo', 'high', 'og:image URL is broken', `The og:image URL returns HTTP ${r.status}. Social platforms will show no image when your link is shared.`));
      }
    } catch {
      issues.push(makeIssue('og-image-invalid', 'seo', 'high', 'og:image URL is broken', 'The og:image URL could not be fetched. Social platforms will show no image when your link is shared.'));
    }
  }

  if (!$('meta[name="twitter:card"]').attr('content')) {
    issues.push(makeIssue('missing-twitter-card', 'seo', 'low', 'twitter:card missing', 'Without twitter:card, Twitter/X shows a plain-text link instead of a rich card with image and description.'));
  }

  const body = $('body').text().toLowerCase();
  if (['lorem ipsum', 'your name here'].some(p => body.includes(p))) {
    issues.push(makeIssue('placeholder-text', 'seo', 'medium', 'Placeholder text found', 'Your page contains placeholder text like "Lorem ipsum". This looks unprofessional and hurts SEO.'));
  }

  return issues;
}
