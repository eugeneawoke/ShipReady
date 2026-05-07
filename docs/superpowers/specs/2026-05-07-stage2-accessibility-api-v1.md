# Stage 2 — Accessibility Category + REST API v1

**Date:** 2026-05-07
**Status:** Approved
**Prerequisite:** Stage 1 (done, commit 53c37c3)
**Full spec reference:** `docs/superpowers/specs/2026-05-06-scanner-expansion-design.md` §Stage 2

---

## What ships in Stage 2

1. **New `accessibility` category** — 6th scan category, 6 checks, Lighthouse a11y score injected in Deep Pass
2. **Category weight rebalancing** — 6 categories sum to 1.0
3. **REST API v1** — 3 endpoints, Bearer token auth, rate-limited per plan
4. **DB migration `011_api_keys.sql`** — `api_keys` table + RLS
5. **Type system updates** — `types/scan.ts`, `lib/scoring.ts`, `lib/checks/index.ts`

---

## 2.1 Accessibility Category

### Type changes (`types/scan.ts`)

```typescript
// Before:
export type IssueCategory = 'performance' | 'seo' | 'security' | 'mobile' | 'ai_visibility'
export type IssueSource = 'lighthouse' | 'http' | 'dom' | 'ssl' | 'link-check' | 'ai-visibility' | 'ai-enrichment'

// After:
export type IssueCategory = 'performance' | 'seo' | 'security' | 'mobile' | 'ai_visibility' | 'accessibility'
export type IssueSource = 'lighthouse' | 'http' | 'dom' | 'ssl' | 'link-check' | 'ai-visibility' | 'ai-enrichment' | 'accessibility'

// ScanResult gets new field:
accessibility: CategoryScore
```

### New file: `lib/checks/accessibility.ts`

Six checks. All use `withIssueMeta` + `evidence` pattern, same as existing checks.

| Check ID | Title | Confidence | Source | Condition |
|---|---|---|---|---|
| `low-a11y-score` | Low accessibility score | verified | lighthouse | `a11yScore < 70` → high, `< 90` → medium. Only when Lighthouse ran. Injected in Deep Pass. |
| `images-missing-alt-a11y` | Images missing alt text | verified | dom | `img` without `alt` attribute (not `alt=""`) — unambiguously wrong |
| `form-inputs-no-label` | Form inputs missing labels | verified | dom | `input:not([type="hidden"])` without `<label>`, `aria-label`, or `aria-labelledby` |
| `buttons-no-label` | Buttons without accessible label | verified | dom | `<button>` with no text content AND no `aria-label`/`aria-labelledby` |
| `missing-lang-attribute` | Missing lang attribute | verified | dom | `<html>` element missing `lang` attribute |
| `missing-skip-navigation` | No skip navigation link | heuristic | dom | No `<a href="#main">`, `<a href="#content">`, or `class*="skip"` before first `<nav>` |

Function signature:
```typescript
export function runAccessibilityChecks(html: string): Issue[]
// Note: synchronous — cheerio only, no network calls
// low-a11y-score is NOT returned here; it is injected during Deep Pass from Lighthouse result
```

### Scoring changes (`lib/scoring.ts`)

Move `a11y-score-low` check out of `buildPerformanceIssues` into `lib/checks/accessibility.ts` as `low-a11y-score`.
Update `TOTAL_CHECKS` and `CATEGORY_WEIGHTS`:

```typescript
const TOTAL_CHECKS = {
  performance: 5,  // was 6, a11y-score moved to accessibility
  seo: 21,
  security: 14,
  mobile: 5,
  ai_visibility: 8,
  accessibility: 6,
}

const CATEGORY_WEIGHTS = {
  performance:   0.22,  // was 0.25
  seo:           0.18,  // was 0.20
  security:      0.22,  // was 0.25
  mobile:        0.10,
  ai_visibility: 0.18,  // was 0.20
  accessibility: 0.10,  // new
} as const
```

### Scan flow changes (`lib/checks/index.ts`)

- `runAccessibilityChecks(html)` runs in **Fast Pass** alongside SEO/Security/Mobile
- `low-a11y-score` is injected in **Deep Pass** after Lighthouse completes, by calling a helper that appends to the accessibility issues list and updates the accessibility CategoryScore
- `buildScanResult()` params and `getAllIssues()` in scoring.ts include `accessibility`

### Report UI (`app/report/[id]/page.tsx`)

- Add `'accessibility'` to `CATEGORIES` array
- Add `accessibility: 'Accessibility'` to `CATEGORY_LABELS`
- Wheelchair icon (`♿` or lucide `Accessibility` if available)
- `getAllIssues` in scoring.ts must include `result.accessibility.issues`

---

## 2.2 REST API v1

### Authentication

`Authorization: Bearer sk_live_<random>` header.

Key is stored as `sha256(key)` in `api_keys.key_hash`. On each request: hash the incoming key, look up in DB, check `user_id`, check rate limit.

### New file: `lib/api/api-key-auth.ts`

```typescript
export interface ApiKeyContext {
  userId: string
  plan: 'free' | 'pro' | 'agency'
  keyId: string
}

// Returns ApiKeyContext or throws with HTTP status code
export async function validateApiKey(authHeader: string | null): Promise<ApiKeyContext>
```

Implementation notes:
- Hash with `crypto.createHash('sha256').update(rawKey).digest('hex')`
- Look up `api_keys` by `key_hash`
- Check `calls_today < daily_limit`, reset if `last_reset_at < current_date`
- Increment `calls_today` on success

### New routes

```
app/api/v1/scan/route.ts              — POST (create scan)
app/api/v1/scan/[id]/route.ts         — GET (get scan result)
app/api/v1/scan/[id]/issues/route.ts  — GET (flat issue list with filters)
```

**POST /api/v1/scan**
- Validates Bearer token via `validateApiKey`
- Validates URL via `assertSafeScanUrl`
- Creates scan in Supabase with `user_id` from API key
- Dispatches to Railway scanner (same path as `/api/scan`)
- Returns `{ id, status: 'pending', url }`
- Errors: 401, 422, 403, 429

**GET /api/v1/scan/:id**
- Validates Bearer token
- Checks that `scan.user_id === apiKey.userId` (403 otherwise)
- Returns full `ScanResult` (same shape as `/api/scan/:id`)
- Errors: 401, 403, 404

**GET /api/v1/scan/:id/issues**
- Validates Bearer token + ownership
- Query params: `?category=seo&severity=high&confidence=verified`
- Returns `{ issues: Issue[], totalScore: number, categoryScores: Record<IssueCategory, number|null> }`
- Errors: 401, 403, 404

### DB migration `011_api_keys.sql`

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

-- RLS
alter table api_keys enable row level security;
create policy "Users can read own keys" on api_keys
  for select using (auth.uid() = user_id);
create policy "Users can insert own keys" on api_keys
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own keys" on api_keys
  for delete using (auth.uid() = user_id);
-- Service role bypasses RLS for key validation (key_hash lookup in route handler uses service client)
```

**Important:** Route handlers that look up by `key_hash` use the **Supabase service role client** (bypasses RLS), not the anon/user client. This is required because the API caller is not authenticated via Supabase session — they're using an API key.

---

## Implementation Order

1. `supabase/migrations/011_api_keys.sql` — create table first
2. `types/scan.ts` — add accessibility type variants
3. `lib/ai/issue-templates.ts` + `lib/checks/issue-meta.ts` — 6 new accessibility templates
4. `lib/checks/accessibility.ts` — new file with 5 DOM checks (not low-a11y-score)
5. `lib/scoring.ts` — move a11y-score, update TOTAL_CHECKS + CATEGORY_WEIGHTS
6. `lib/checks/index.ts` — add accessibility to Fast Pass, inject low-a11y-score in Deep Pass
7. `app/report/[id]/page.tsx` — add accessibility category to UI
8. `lib/api/api-key-auth.ts` — new file, API key validation
9. `app/api/v1/scan/route.ts` — POST create scan
10. `app/api/v1/scan/[id]/route.ts` — GET result
11. `app/api/v1/scan/[id]/issues/route.ts` — GET filtered issues

---

## Out of Scope for Stage 2

- Dashboard "API Keys" tab UI (Stage 5)
- Key generation UI (Stage 5)
- Rate limit headers in response (nice-to-have, not required)
- API documentation page
