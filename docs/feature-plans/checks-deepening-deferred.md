# Checks Deepening — Deferred Plan (Paid APIs & Complex Integrations)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement advanced checks requiring paid API keys, OAuth flows, or significant infrastructure that are deferred from the main checks-deepening plan.

**Architecture:** Each integration is isolated in `lib/providers/` with a consistent `Result | null` return contract. Checks are gated by env-var presence so the scanner degrades gracefully when keys are absent. All checks follow the existing quality contract: `confidence`, `evidence[]`, `scoreEligible`.

**Tech Stack:** Ahrefs API v3, Semrush API, DataForSEO REST API, Google Search Console API (OAuth2), Bing Webmaster Tools API, OWASP ZAP REST, NVD API v2 + EPSS API, `/.well-known/mcp.json` discovery, Vercel Log Drains

**Prerequisite:** `docs/feature-plans/checks-deepening-main.md` must be complete before starting this plan.

---

## File Map

```
lib/providers/
  ahrefs.ts          — Ahrefs v3 API client (backlinks, DR, referring domains)
  semrush.ts         — Semrush API client (organic traffic estimate, keyword count)
  dataforseo.ts      — DataForSEO SERP/rank check client
  gsc.ts             — Google Search Console OAuth2 client (indexed pages, crawl errors)
  bing-webmaster.ts  — Bing Webmaster Tools API client (crawl stats)
  zap.ts             — OWASP ZAP REST client (active scan trigger + poll)
  nvd.ts             — NVD API v2 + EPSS client (full CVE scoring pipeline)
  mcp-discovery.ts   — /.well-known/mcp.json discovery check

lib/checks/
  seo.ts             — new: backlinks-none, no-organic-traffic, not-indexed-gsc
  security.ts        — new: zap-active-findings, vulnerable-lib-high-epss
  ai-visibility.ts   — new: mcp-json-missing, mcp-json-invalid

app/
  api/
    auth/gsc/route.ts   — GSC OAuth2 callback handler
    auth/bing/route.ts  — Bing OAuth callback handler

docs/feature-plans/checks-deepening-deferred.md   — this file
```

---

## Task D1: Ahrefs API — Backlink & Authority Checks

**Files:**
- Create: `lib/providers/ahrefs.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/seo.ts`

**New env var:** `AHREFS_API_KEY`

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `backlinks-none` | Domain has 0 referring domains in Ahrefs | verified | true |
| `dr-very-low` | Domain Rating < 5 (very low authority) | verified | false |

- [ ] **Step 1: Add issue templates**

In `lib/ai/issue-templates.ts`, add:

```typescript
'backlinks-none': {
  id: 'backlinks-none',
  category: 'seo',
  severity: 'medium',
  title: 'No external backlinks detected',
  description: 'Ahrefs reports 0 referring domains linking to this site.',
  plainEnglish: 'No other websites link to yours. Backlinks are a major Google ranking signal.',
  fixPrompt: 'Create shareable content, submit to directories, and reach out for link placements. Start with industry-relevant resource pages.',
},
'dr-very-low': {
  id: 'dr-very-low',
  category: 'seo',
  severity: 'info',
  title: 'Very low domain authority (DR < 5)',
  description: 'Ahrefs Domain Rating is below 5, indicating minimal link equity.',
  plainEnglish: 'Your site has very little link authority. This takes time and consistent effort to build.',
  fixPrompt: 'Focus on earning quality backlinks from relevant, authoritative sites in your niche.',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

In `lib/checks/issue-meta.ts`:

```typescript
'backlinks-none': { confidence: 'verified', scoreEligible: true },
'dr-very-low': { confidence: 'verified', scoreEligible: false },
```

- [ ] **Step 3: Create Ahrefs provider**

Create `lib/providers/ahrefs.ts`:

```typescript
export interface AhrefsResult {
  refDomains: number
  domainRating: number
}

export async function fetchAhrefsData(
  domain: string,
  timeoutMs = 10_000,
): Promise<AhrefsResult | null> {
  const key = process.env.AHREFS_API_KEY
  if (!key) return null

  const url = new URL('https://api.ahrefs.com/v3/site-explorer/domain-rating')
  url.searchParams.set('target', domain)
  url.searchParams.set('date', new Date().toISOString().slice(0, 10))

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const json = await res.json()
    return {
      domainRating: json.domain?.domain_rating ?? 0,
      refDomains: json.domain?.refdomains ?? 0,
    }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Add Ahrefs checks to seo.ts**

In `runSEOChecks`, after existing checks, add a block gated on Ahrefs data being available in `context`:

```typescript
const ahrefsData = context?.ahrefs ?? null
if (ahrefsData) {
  if (ahrefsData.refDomains === 0) {
    issues.push(withIssueMeta('backlinks-none', {
      value: '0 referring domains',
      evidence: [evidence('Ahrefs API', `refdomains = 0`)],
      source: 'ahrefs',
    }))
  }
  if (ahrefsData.domainRating < 5) {
    issues.push(withIssueMeta('dr-very-low', {
      value: `DR ${ahrefsData.domainRating}`,
      evidence: [evidence('Ahrefs API', `Domain Rating = ${ahrefsData.domainRating}`)],
      source: 'ahrefs',
    }))
  }
}
```

- [ ] **Step 5: Wire Ahrefs fetch into Deep Pass**

In `lib/checks/index.ts`, in the Deep Pass block, add:

```typescript
const ahrefsResult = await safeTask('ahrefs', () =>
  fetchAhrefsData(hostname),
)
providerData.ahrefs = ahrefsResult ?? null
```

Then pass `ahrefs: providerData.ahrefs` into the SEO checks context object.

- [ ] **Step 6: Build check**

```bash
npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add lib/providers/ahrefs.ts lib/checks/seo.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts lib/checks/index.ts
git commit -m "feat: add Ahrefs backlink and domain authority checks (deferred)"
```

---

## Task D2: Semrush API — Organic Visibility Check

**Files:**
- Create: `lib/providers/semrush.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/seo.ts`

**New env var:** `SEMRUSH_API_KEY`

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `no-organic-traffic` | Semrush estimates 0 organic visits/month | likely | true |

- [ ] **Step 1: Add issue template**

```typescript
'no-organic-traffic': {
  id: 'no-organic-traffic',
  category: 'seo',
  severity: 'high',
  title: 'No organic search traffic detected',
  description: 'Semrush estimates this site receives zero organic visits per month.',
  plainEnglish: 'Your site is not appearing in search results or receiving organic traffic from Google.',
  fixPrompt: 'Audit your indexing status in Google Search Console. Ensure your pages are not blocked by robots.txt or noindex tags, have proper title tags, and target relevant keywords.',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

```typescript
'no-organic-traffic': { confidence: 'likely', scoreEligible: true },
```

- [ ] **Step 3: Create Semrush provider**

Create `lib/providers/semrush.ts`:

```typescript
export interface SemrushResult {
  organicTraffic: number
  organicKeywords: number
}

export async function fetchSemrushData(
  domain: string,
  timeoutMs = 10_000,
): Promise<SemrushResult | null> {
  const key = process.env.SEMRUSH_API_KEY
  if (!key) return null

  const params = new URLSearchParams({
    type: 'domain_ranks',
    key,
    domain,
    database: 'us',
    export_columns: 'Or,Ot',
  })

  try {
    const res = await fetch(`https://api.semrush.com/?${params}`, {
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const text = await res.text()
    // CSV: header line then data line
    const lines = text.trim().split('\n')
    if (lines.length < 2) return null
    const [keywords, traffic] = lines[1].split(';').map(Number)
    return { organicKeywords: keywords ?? 0, organicTraffic: traffic ?? 0 }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Add check to seo.ts**

In the Semrush-gated block:

```typescript
const semrushData = context?.semrush ?? null
if (semrushData && semrushData.organicTraffic === 0) {
  issues.push(withIssueMeta('no-organic-traffic', {
    value: '0 organic visits/month',
    evidence: [evidence('Semrush API', `Organic traffic estimate = 0, keywords = ${semrushData.organicKeywords}`)],
    source: 'semrush',
  }))
}
```

- [ ] **Step 5: Wire into Deep Pass**

In `lib/checks/index.ts`:

```typescript
const semrushResult = await safeTask('semrush', () =>
  fetchSemrushData(hostname),
)
providerData.semrush = semrushResult ?? null
```

- [ ] **Step 6: Build and commit**

```bash
npm run build
git add lib/providers/semrush.ts lib/checks/seo.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts lib/checks/index.ts
git commit -m "feat: add Semrush organic traffic check (deferred)"
```

---

## Task D3: DataForSEO — SERP Rank Visibility Check

**Files:**
- Create: `lib/providers/dataforseo.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/seo.ts`

**New env vars:** `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `no-serp-presence` | Domain not found in top-100 for its own brand query | likely | false |

- [ ] **Step 1: Add issue template**

```typescript
'no-serp-presence': {
  id: 'no-serp-presence',
  category: 'seo',
  severity: 'medium',
  title: 'Site not ranking for its own brand name',
  description: 'DataForSEO did not find this domain in the top 100 results for a brand-name query.',
  plainEnglish: "Your site doesn't appear when people search for your brand. This may indicate a deindexation or branding issue.",
  fixPrompt: 'Check Google Search Console for manual actions or coverage issues. Verify your site is indexable and has consistent brand signals (title, About page, structured data).',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

```typescript
'no-serp-presence': { confidence: 'likely', scoreEligible: false },
```

- [ ] **Step 3: Create DataForSEO provider**

Create `lib/providers/dataforseo.ts`:

```typescript
export interface DataForSEOResult {
  brandRank: number | null
}

export async function fetchDataForSEOData(
  domain: string,
  brandQuery: string,
  timeoutMs = 15_000,
): Promise<DataForSEOResult | null> {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD
  if (!login || !password) return null

  const credentials = Buffer.from(`${login}:${password}`).toString('base64')

  try {
    const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keyword: brandQuery,
        location_code: 2840,
        language_code: 'en',
        depth: 100,
      }]),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const json = await res.json()
    const items: Array<{ domain: string; rank_absolute: number }> =
      json?.tasks?.[0]?.result?.[0]?.items ?? []
    const match = items.find(item => item.domain === domain)
    return { brandRank: match?.rank_absolute ?? null }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Wire into seo.ts and Deep Pass**

In seo.ts:
```typescript
const dfsData = context?.dataforseo ?? null
if (dfsData && dfsData.brandRank === null) {
  issues.push(withIssueMeta('no-serp-presence', {
    value: 'not in top 100',
    evidence: [evidence('DataForSEO', `Brand query returned no results for domain ${domain}`)],
    source: 'dataforseo',
  }))
}
```

In `lib/checks/index.ts` Deep Pass:
```typescript
// extract brand query from site title or hostname
const brandQuery = providerData.pagespeed?.title ?? hostname.replace(/^www\./, '')
const dfsResult = await safeTask('dataforseo', () =>
  fetchDataForSEOData(hostname, brandQuery),
)
providerData.dataforseo = dfsResult ?? null
```

- [ ] **Step 5: Build and commit**

```bash
npm run build
git add lib/providers/dataforseo.ts lib/checks/seo.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts lib/checks/index.ts
git commit -m "feat: add DataForSEO brand SERP presence check (deferred)"
```

---

## Task D4: Google Search Console OAuth — Indexed Pages & Crawl Errors

**Context:** GSC requires OAuth2 with domain ownership verification. This is a multi-step integration: user must connect their GSC property in the ShipReady dashboard before scan can use it. Data is stored in Supabase against the user's `site_id`.

**Files:**
- Create: `lib/providers/gsc.ts`
- Create: `app/api/auth/gsc/route.ts`
- Create: `supabase/migrations/YYYYMMDDHHMMSS_gsc_tokens.sql`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/seo.ts`

**New env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `gsc-not-connected` | User has not connected GSC (info nudge) | heuristic | false |
| `gsc-zero-indexed` | GSC reports 0 indexed pages | verified | true |
| `gsc-crawl-errors` | GSC reports crawl errors > 10 | verified | true |

- [ ] **Step 1: Add issue templates**

```typescript
'gsc-not-connected': {
  id: 'gsc-not-connected',
  category: 'seo',
  severity: 'info',
  title: 'Google Search Console not connected',
  description: 'Connect GSC to unlock indexed page count, crawl error data, and Core Web Vitals from real Google data.',
  plainEnglish: 'Connect your Google Search Console to get accurate indexing data directly from Google.',
  fixPrompt: 'Connect Google Search Console in your ShipReady dashboard settings.',
},
'gsc-zero-indexed': {
  id: 'gsc-zero-indexed',
  category: 'seo',
  severity: 'critical',
  title: 'Zero pages indexed in Google',
  description: 'Google Search Console reports this property has no indexed pages.',
  plainEnglish: 'Google has not indexed any of your pages. Your site is invisible in search results.',
  fixPrompt: 'Check for site-wide noindex tags, robots.txt blocking Googlebot, or manual actions in GSC. Submit a sitemap and request indexing.',
},
'gsc-crawl-errors': {
  id: 'gsc-crawl-errors',
  category: 'seo',
  severity: 'high',
  title: 'Crawl errors reported by Google',
  description: 'Google Search Console detected more than 10 crawl errors on this property.',
  plainEnglish: 'Google is running into errors when crawling your site, which limits how much of your content gets indexed.',
  fixPrompt: 'Review the Coverage report in Google Search Console. Fix broken internal links, resolve redirect loops, and ensure important pages return 200.',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

```typescript
'gsc-not-connected': { confidence: 'heuristic', scoreEligible: false },
'gsc-zero-indexed': { confidence: 'verified', scoreEligible: true },
'gsc-crawl-errors': { confidence: 'verified', scoreEligible: true },
```

- [ ] **Step 3: Create Supabase migration for GSC tokens**

Create `supabase/migrations/YYYYMMDDHHMMSS_gsc_tokens.sql` (replace YYYY etc with actual timestamp):

```sql
create table if not exists gsc_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_url text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table gsc_tokens enable row level security;
create policy "Users can manage their own GSC tokens"
  on gsc_tokens for all
  using (auth.uid() = user_id);
```

Run: `npx supabase db push`

- [ ] **Step 4: Create OAuth callback route**

Create `app/api/auth/gsc/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') // property URL
  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?error=gsc_missing_code', req.url))
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/dashboard?error=gsc_token_exchange', req.url))
  }
  const tokens = await tokenRes.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  await supabase.from('gsc_tokens').upsert({
    user_id: user.id,
    property_url: decodeURIComponent(state),
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }, { onConflict: 'user_id,property_url' })

  return NextResponse.redirect(new URL('/dashboard?gsc=connected', req.url))
}
```

- [ ] **Step 5: Create GSC provider**

Create `lib/providers/gsc.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

export interface GSCResult {
  indexedPages: number
  crawlErrors: number
}

export async function fetchGSCData(
  userId: string,
  propertyUrl: string,
  timeoutMs = 10_000,
): Promise<GSCResult | null> {
  const supabase = await createClient()
  const { data: token } = await supabase
    .from('gsc_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('property_url', propertyUrl)
    .single()

  if (!token) return null

  // Refresh token if expired
  let accessToken = token.access_token
  if (new Date(token.expires_at) <= new Date()) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: token.refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    })
    if (!refreshRes.ok) return null
    const refreshed = await refreshRes.json()
    accessToken = refreshed.access_token
    await supabase.from('gsc_tokens').update({
      access_token: accessToken,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('user_id', userId).eq('property_url', propertyUrl)
  }

  try {
    const [indexRes, errRes] = await Promise.all([
      fetch(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: '2020-01-01', endDate: new Date().toISOString().slice(0, 10), dimensions: ['page'], rowLimit: 1 }),
          signal: AbortSignal.timeout(timeoutMs),
        },
      ),
      fetch(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/urlCrawlErrorsCounts/query?category=notFound&platform=web`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(timeoutMs),
        },
      ),
    ])

    if (!indexRes.ok || !errRes.ok) return null

    const indexJson = await indexRes.json()
    const errJson = await errRes.json()

    const indexedPages = indexJson.rows?.length ?? 0
    const crawlErrors = errJson.countPerTypes?.reduce(
      (sum: number, t: { entries: Array<{ count: number }> }) =>
        sum + (t.entries?.[0]?.count ?? 0),
      0,
    ) ?? 0

    return { indexedPages, crawlErrors }
  } catch {
    return null
  }
}
```

- [ ] **Step 6: Wire into Deep Pass**

In `lib/checks/index.ts`, if `context.userId` and `context.siteUrl` are available (Agency/Pro scans with GSC connected):

```typescript
const gscResult = context.userId
  ? await safeTask('gsc', () => fetchGSCData(context.userId!, siteUrl))
  : null
providerData.gsc = gscResult ?? null
```

- [ ] **Step 7: Build and commit**

```bash
npm run build
npx supabase db push
git add lib/providers/gsc.ts app/api/auth/gsc/route.ts supabase/migrations/ lib/checks/seo.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add Google Search Console OAuth integration and GSC indexing checks (deferred)"
```

---

## Task D5: Bing Webmaster Tools — Crawl Stats

**Files:**
- Create: `lib/providers/bing-webmaster.ts`
- Create: `app/api/auth/bing/route.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/seo.ts`

**New env vars:** `BING_CLIENT_ID`, `BING_CLIENT_SECRET`

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `bing-crawl-blocked` | Bing reports crawl was blocked | verified | false |
| `bing-not-indexed` | Bing reports 0 indexed pages | verified | false |

- [ ] **Step 1: Add issue templates**

```typescript
'bing-crawl-blocked': {
  id: 'bing-crawl-blocked',
  category: 'seo',
  severity: 'medium',
  title: 'Bing crawl blocked',
  description: 'Bing Webmaster Tools reports crawl was blocked for this domain.',
  plainEnglish: 'Bing and Copilot cannot crawl your site. This affects your visibility in Microsoft search products.',
  fixPrompt: 'Check robots.txt for Bingbot disallow rules. Verify server is not returning 403 to Bing User-Agent.',
},
'bing-not-indexed': {
  id: 'bing-not-indexed',
  category: 'seo',
  severity: 'medium',
  title: 'No pages indexed in Bing',
  description: 'Bing Webmaster Tools reports zero indexed pages for this property.',
  plainEnglish: 'Bing has not indexed your site. This reduces your visibility in Bing and Copilot AI answers.',
  fixPrompt: 'Submit your sitemap to Bing Webmaster Tools and use IndexNow to notify Bing about new pages.',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

```typescript
'bing-crawl-blocked': { confidence: 'verified', scoreEligible: false },
'bing-not-indexed': { confidence: 'verified', scoreEligible: false },
```

- [ ] **Step 3: Create Bing Webmaster provider**

Create `lib/providers/bing-webmaster.ts`:

```typescript
export interface BingWebmasterResult {
  indexedPages: number
  crawlBlocked: boolean
}

export async function fetchBingWebmasterData(
  siteUrl: string,
  accessToken: string,
  timeoutMs = 10_000,
): Promise<BingWebmasterResult | null> {
  try {
    const res = await fetch(
      `https://ssl.bing.com/webmaster/api.svc/json/GetUrlInfo?siteUrl=${encodeURIComponent(siteUrl)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(timeoutMs),
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    return {
      indexedPages: json.d?.IndexedPages ?? 0,
      crawlBlocked: json.d?.CrawlBlocked ?? false,
    }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add lib/providers/bing-webmaster.ts app/api/auth/bing/route.ts lib/checks/seo.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add Bing Webmaster Tools integration (deferred)"
```

---

## Task D6: OWASP ZAP — Active Security Scan

**Context:** ZAP active scanning sends real HTTP probes to the target site. This requires:
1. Domain ownership verification (to avoid scanning third-party sites without permission)
2. ZAP instance running as a Railway service or Docker container
3. Legal terms acceptance in dashboard

**Files:**
- Create: `lib/providers/zap.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/security.ts`

**New env vars:** `ZAP_API_KEY`, `ZAP_BASE_URL`

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `zap-xss-found` | ZAP found reflected XSS | verified | true |
| `zap-sqli-found` | ZAP found SQL injection point | verified | true |
| `zap-open-redirect` | ZAP found open redirect | verified | true |

- [ ] **Step 1: Add issue templates**

```typescript
'zap-xss-found': {
  id: 'zap-xss-found',
  category: 'security',
  severity: 'critical',
  title: 'Reflected XSS vulnerability detected',
  description: 'OWASP ZAP active scan found a reflected cross-site scripting vulnerability.',
  plainEnglish: 'Attackers can inject malicious scripts into your pages via URL parameters, potentially stealing user sessions or data.',
  fixPrompt: 'Identify the input parameter triggering the XSS. Apply output encoding on the server side. Use Content-Security-Policy headers to limit script execution.',
  docsUrl: 'https://owasp.org/www-community/attacks/xss/',
},
'zap-sqli-found': {
  id: 'zap-sqli-found',
  category: 'security',
  severity: 'critical',
  title: 'SQL injection vulnerability detected',
  description: 'OWASP ZAP active scan found a potential SQL injection entry point.',
  plainEnglish: 'Attackers can manipulate your database queries through URL parameters or form fields, potentially exfiltrating all your data.',
  fixPrompt: 'Use parameterized queries or prepared statements for all database operations. Never concatenate user input into SQL strings.',
  docsUrl: 'https://owasp.org/www-community/attacks/SQL_Injection',
},
'zap-open-redirect': {
  id: 'zap-open-redirect',
  category: 'security',
  severity: 'medium',
  title: 'Open redirect vulnerability detected',
  description: 'OWASP ZAP found a URL parameter that redirects to attacker-controlled URLs.',
  plainEnglish: 'Attackers can craft links to your site that redirect users to malicious sites, useful for phishing.',
  fixPrompt: 'Validate redirect targets against an allowlist of internal URLs. Never redirect to user-controlled URLs without validation.',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

```typescript
'zap-xss-found': { confidence: 'verified', scoreEligible: true },
'zap-sqli-found': { confidence: 'verified', scoreEligible: true },
'zap-open-redirect': { confidence: 'verified', scoreEligible: false },
```

- [ ] **Step 3: Create ZAP provider**

Create `lib/providers/zap.ts`:

```typescript
export interface ZAPFinding {
  pluginId: string
  alert: string
  risk: 'High' | 'Medium' | 'Low' | 'Informational'
  url: string
  evidence: string
}

export interface ZAPResult {
  findings: ZAPFinding[]
}

const PLUGIN_TO_ISSUE: Record<string, string> = {
  '40012': 'zap-xss-found',      // Reflected XSS
  '40014': 'zap-sqli-found',     // SQL Injection
  '20019': 'zap-open-redirect',  // External Redirect
}

export async function runZAPActiveScan(
  targetUrl: string,
  timeoutMs = 120_000,
): Promise<ZAPResult | null> {
  const key = process.env.ZAP_API_KEY
  const base = process.env.ZAP_BASE_URL
  if (!key || !base) return null

  try {
    // Start spider
    const spiderRes = await fetch(
      `${base}/JSON/spider/action/scan/?apikey=${key}&url=${encodeURIComponent(targetUrl)}&maxChildren=5`,
      { signal: AbortSignal.timeout(30_000) },
    )
    if (!spiderRes.ok) return null
    const { scan: spiderId } = await spiderRes.json()

    // Poll spider completion (max 30s)
    const spiderDeadline = Date.now() + 30_000
    while (Date.now() < spiderDeadline) {
      const prog = await fetch(`${base}/JSON/spider/view/status/?apikey=${key}&scanId=${spiderId}`)
      const { status } = await prog.json()
      if (status === '100') break
      await new Promise(r => setTimeout(r, 2_000))
    }

    // Start active scan
    const scanRes = await fetch(
      `${base}/JSON/ascan/action/scan/?apikey=${key}&url=${encodeURIComponent(targetUrl)}&recurse=false`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (!scanRes.ok) return null
    const { scan: scanId } = await scanRes.json()

    // Poll active scan (max 90s)
    const scanDeadline = Date.now() + 90_000
    while (Date.now() < scanDeadline) {
      const prog = await fetch(`${base}/JSON/ascan/view/status/?apikey=${key}&scanId=${scanId}`)
      const { status } = await prog.json()
      if (status === '100') break
      await new Promise(r => setTimeout(r, 5_000))
    }

    // Get alerts
    const alertsRes = await fetch(
      `${base}/JSON/alert/view/alerts/?apikey=${key}&baseurl=${encodeURIComponent(targetUrl)}&riskId=1`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (!alertsRes.ok) return null
    const { alerts } = await alertsRes.json()

    const findings: ZAPFinding[] = (alerts ?? [])
      .filter((a: { pluginId: string }) => PLUGIN_TO_ISSUE[a.pluginId])
      .map((a: { pluginId: string; alert: string; risk: string; url: string; evidence: string }) => ({
        pluginId: a.pluginId,
        alert: a.alert,
        risk: a.risk,
        url: a.url,
        evidence: a.evidence,
      }))

    return { findings }
  } catch {
    return null
  }
}

export { PLUGIN_TO_ISSUE }
```

- [ ] **Step 4: Wire ZAP findings into security.ts**

```typescript
import { PLUGIN_TO_ISSUE } from '@/lib/providers/zap'

// In runSecurityChecks, ZAP data block:
const zapData = context?.zap ?? null
if (zapData) {
  for (const finding of zapData.findings) {
    const issueId = PLUGIN_TO_ISSUE[finding.pluginId]
    if (issueId) {
      issues.push(withIssueMeta(issueId, {
        value: finding.url,
        evidence: [evidence('OWASP ZAP', `${finding.alert} at ${finding.url}: ${finding.evidence}`)],
        source: 'zap',
      }))
    }
  }
}
```

- [ ] **Step 5: Build and commit**

```bash
npm run build
git add lib/providers/zap.ts lib/checks/security.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add OWASP ZAP active scan integration (deferred)"
```

---

## Task D7: NVD API v2 + EPSS — Full CVE Scoring Pipeline

**Context:** Extends Task 3.2 from the main plan (OSV CVE detection). OSV gives CVE IDs; NVD gives CVSS scores; EPSS gives exploit probability. This three-stage pipeline replaces the simpler OSV-only check with richer data.

**Files:**
- Modify: `lib/providers/osv.ts` (extend to add NVD+EPSS enrichment)
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/security.ts`

**New env var:** `NVD_API_KEY` (optional — NVD allows unauthenticated at 5 req/30s; key raises limit to 50/30s)

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `vulnerable-js-lib-critical` | CVE with CVSS >= 9.0 detected | verified | true |
| `vulnerable-js-lib-high-epss` | CVE with EPSS > 0.5 (actively exploited) | verified | true |

- [ ] **Step 1: Add issue templates**

```typescript
'vulnerable-js-lib-critical': {
  id: 'vulnerable-js-lib-critical',
  category: 'security',
  severity: 'critical',
  title: 'Critical CVE in detected JavaScript library',
  description: 'A JavaScript library detected on this page has a known vulnerability with CVSS score ≥ 9.0.',
  plainEnglish: 'A critical security vulnerability was found in a JavaScript library your site loads. Attackers may be able to exploit this.',
  fixPrompt: 'Update the affected library to the latest patched version immediately. Check your package.json and any CDN includes.',
  docsUrl: 'https://nvd.nist.gov/',
},
'vulnerable-js-lib-high-epss': {
  id: 'vulnerable-js-lib-high-epss',
  category: 'security',
  severity: 'high',
  title: 'Actively exploited vulnerability in JavaScript library',
  description: 'A CVE in a detected library has an EPSS exploit probability above 50%, meaning it is actively being exploited in the wild.',
  plainEnglish: 'This vulnerability is actively being exploited by attackers right now. Update the library urgently.',
  fixPrompt: 'Update the affected library immediately. This CVE has high real-world exploitation activity.',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

```typescript
'vulnerable-js-lib-critical': { confidence: 'verified', scoreEligible: true },
'vulnerable-js-lib-high-epss': { confidence: 'verified', scoreEligible: true },
```

- [ ] **Step 3: Add NVD + EPSS enrichment to osv.ts**

In `lib/providers/osv.ts`, add after `queryOSVBatch`:

```typescript
export interface EnrichedCVE {
  cveId: string
  cvssScore: number | null
  epssScore: number | null
  library: string
  version: string
}

export async function enrichWithNVDAndEPSS(
  osvResults: CVEResult[],
  timeoutMs = 15_000,
): Promise<EnrichedCVE[]> {
  if (osvResults.length === 0) return []

  const nvdKey = process.env.NVD_API_KEY
  const headers: Record<string, string> = {}
  if (nvdKey) headers['apiKey'] = nvdKey

  const enriched: EnrichedCVE[] = []

  for (const result of osvResults) {
    for (const cveId of result.cveIds) {
      // Fetch CVSS from NVD
      let cvssScore: number | null = null
      try {
        const nvdRes = await fetch(
          `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`,
          { headers, signal: AbortSignal.timeout(timeoutMs) },
        )
        if (nvdRes.ok) {
          const nvdJson = await nvdRes.json()
          const metrics = nvdJson?.vulnerabilities?.[0]?.cve?.metrics
          cvssScore =
            metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ??
            metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ??
            metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ??
            null
        }
      } catch { /* NVD timeout — continue without CVSS */ }

      // Fetch EPSS score
      let epssScore: number | null = null
      try {
        const epssRes = await fetch(
          `https://api.first.org/data/v1/epss?cve=${cveId}`,
          { signal: AbortSignal.timeout(5_000) },
        )
        if (epssRes.ok) {
          const epssJson = await epssRes.json()
          epssScore = parseFloat(epssJson?.data?.[0]?.epss ?? '') || null
        }
      } catch { /* EPSS timeout — continue */ }

      enriched.push({
        cveId,
        cvssScore,
        epssScore,
        library: result.library,
        version: result.version,
      })
    }
  }

  return enriched
}
```

- [ ] **Step 4: Wire enriched CVE checks into security.ts**

Replace the existing `vulnerable-js-lib` check with:

```typescript
for (const cve of enrichedCves) {
  if (cve.cvssScore !== null && cve.cvssScore >= 9.0) {
    issues.push(withIssueMeta('vulnerable-js-lib-critical', {
      value: `${cve.library}@${cve.version}`,
      evidence: [evidence('NVD', `${cve.cveId} CVSS=${cve.cvssScore} in ${cve.library}@${cve.version}`)],
      source: 'nvd',
    }))
  } else if (cve.epssScore !== null && cve.epssScore > 0.5) {
    issues.push(withIssueMeta('vulnerable-js-lib-high-epss', {
      value: `${cve.library}@${cve.version}`,
      evidence: [evidence('EPSS', `${cve.cveId} EPSS=${(cve.epssScore * 100).toFixed(1)}% in ${cve.library}@${cve.version}`)],
      source: 'epss',
    }))
  } else if (cve.cvssScore !== null && cve.cvssScore >= 7.0) {
    // Existing medium/high issue from main plan
    issues.push(withIssueMeta('vulnerable-js-lib', {
      value: `${cve.library}@${cve.version}`,
      evidence: [evidence('NVD', `${cve.cveId} CVSS=${cve.cvssScore} in ${cve.library}@${cve.version}`)],
      source: 'nvd',
    }))
  }
}
```

- [ ] **Step 5: Build and commit**

```bash
npm run build
git add lib/providers/osv.ts lib/checks/security.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add NVD CVSS + EPSS exploit probability enrichment for CVE pipeline (deferred)"
```

---

## Task D8: MCP Server Cards Discovery

**Context:** `/.well-known/mcp.json` is an emerging standard for exposing MCP (Model Context Protocol) server capabilities. AI agents that respect this file can better understand and interact with a site's services. Checking for it is a zero-cost HTTP probe.

**Files:**
- Modify: `lib/checks/ai-visibility.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

**New checks:**

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `mcp-json-missing` | `/.well-known/mcp.json` returns non-200 | heuristic | false |
| `mcp-json-invalid` | `/.well-known/mcp.json` exists but is not valid JSON or missing required fields | likely | false |

- [ ] **Step 1: Add issue templates**

```typescript
'mcp-json-missing': {
  id: 'mcp-json-missing',
  category: 'ai-visibility',
  severity: 'info',
  title: 'MCP server card not found',
  description: '/.well-known/mcp.json was not found. This emerging standard lets AI agents discover your site\'s capabilities.',
  plainEnglish: 'AI agents cannot discover your site\'s MCP capabilities. This is an emerging standard — early adopters gain visibility advantages.',
  fixPrompt: 'Create /.well-known/mcp.json describing your site\'s MCP-compatible services and capabilities. See the MCP specification for the required format.',
  docsUrl: 'https://modelcontextprotocol.io/',
},
'mcp-json-invalid': {
  id: 'mcp-json-invalid',
  category: 'ai-visibility',
  severity: 'info',
  title: 'MCP server card is malformed',
  description: '/.well-known/mcp.json exists but contains invalid JSON or is missing required fields.',
  plainEnglish: 'Your MCP server card file exists but AI agents cannot parse it correctly.',
  fixPrompt: 'Validate your /.well-known/mcp.json against the MCP specification. Ensure it is valid JSON with a "name" and "version" field at minimum.',
},
```

- [ ] **Step 2: Add to CONFIDENCE_MAP**

```typescript
'mcp-json-missing': { confidence: 'heuristic', scoreEligible: false },
'mcp-json-invalid': { confidence: 'likely', scoreEligible: false },
```

- [ ] **Step 3: Add MCP discovery check to ai-visibility.ts**

At the end of `runAIVisibilityChecks`:

```typescript
// MCP Server Card discovery
try {
  const mcpUrl = new URL('/.well-known/mcp.json', url).toString()
  const mcpRes = await fetchSafeResource(mcpUrl, { timeoutMs: 5_000 })
  if (!mcpRes || mcpRes.status !== 200) {
    issues.push(withIssueMeta('mcp-json-missing', {
      value: '/.well-known/mcp.json',
      evidence: [evidence('HTTP probe', `/.well-known/mcp.json returned ${mcpRes?.status ?? 'no response'}`)],
      source: 'passive',
    }))
  } else {
    let mcpValid = false
    try {
      const mcpBody = await mcpRes.text()
      const mcpJson = JSON.parse(mcpBody)
      mcpValid = typeof mcpJson.name === 'string' && typeof mcpJson.version === 'string'
    } catch { /* invalid JSON */ }

    if (!mcpValid) {
      issues.push(withIssueMeta('mcp-json-invalid', {
        value: '/.well-known/mcp.json',
        evidence: [evidence('HTTP probe', '/.well-known/mcp.json returned 200 but failed JSON parse or missing required fields')],
        source: 'passive',
      }))
    }
  }
} catch { /* skip on error */ }
```

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add lib/checks/ai-visibility.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add MCP server card discovery check (deferred)"
```

---

## Task D9: Agent Analytics via Vercel Log Drains

**Context:** ShipReady runs on Vercel. Vercel Log Drains can stream access logs to a collector endpoint. By parsing User-Agent for AI crawlers (GPTBot, ClaudeBot, PerplexityBot), we can build a per-page AI crawler funnel: Discovery → Crawl → Citation. This requires:
1. Customer connects their Vercel project in the dashboard
2. ShipReady configures a Log Drain on that project via Vercel API
3. ShipReady's drain endpoint parses and stores crawler visits

**Files:**
- Create: `lib/providers/vercel-drain.ts` — Vercel Log Drain API client (set up drain)
- Create: `app/api/drain/vercel/route.ts` — drain endpoint that receives log events
- Create: `supabase/migrations/YYYYMMDDHHMMSS_ai_crawler_visits.sql`
- Create: `components/dashboard/AgentAnalytics.tsx` — funnel visualization

**New env vars:** `VERCEL_TEAM_ID`, `VERCEL_API_TOKEN` (Vercel internal token for drain setup)

**Checks from this feature:** Not issue-based — this is a monitoring/dashboard feature (Discovery → Indexing → Citation funnel), not a one-shot audit check.

- [ ] **Step 1: Create Supabase migration**

Create `supabase/migrations/YYYYMMDDHHMMSS_ai_crawler_visits.sql`:

```sql
create table if not exists ai_crawler_visits (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  bot_name text not null,
  page_path text not null,
  visited_at timestamptz not null,
  status_code int,
  created_at timestamptz default now()
);

create index ai_crawler_visits_site_id_idx on ai_crawler_visits(site_id);
create index ai_crawler_visits_visited_at_idx on ai_crawler_visits(visited_at);

alter table ai_crawler_visits enable row level security;
create policy "Users can view their own site crawler visits"
  on ai_crawler_visits for select
  using (
    site_id in (
      select id from sites where user_id = auth.uid()
    )
  );
```

Run: `npx supabase db push`

- [ ] **Step 2: Create Log Drain setup client**

Create `lib/providers/vercel-drain.ts`:

```typescript
const BOT_USER_AGENTS: Record<string, string> = {
  GPTBot: 'gptbot',
  ClaudeBot: 'claudebot',
  PerplexityBot: 'perplexitybot',
  'OAI-SearchBot': 'oai-searchbot',
  CCBot: 'ccbot',
}

export function detectBotName(userAgent: string): string | null {
  const ua = userAgent.toLowerCase()
  for (const [display, pattern] of Object.entries(BOT_USER_AGENTS)) {
    if (ua.includes(pattern)) return display
  }
  return null
}

export async function createVercelLogDrain(
  projectId: string,
  drainUrl: string,
  secret: string,
): Promise<boolean> {
  const token = process.env.VERCEL_API_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID
  if (!token) return false

  const res = await fetch(
    `https://api.vercel.com/v2/integrations/log-drains${teamId ? `?teamId=${teamId}` : ''}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'ShipReady AI Crawler Analytics',
        type: 'json',
        url: drainUrl,
        secret,
        projectIds: [projectId],
        sources: ['static', 'edge', 'external'],
      }),
    },
  )
  return res.ok
}
```

- [ ] **Step 3: Create drain receiver endpoint**

Create `app/api/drain/vercel/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { detectBotName } from '@/lib/providers/vercel-drain'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Verify drain secret
  const secret = req.headers.get('x-vercel-signature')
  if (secret !== process.env.DRAIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const logs: Array<{
    projectId: string
    path: string
    statusCode: number
    requestHeaders: Record<string, string>
    timestamp: number
  }> = await req.json()

  const supabase = await createClient()
  const rows = []

  for (const log of logs) {
    const userAgent = log.requestHeaders?.['user-agent'] ?? ''
    const botName = detectBotName(userAgent)
    if (!botName) continue

    // Look up site_id by projectId
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('vercel_project_id', log.projectId)
      .single()

    if (!site) continue

    rows.push({
      site_id: site.id,
      bot_name: botName,
      page_path: log.path,
      visited_at: new Date(log.timestamp).toISOString(),
      status_code: log.statusCode,
    })
  }

  if (rows.length > 0) {
    await supabase.from('ai_crawler_visits').insert(rows)
  }

  return NextResponse.json({ processed: rows.length })
}
```

- [ ] **Step 4: Build and commit**

```bash
npm run build
npx supabase db push
git add lib/providers/vercel-drain.ts app/api/drain/vercel/route.ts supabase/migrations/
git commit -m "feat: add Vercel Log Drain AI crawler analytics pipeline (deferred, Agency tier)"
```

---

## Deferred Scope Summary

| Task | Integration | Tier | Env Vars Required |
|---|---|---|---|
| D1 | Ahrefs API | Pro | `AHREFS_API_KEY` |
| D2 | Semrush API | Pro | `SEMRUSH_API_KEY` |
| D3 | DataForSEO | Pro | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` |
| D4 | Google Search Console OAuth | Pro | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| D5 | Bing Webmaster Tools | Pro | `BING_CLIENT_ID`, `BING_CLIENT_SECRET` |
| D6 | OWASP ZAP Active Scan | Pro | `ZAP_API_KEY`, `ZAP_BASE_URL` |
| D7 | NVD v2 + EPSS | Pro (extends main Task 3.2) | `NVD_API_KEY` (optional) |
| D8 | MCP Server Cards | Free | — (HTTP probe) |
| D9 | Agent Analytics (Vercel Log Drain) | Agency | `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, `DRAIN_SECRET` |

**Note on Task D8:** MCP discovery (Task D8) is a zero-cost HTTP probe with no API keys. It was placed in the deferred plan because the standard is still emerging and adoption is low — revisit this for promotion to the main plan once `/.well-known/mcp.json` sees broader adoption.
