# CHECKS

> Полная спецификация всех 25 проверок с кодом реализации.
> Читать при работе над lib/checks/ и lib/ai/issue-templates.ts

---

## Установка зависимостей

```bash
npm i @supabase/supabase-js @supabase/ssr
npm i @sparticuz/chromium lighthouse puppeteer-core
npm i cheerio ssl-checker @anthropic-ai/sdk
npm i @lemonsqueezy/lemonsqueezy.js resend zod
npm i lucide-react framer-motion next-intl geist
```

---

## vercel.json (обязательно)

```json
{
  "functions": {
    "app/api/scan/route.ts": {
      "maxDuration": 60,
      "memory": 3009
    }
  },
  "regions": ["fra1"]
}
```

---

## Архитектура scan flow

```
POST /api/scan { url }
  → Supabase insert (status: 'pending') → return { id } немедленно
  → фоновая задача runAllChecks(url, scanId):
      html = await fetch(url) → одна строка для всех checks
      Promise.all([
        runLighthouse(url),        ← отдельный Chrome процесс
        runSEOChecks(url, html),   ← cheerio парсинг
        runSecurityChecks(url, html),
        runMobileChecks(html),
        runLinksCheck(url, html),
      ])
      → generateAISummary(results) ← один Claude вызов
      → Supabase update (status: 'done', results: ScanResult)
```

---

## lib/checks/lighthouse.ts

```typescript
import chromium from '@sparticuz/chromium';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';

export async function runLighthouse(url: string) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const { lhr } = await lighthouse(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'seo'],
    formFactor: 'mobile',
  });
  await browser.close();
  return {
    performanceScore: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    seoScore:         Math.round((lhr.categories.seo?.score ?? 0) * 100),
    a11yScore:        Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
    lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? 0,
    cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
    inp: lhr.audits['interaction-to-next-paint']?.numericValue ?? 0,
    fcp: lhr.audits['first-contentful-paint']?.numericValue ?? 0,
  };
}
```

**Issues:** `lcp-slow` (high, >2500ms) · `cls-high` (high, >0.1) · `inp-slow` (medium, >200ms) · `fcp-slow` (medium, >1800ms) · `perf-score-low` (high, <70) · `a11y-score-low` (medium, <70)

---

## lib/checks/seo.ts

```typescript
import * as cheerio from 'cheerio';

export async function runSEOChecks(url: string, html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];

  const title = $('title').text().trim();
  if (!title) issues.push(T['missing-title']);
  else if (title.length < 30 || title.length > 60)
    issues.push({ ...T['title-length'], value: `${title.length} chars` });

  const desc = $('meta[name="description"]').attr('content') ?? '';
  if (!desc) issues.push(T['missing-description']);

  const h1s = $('h1');
  if (h1s.length !== 1) issues.push({ ...T['missing-h1'], value: `${h1s.length} found` });

  if (!$('link[rel="canonical"]').attr('href')) issues.push(T['missing-canonical']);

  const ogImage = $('meta[property="og:image"]').attr('content');
  if (!$('meta[property="og:title"]').attr('content'))       issues.push(T['missing-og-title']);
  if (!$('meta[property="og:description"]').attr('content')) issues.push(T['missing-og-description']);
  if (!ogImage) {
    issues.push(T['missing-og-image']);
  } else {
    try {
      const r = await fetch(ogImage, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
      if (!r.ok) issues.push(T['og-image-invalid']);
    } catch { issues.push(T['og-image-invalid']); }
  }

  if (!$('meta[name="twitter:card"]').attr('content')) issues.push(T['missing-twitter-card']);

  const body = $('body').text().toLowerCase();
  if (['lorem ipsum', 'your name here'].some(p => body.includes(p)))
    issues.push(T['placeholder-text']);

  return issues;
}
```

**Issues:** `missing-title` (high) · `title-length` (medium) · `missing-description` (high) · `missing-h1` (high) · `missing-canonical` (medium) · `missing-og-title` (high) · `missing-og-description` (medium) · `missing-og-image` (high) · `og-image-invalid` (high) · `missing-twitter-card` (low) · `placeholder-text` (medium)

---

## lib/checks/security.ts

```typescript
import sslChecker from 'ssl-checker';
import * as cheerio from 'cheerio';

export async function runSecurityChecks(url: string, html: string): Promise<Issue[]> {
  const issues: Issue[] = [];

  if (!url.startsWith('https://')) return [T['no-https']]; // ранний выход

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const h = res.headers;

  if (!h.get('strict-transport-security'))  issues.push(T['missing-hsts']);
  if (!h.get('x-frame-options'))            issues.push(T['missing-x-frame']);
  if (!h.get('x-content-type-options'))     issues.push(T['missing-xcto']);
  if (!h.get('referrer-policy'))            issues.push(T['missing-referrer-policy']);

  const csp = h.get('content-security-policy');
  if (!csp) issues.push(T['missing-csp']);
  else if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'"))
    issues.push(T['unsafe-csp']);

  const domain = new URL(url).hostname;
  try {
    const ssl = await sslChecker(domain, { timeout: 5000 });
    if (ssl.daysRemaining < 30)
      issues.push({ ...T['ssl-expiring'], value: `${ssl.daysRemaining} days` });
  } catch {}

  // Exposed sensitive files
  const origin = new URL(url).origin;
  for (const file of ['.env', '.env.local', '.env.production', '.git/config']) {
    try {
      const r = await fetch(`${origin}/${file}`, { signal: AbortSignal.timeout(3000) });
      if (r.status === 200) {
        const text = await r.text();
        if (text.includes('=') && !text.includes('<html')) { // не 404-страница
          issues.push({ ...T['exposed-env-file'], value: file });
          break;
        }
      }
    } catch {}
  }

  // API keys in HTML
  const keyPatterns = [
    { re: /sk-[a-zA-Z0-9]{20,}/,       name: 'OpenAI key' },
    { re: /pk_live_[a-zA-Z0-9]{20,}/,  name: 'Stripe live key' },
    { re: /AIzaSy[a-zA-Z0-9_-]{33}/,   name: 'Google API key' },
    { re: /ghp_[a-zA-Z0-9]{36}/,       name: 'GitHub token' },
    { re: /AKIA[0-9A-Z]{16}/,          name: 'AWS access key' },
  ];
  for (const { re, name } of keyPatterns) {
    if (re.test(html)) {
      issues.push({ ...T['api-key-in-html'], value: name }); // value = ТИП, не сам ключ
      break;
    }
  }

  // Mixed content
  const $ = cheerio.load(html);
  if ($('script[src^="http://"], link[href^="http://"], img[src^="http://"]').length > 0)
    issues.push(T['mixed-content']);

  return issues;
}
```

**Issues:** `no-https` (critical) · `missing-hsts` (high) · `missing-x-frame` (medium) · `missing-xcto` (medium) · `missing-referrer-policy` (low) · `missing-csp` (high) · `unsafe-csp` (high) · `ssl-expiring` (high) · `exposed-env-file` (critical) · `api-key-in-html` (critical) · `mixed-content` (high)

---

## lib/checks/mobile.ts

```typescript
export async function runMobileChecks(html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  const viewport = $('meta[name="viewport"]').attr('content') ?? '';
  if (!viewport)                                  issues.push(T['missing-viewport']);
  else if (viewport.includes('user-scalable=no')) issues.push(T['blocking-viewport']);
  if (!$('link[rel*="icon"]').first().attr('href')) issues.push(T['missing-favicon']);
  if (!$('link[rel="apple-touch-icon"]').length)   issues.push(T['missing-touch-icon']);
  return issues;
}
```

**Issues:** `missing-viewport` (critical) · `blocking-viewport` (high) · `missing-favicon` (low) · `missing-touch-icon` (low)

---

## lib/checks/links.ts

```typescript
export async function runLinksCheck(url: string, html: string): Promise<Issue[]> {
  const $ = cheerio.load(html);
  const origin = new URL(url).origin;
  const links = $('a[href]').map((_, el) => $(el).attr('href')!).get()
    .filter(h => h?.startsWith('/') || h?.startsWith(origin))
    .map(h => h.startsWith('/') ? origin + h : h)
    .filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);

  const results = await Promise.allSettled(
    links.map(link => fetch(link, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      .then(r => ({ url: link, status: r.status })))
  );
  const broken = results
    .filter((r): r is PromiseFulfilledResult<{url:string,status:number}> => r.status === 'fulfilled')
    .filter(r => r.value.status === 404 || r.value.status >= 500)
    .map(r => r.value.url);

  return broken.length > 0
    ? [{ ...T['broken-links'], value: `${broken.length} broken` }]
    : [];
}
```

**Issues:** `broken-links` (high)

---

## lib/checks/index.ts — оркестратор

```typescript
export async function runAllChecks(url: string, scanId: string): Promise<void> {
  await supabase.from('scans').update({ status: 'running' }).eq('id', scanId);
  try {
    const html = await fetch(url, { signal: AbortSignal.timeout(10000) }).then(r => r.text());
    const [lh, seo, sec, mob, links] = await Promise.all([
      runLighthouse(url),
      runSEOChecks(url, html),
      runSecurityChecks(url, html),
      runMobileChecks(html),
      runLinksCheck(url, html),
    ]);
    const result = buildScanResult(url, lh, seo, sec, mob, links);
    try { result.aiSummary = await generateAISummary(result); } catch {}
    await supabase.from('scans')
      .update({ status: 'done', results: result, updated_at: new Date() })
      .eq('id', scanId);
  } catch {
    await supabase.from('scans').update({ status: 'error' }).eq('id', scanId);
  }
}
```

---

## lib/ai/generate-summary.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';

export async function generateAISummary(result: ScanResult): Promise<string> {
  const client = new Anthropic();
  const critical = getAllIssues(result).filter(i => i.severity === 'critical').length;
  const high     = getAllIssues(result).filter(i => i.severity === 'high').length;
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content:
      `Web quality expert. Write 2–3 sentence plain-English summary for a non-technical indie hacker.
URL: ${result.url} | Score: ${result.totalScore}/100
Critical: ${critical}, High: ${high}
Performance: ${result.performance.score} | Security: ${result.security.score} | SEO: ${result.seo.score}
Rules: no jargon without explanation · direct not scary · impact first · if score>70 end with encouragement` }],
  });
  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}
```

---

## lib/checks/ai-visibility.ts

```typescript
export async function runAIVisibilityChecks(url: string, html: string): Promise<Issue[]>
```

**AEO checks (Answer Engine Optimization):**

| ID | Условие | Severity |
|----|---------|----------|
| `missing-schema-org` | Нет `<script type="application/ld+json">` | high |
| `missing-faq-schema` | Есть FAQ контент, но нет FAQPage schema | medium |
| `poor-heading-hierarchy` | H1→H3 без H2, или другие пропуски уровней | medium |
| `thin-content` | Менее 300 слов текста на странице | medium |

**GEO checks (Generative Engine Optimization):**

| ID | Условие | Severity |
|----|---------|----------|
| `missing-llms-txt` | `/llms.txt` возвращает не 200 | medium |
| `ai-crawlers-blocked` | `robots.txt` блокирует GPTBot/ClaudeBot/PerplexityBot/CCBot | high |
| `missing-sitemap` | Нет `/sitemap.xml` и нет `<link rel="sitemap">` | medium |
| `missing-author-entity` | Нет About/Contact ссылки и нет Organization/Person schema | low |

**Scoring weight:** `ai_visibility × 0.20` (пересмотрены все веса: perf×0.25, seo×0.20, sec×0.25, mob×0.10, ai×0.20)

---

## lib/ai/issue-templates.ts — формат

```typescript
// Все 25 шаблонов. Severity по таблице ниже.
// value заполняется динамически в checks/*.ts

export const T: Record<string, Omit<Issue, 'value'>> = {
  'missing-og-image': {
    id: 'missing-og-image',
    category: 'seo',
    severity: 'high',
    title: 'Open Graph image missing',
    description: 'No og:image meta tag found.',
    plainEnglish: 'When someone shares your link on Twitter or Telegram, no image appears. This cuts click-through rates by up to 3×.',
    cursorPrompt: `Add og:image to my Next.js app:
1. Create public/og-image.png (1200×630px)
2. In app/layout.tsx add to metadata:
   openGraph: { images: [{ url: '/og-image.png', width: 1200, height: 630 }] }
Or use app/opengraph-image.tsx with next/og for dynamic generation.`,
    boltPrompt: `Add to HTML <head>:
<meta property="og:image" content="https://YOURDOMAIN.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
Upload a 1200×630px image to your public folder.`,
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/opengraph-image',
  },
  'exposed-env-file': {
    id: 'exposed-env-file',
    category: 'security',
    severity: 'critical',
    title: 'Environment file publicly accessible',
    description: '.env or config file returns 200 at a public URL.',
    plainEnglish: 'Your API keys and passwords are visible to anyone right now. Attackers scan for this automatically — rotate your keys immediately.',
    cursorPrompt: `URGENT — do this now:
1. Go to OpenAI/Stripe/etc. dashboards and revoke all exposed keys
2. Generate new keys and add them to Vercel Environment Variables
3. Verify .env and .env.local are in .gitignore
4. Check next.config.js has no rewrites exposing .env
5. Redeploy`,
    boltPrompt: `URGENT:
1. Immediately revoke all API keys that were in the exposed file
2. Never put .env files in your public folder
3. Store all secrets in your hosting platform's Environment Variables only
4. Redeploy your app`,
    docsUrl: 'https://nextjs.org/docs/app/building-your-application/configuring/environment-variables',
  },
  // ... остальные 23 шаблона по той же структуре
};

// Полный список всех 33 ID:
// Performance:   lcp-slow, cls-high, inp-slow, fcp-slow, perf-score-low, a11y-score-low
// SEO/Social:    missing-title, title-length, missing-description, missing-h1, missing-canonical,
//                missing-og-title, missing-og-description, missing-og-image, og-image-invalid,
//                missing-twitter-card, placeholder-text
// Security:      no-https, missing-hsts, missing-x-frame, missing-xcto, missing-referrer-policy,
//                missing-csp, unsafe-csp, ssl-expiring, exposed-env-file, api-key-in-html, mixed-content
// Mobile:        missing-viewport, blocking-viewport, missing-favicon, missing-touch-icon
// Links:         broken-links
// AI Visibility: missing-schema-org, missing-faq-schema, poor-heading-hierarchy, thin-content,
//                missing-llms-txt, ai-crawlers-blocked, missing-sitemap, missing-author-entity
```
