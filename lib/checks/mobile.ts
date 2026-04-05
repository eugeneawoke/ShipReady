import * as cheerio from 'cheerio';
import type { Issue } from '@/types/scan';
import { T } from '@/lib/ai/issue-templates';

export async function runMobileChecks(html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];

  const viewport = $('meta[name="viewport"]').attr('content') ?? '';

  if (!viewport) {
    issues.push({ ...T['missing-viewport'] });
  } else if (viewport.includes('user-scalable=no')) {
    issues.push({ ...T['blocking-viewport'] });
  }

  if (!$('link[rel*="icon"]').first().attr('href')) {
    issues.push({ ...T['missing-favicon'] });
  }

  if (!$('link[rel="apple-touch-icon"]').length) {
    issues.push({ ...T['missing-touch-icon'] });
  }

  return issues;
}
