# ShipReady Scanner Expansion — Design Spec

**Date:** 2026-05-06
**Status:** Approved
**Phase:** Post-beta quality expansion
**Variant:** B (Scanner depth first, API unlocks integrations early)

---

## Overview

This spec covers the full expansion of ShipReady's scanner from 5 to 6 categories, addition of ~20 new checks across all categories, a public REST API, developer workflow integrations (GitHub Action, Vercel deploy hook), and multi-page crawl mode. Work is organized into 5 sequential stages, each independently shippable.

**Priority order:** scan quality > API > integrations > multi-page > agency features.

---

## Stage 1 — Expand Existing Categories

**Goal:** Add ~12 new checks across SEO, Security, and Mobile without touching architecture.
**Files changed:** `lib/checks/seo.ts`, `lib/checks/security.ts`, `lib/checks/mobile.ts`, `lib/scoring.ts`, `lib/ai/issue-templates.ts`

### 1.1 SEO Expansion (+5 checks)

All new checks follow the existing `withIssueMeta` + `evidence` pattern.

| Check ID | Title | Confidence | Source | Condition |
|---|---|---|---|---|
| `images-missing-alt` | Images missing alt text | heuristic | dom | `img` elements without `alt` or with empty `alt` (excluding decorative with `alt=""` and `role="presentation"`) |
| `meta-robots-noindex` | Page blocked from indexing | verified | dom | `meta[name="robots"]` contains `noindex` |
| `robots-txt-disallow` | URL disallowed in robots.txt | verified | http | Fetches `/robots.txt`, parses `Disallow` rules for `*` or `Googlebot`, checks if scanned path matches |
| `thin-internal-linking` | Very few internal links | heuristic | dom | Fewer than 3 internal `<a href>` links on the page body |
| `canonical-mismatch` | Canonical points to different URL | likely | dom | `link[canonical]` href differs from page URL after normalising trailing slashes and query params |

**TOTAL_CHECKS.seo:** 16 → 21

### 1.2 Security Expansion (+4 checks — Privacy & Compliance)

These go inside the existing Security category. No new category is created.

| Check ID | Title | Confidence | Source | Condition |
|---|---|---|---|---|
| `missing-permissions-policy` | Missing Permissions-Policy header | verified | http | `Permissions-Policy` response header absent |
| `missing-cookie-consent` | No cookie consent mechanism detected | heuristic | dom | Analytics/tracking scripts detected (GA, GTM, Pixel, Hotjar, Mixpanel) but no consent banner DOM pattern found (OneTrust, Cookiebot, generic `.cookie-banner`, `[class*="consent"]`, `[id*="cookie"]`) |
| `missing-privacy-policy` | No privacy policy link found | heuristic | dom | No `<a href>` containing `/privacy`, `/datenschutz`, or matching text "privacy policy", "политика конфиденциальности" |
| `third-party-trackers` | Third-party tracking scripts detected | heuristic | dom | External scripts from known tracker domains (google-analytics, googletagmanager, facebook.net, hotjar, mixpanel, segment, amplitude) listed with count |

**TOTAL_CHECKS.security:** 10 → 14

### 1.3 Mobile Expansion (+2 checks)

| Check ID | Title | Confidence | Source | Condition |
|---|---|---|---|---|
| `missing-web-manifest` | No web app manifest | likely | dom+http | No `link[rel="manifest"]` in head AND `/manifest.json` returns non-200 |
| `phone-numbers-not-linked` | Phone numbers not linked | heuristic | dom | Regex detects phone number patterns in body text (`\+?[\d\s\-\(\)]{10,}`) but no adjacent `<a href="tel:">` |

**TOTAL_CHECKS.mobile:** 3 → 5

### 1.4 Scoring model update

No weight changes in Stage 1 — weights are updated in Stage 2 when the 6th category is added.

Update `TOTAL_CHECKS` constants only.

---

## Stage 2 — New Accessibility Category + REST API v1

### 2.1 Accessibility Category (new 6th category)

**New type entry:** `'accessibility'` added to `IssueCategory` in `types/scan.ts`.
**New file:** `lib/checks/accessibility.ts`
**New source type:** `'accessibility'` added to `IssueSource`.

The Lighthouse run already returns `a11yScore` from `lhr.categories.accessibility`. This value is now extracted from the existing Lighthouse result and used as the primary measurement for the category score.

Specific checks in `lib/checks/accessibility.ts`:

| Check ID | Title | Confidence | Source | Method |
|---|---|---|---|---|
| `low-a11y-score` | Low accessibility score | verified | lighthouse | Lighthouse `a11yScore < 70` → high, `< 90` → medium. Only present when Lighthouse ran successfully. |
| `images-missing-alt-a11y` | Images missing alt text | verified | dom | `img` without `alt` attribute (not `alt=""`) — verified because it is unambiguously wrong. Separate from heuristic SEO version. |
| `form-inputs-no-label` | Form inputs missing labels | verified | dom | `input:not([type="hidden"])` without associated `<label>`, `aria-label`, or `aria-labelledby` |
| `buttons-no-label` | Buttons without accessible label | verified | dom | `<button>` with no text content and no `aria-label` or `aria-labelledby` |
| `missing-lang-attribute` | Missing lang attribute on html | verified | dom | `<html>` element missing `lang` attribute |
| `missing-skip-navigation` | No skip navigation link | heuristic | dom | No `<a href="#main">`, `<a href="#content">`, or element with `class*="skip"` found before first nav |

**TOTAL_CHECKS.accessibility:** 6

**Category weight rebalancing** (`lib/scoring.ts`):

```typescript
const CATEGORY_WEIGHTS = {
  performance:   0.22,  // was 0.25
  seo:           0.18,  // was 0.20
  security:      0.22,  // was 0.25
  mobile:        0.10,  // unchanged
  ai_visibility: 0.18,  // was 0.20
  accessibility: 0.10,  // new
} as const
```

**Migration of existing check:** The `a11y-score-low` issue currently lives in the `performance` category (`lib/scoring.ts` `buildPerformanceIssues`). In Stage 2, this check moves to `accessibility` category and is renamed `low-a11y-score` for consistency with the new naming convention. Remove it from `buildPerformanceIssues`, add it to `lib/checks/accessibility.ts`. `TOTAL_CHECKS.performance` drops from 6 → 5 accordingly.

**Scan flow changes** (`lib/checks/index.ts`):

`runAccessibilityChecks(html)` runs in the Fast Pass alongside SEO, Security, Mobile. It is a lightweight cheerio pass — no network calls. The Lighthouse-derived `a11yScore` is injected in the Deep Pass when Lighthouse completes, by updating the accessibility category score. This avoids blocking Fast Pass on Lighthouse.

**Report UI changes** (`app/report/[id]/page.tsx`):

- `CATEGORIES` array updated to include `'accessibility'`
- `CATEGORY_LABELS` gets `accessibility: 'Accessibility'`
- `TOTAL_CHECKS` in scoring updated
- Category card renders with a wheelchair icon

### 2.2 REST API v1

**New files:**
- `app/api/v1/scan/route.ts` — POST (create scan)
- `app/api/v1/scan/[id]/route.ts` — GET (poll result)
- `app/api/v1/scan/[id]/issues/route.ts` — GET (flat issue list)
- `lib/api/api-key-auth.ts` — API key validation middleware
- `supabase/migrations/010_api_keys.sql` — `api_keys` table

**Authentication:** `Authorization: Bearer sk_live_<key>` header. Key hashed and stored in `api_keys` table with `user_id`, `plan`, `daily_limit`, `calls_today`, `last_reset_at`.

**Rate limits:**
- Free plan: 10 scans/day per key
- Pro plan: 100 scans/day per key
- Agency plan: 500 scans/day per key

**Endpoints:**

```
POST /api/v1/scan
Body: { url: string, goal?: ScanGoal }
Returns: { id: string, status: "pending", url: string }
Errors: 401 (invalid key), 429 (rate limit), 422 (invalid URL), 403 (unsafe URL)

GET /api/v1/scan/:id
Returns: ScanResult (same shape as internal /api/scan/:id)
Errors: 401, 403 (not owner), 404

GET /api/v1/scan/:id/issues
Query: ?category=seo&severity=high&confidence=verified
Returns: { issues: Issue[], totalScore: number, categoryScores: Record<IssueCategory, number|null> }
```

**Security:** API routes use same `assertSafeScanUrl` and quota logic as `/api/scan`. API keys are scoped to the user's plan and do not grant access to other users' scans.

**Migration `010_api_keys.sql`:**
```sql
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  key_hash text not null unique,
  plan text not null default 'free',
  daily_limit int not null default 10,
  calls_today int not null default 0,
  last_reset_at date not null default current_date,
  created_at timestamptz default now(),
  label text
);
create index on api_keys(key_hash);
```

**Dashboard integration:** Pro/Agency users see an "API Keys" tab in the dashboard where they can generate and revoke keys.

---

## Stage 3 — Developer Integrations

### 3.1 GitHub Action

**Repository:** `shipready/action` (separate public GitHub repo, published to GitHub Marketplace).

The action is a thin client over the API v1:

```yaml
- uses: shipready/action@v1
  with:
    url: ${{ env.DEPLOY_URL }}
    api-key: ${{ secrets.SHIPREADY_KEY }}
    fail-threshold: 70          # fail if totalScore < this
    fail-on-issues: "critical,high"  # optional: fail on specific severities
    categories: "performance,security"  # optional: only check these
```

**Implementation:** Node.js action (`action.yml` + `index.js`). Steps:
1. POST to `/api/v1/scan` with `url` and API key
2. Poll `/api/v1/scan/:id` every 5s until `status === 'done'` or `'error'` (max 5 minutes)
3. Evaluate `fail-threshold` and `fail-on-issues` conditions
4. Output `score`, `reportUrl`, `issueCount` as action outputs
5. Exit 1 on failure, 0 on pass

**ShipReady side:** No backend changes needed. Action uses existing API v1.

### 3.2 Vercel Deploy Hook

**New file:** `app/api/webhooks/vercel/route.ts`

Vercel sends a `POST` on deployment completion. ShipReady verifies the `x-vercel-signature` HMAC (using `VERCEL_WEBHOOK_SECRET` env var), extracts the deployment URL, and triggers a scan via internal scan creation (not API v1 — direct DB insert + Railway dispatch).

```
POST /api/webhooks/vercel
Headers: x-vercel-signature: <hmac-sha1>
Body: Vercel deployment webhook payload
```

**Flow:**
1. Verify HMAC signature
2. Extract `payload.deployment.url` (the deployment preview URL)
3. Validate URL safety
4. Create scan with `trigger: 'webhook'`, `source: 'vercel'`
5. Dispatch to Railway scanner
6. Return `{ id, reportUrl }` to Vercel (for display in Vercel toolbar if configured)

**Setup in UI:** Dashboard "Integrations" tab shows webhook URL and instructions for adding it in Vercel project settings.

**New env var:** `VERCEL_WEBHOOK_SECRET`

### 3.3 Slack & Discord Notifications

**Scope:** Monitoring alerts (existing) and webhook-triggered scan results.

**New file:** `lib/notifications/send-slack.ts`, `lib/notifications/send-discord.ts`

**Monitored domain config** gets new fields:
```sql
-- extends monitored_domains table
alter table monitored_domains add column slack_webhook_url text;
alter table monitored_domains add column discord_webhook_url text;
```

When `buildMonitoringAlertDecision` returns `shouldAlert: true`, in addition to the existing email alert, ShipReady also posts to the configured Slack/Discord webhook if set.

**Slack message format:** Attachment with color (green/red), domain, score delta, top 3 new issues, report link button.

**Discord message format:** Embed with same structure.

---

## Stage 4 — Multi-page Crawl

**Scope:** Pro (5 pages) and Agency (10 pages) only. Free users scan 1 page.

### 4.1 Architecture

**New file:** `lib/checks/crawler.ts` — BFS crawler.

The crawler runs **after** the single-page scan completes (`done` status). It uses the existing `fetchPrimaryContext` and cheerio checks but skips Lighthouse (too expensive per page) and AI enrichment.

```
Crawl budget:
  Pro:    maxPages=5,  maxDepth=2
  Agency: maxPages=10, maxDepth=3
  Free:   maxPages=1  (existing behaviour)
```

**Crawl flow:**
1. After main scan saves `done`, check plan budget
2. If `maxPages > 1`, start BFS from root URL
3. For each crawled URL (excluding already scanned root): run SEO fast checks + security headers only
4. Collect `SiteIssueAggregate` — issues appearing on 2+ pages
5. Update scan with `siteSummary: { pagesCrawled, recurringIssues }`

**Types already defined** in `types/scan.ts`:
- `SiteIssueAggregate` — `{ issueId, title, category, occurrenceCount, urls[] }`
- `SiteSummary` — `{ pagesCrawled, recurringIssues[] }`

**Crawl constraints:**
- Only crawl same-origin URLs
- Skip `/api/*`, `#*`, `?*` (hash/query variants of same page), already-visited URLs
- Respect `robots.txt` Disallow rules
- Timeout: 60s total for crawl phase
- Each page fetch uses `assertSafeScanUrl` + `fetchPrimaryContext`

### 4.2 Report UI changes

When `siteSummary` is present, the report shows a new "Site-wide Issues" section above the category cards, listing recurring issues with occurrence counts and affected URLs. Only shown for Pro/Agency.

### 4.3 Scan status additions

New status: `crawling` — inserted between `done` and final save during multi-page phase.

Updated status flow:
```
pending → running_fast → running_deep → enriching → done → crawling → done
```

(For free users: `done` stays as final status, no `crawling` phase.)

---

## Stage 5 — Agency Dashboard & Team Features

### 5.1 Multi-domain dashboard

Pro users get up to 3 monitored domains. Agency gets up to 10.

**Dashboard changes:**
- `/dashboard` shows domain cards with last scan score, trend badge (↑↓→), and last scanned timestamp
- "Add domain" button respects plan limit

**DB change:** `monitored_domains` already has the schema. Just enforce limit in UI and API.

### 5.2 Team seats

**New table:** `team_members` — `{ team_id, user_id, role: 'owner'|'member', invited_at, accepted_at }`

Agency plan gets up to 5 seats. Owner can invite by email (Resend). Member gets read access to owner's scans and reports.

### 5.3 Bulk scan scheduling

**New route:** `POST /api/v1/bulk-scan` — accepts `{ urls: string[], schedule?: 'now' | 'weekly' }`.

Agency only. Max 10 URLs per request. Scans are queued sequentially (not parallel) to avoid Railway overload.

---

## Data Model Changes Summary

| Migration | Contents |
|---|---|
| `010_api_keys.sql` | `api_keys` table (Stage 2) |
| `011_notifications.sql` | Add `slack_webhook_url`, `discord_webhook_url` to `monitored_domains` (Stage 3) |
| `012_team_members.sql` | `team_members` table (Stage 5) |

---

## Type System Changes Summary (`types/scan.ts`)

```typescript
// IssueCategory — add accessibility
export type IssueCategory =
  | 'performance' | 'seo' | 'security'
  | 'mobile' | 'ai_visibility' | 'accessibility'

// IssueSource — add accessibility
export type IssueSource =
  | 'lighthouse' | 'http' | 'dom' | 'ssl'
  | 'link-check' | 'ai-visibility' | 'ai-enrichment' | 'accessibility'

// ScanStatus — add crawling
export type ScanStatus =
  | 'pending' | 'running' | 'running_fast' | 'running_deep'
  | 'enriching' | 'crawling' | 'done' | 'error'

// ScanResult — add accessibility category
// accessibility: CategoryScore  ← add alongside performance, seo, security, mobile, ai_visibility

// getAllIssues() in lib/scoring.ts must include result.accessibility.issues
// buildScanResult() params must include accessibility: CategoryScore
```

---

## File Map — New Files

```
lib/checks/accessibility.ts         Stage 2 — new category checks
lib/checks/crawler.ts               Stage 4 — BFS multi-page crawler
lib/api/api-key-auth.ts             Stage 2 — API key middleware
lib/notifications/send-slack.ts     Stage 3 — Slack webhook
lib/notifications/send-discord.ts   Stage 3 — Discord webhook
app/api/v1/scan/route.ts            Stage 2 — API v1 create scan
app/api/v1/scan/[id]/route.ts       Stage 2 — API v1 get result
app/api/v1/scan/[id]/issues/route.ts Stage 2 — API v1 issue list
app/api/webhooks/vercel/route.ts    Stage 3 — Vercel deploy hook
supabase/migrations/010_api_keys.sql
supabase/migrations/011_notifications.sql
supabase/migrations/012_team_members.sql
```

---

## File Map — Modified Files

```
types/scan.ts                       Add accessibility to IssueCategory, IssueSource; add crawling to ScanStatus
lib/scoring.ts                      Add accessibility to CATEGORY_WEIGHTS + TOTAL_CHECKS; rebalance weights
lib/checks/index.ts                 Add runAccessibilityChecks to Fast Pass; add crawl phase after done
lib/checks/seo.ts                   5 new SEO checks
lib/checks/security.ts              4 new security/privacy checks
lib/checks/mobile.ts                2 new mobile checks
lib/checks/lighthouse.ts            Expose a11y audit details for accessibility category
lib/ai/issue-templates.ts           Templates for all new issue IDs
lib/monitoring/alerts.ts            Add Slack/Discord notification dispatch
app/report/[id]/page.tsx            Add accessibility category; site-wide issues section for crawl
app/dashboard/page.tsx              Multi-domain cards; API keys tab; team management (Stage 5)
```

---

## Confidence & Evidence Standards

All new checks must follow the quality contract:

- `verified` — only when the fact is directly observable and unambiguous (header missing, attribute absent, HTTP status code)
- `likely` — when inferred from observable evidence with high but not certain probability (canonical mismatch, manifest absence)
- `heuristic` — when detected by pattern matching that can produce false positives (cookie consent detection, phone number regex, tracker scripts)
- `scoreEligible: true` only for `verified` issues
- Every issue must include at least one `evidence` item with `kind`, `label`, and `value`

---

## Out of Scope for This Spec

- Full agency/team workflow UI (Stage 5 is basic — full team UI is post-spec)
- Performance regression history charts (requires separate timeseries storage)
- PageSpeed Insights CrUX field data (API key dependency, future addition)
- Deep DAST / runtime XSS / auth bypass testing
- Accessibility WCAG 2.1 AA full audit (this spec covers the most impactful checks only)
- Multi-language report UI

---

## Stage Delivery Order

| Stage | Key deliverable | Prerequisite |
|---|---|---|
| 1 | ~12 new checks in existing 5 categories | None |
| 2 | Accessibility category + API v1 | Stage 1 |
| 3 | GitHub Action + Vercel hook + Slack/Discord | Stage 2 (API) |
| 4 | Multi-page crawl (Pro/Agency) | Stage 1 |
| 5 | Agency dashboard + team seats | Stage 2 (API) |

Stages 3 and 4 can run in parallel after Stage 2 completes.
