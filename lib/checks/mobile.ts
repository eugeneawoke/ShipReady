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

export async function runMobileChecks(html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];

  const viewport = $('meta[name="viewport"]').attr('content') ?? '';

  if (!viewport) {
    issues.push(makeIssue('missing-viewport', 'mobile', 'critical', 'Viewport meta tag missing', 'Your page has no viewport tag. On mobile it will render as a tiny desktop page — basically unusable without pinching and zooming.'));
  } else if (viewport.includes('user-scalable=no')) {
    issues.push(makeIssue('blocking-viewport', 'mobile', 'high', 'Viewport blocks user zoom', 'Your viewport sets user-scalable=no, preventing users from zooming. This breaks accessibility and violates WCAG 1.4.4.'));
  }

  if (!$('link[rel*="icon"]').first().attr('href')) {
    issues.push(makeIssue('missing-favicon', 'mobile', 'low', 'Favicon missing', 'No favicon found. Browsers show a blank tab icon, which makes your site look unfinished and harder to find in tab lists.'));
  }

  if (!$('link[rel="apple-touch-icon"]').length) {
    issues.push(makeIssue('missing-touch-icon', 'mobile', 'low', 'Apple touch icon missing', 'No apple-touch-icon found. When iOS users add your site to their home screen, they get an ugly screenshot instead of a proper icon.'));
  }

  return issues;
}
