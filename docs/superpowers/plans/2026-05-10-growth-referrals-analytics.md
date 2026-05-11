# Growth Referrals Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement beta growth attribution, temporary Pro grants, referral tracking, and an internal growth dashboard for ShipReady.

**Architecture:** Supabase remains the source of truth for attribution, campaigns, referral codes, grants, and product events. Next.js Route Handlers capture visits/events and bind attribution to authenticated users; `lib/auth.ts` resolves an effective plan from paid/manual profile plan plus active beta grants. UI changes are intentionally small: landing visit capture, dashboard beta/referral panels, and a protected `/admin/growth` server-rendered dashboard.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Postgres/RLS/Auth, next-intl, Tailwind CSS, node:test via `tsx --test`.

---

## File Structure

- Create `supabase/migrations/014_growth_referrals.sql`: growth tables, profile attribution fields, RLS, indexes, and helper SQL functions.
- Create `lib/growth/attribution.ts`: pure parsing, normalization, safe cookie payload helpers, and effective plan helpers.
- Create `tests/growth-attribution.test.ts`: unit tests for parser, code normalization, expiry, and plan precedence.
- Create `app/api/growth/visit/route.ts`: same-origin JSON endpoint that records a visit and sets attribution cookies.
- Create `app/api/growth/event/route.ts`: same-origin JSON endpoint for product events like PDF export or referral copy.
- Create `components/growth/AttributionTracker.tsx`: client component mounted on landing to send UTM/ref/promo to `/api/growth/visit`.
- Modify `app/(landing)/page.tsx`: mount `AttributionTracker`.
- Modify `app/auth/callback/route.ts`: bind attribution after OAuth/email callback session exchange.
- Modify `app/auth/login/page.tsx`: pass attribution cookie values into Supabase signup metadata when possible.
- Modify `lib/auth.ts`: add `getEffectivePlan`, `bindCurrentUserGrowthAttribution`, and beta grant status.
- Modify `app/api/scan/route.ts`, `app/api/monitor/route.ts`, `app/api/report/[id]/pdf/route.ts`, `app/dashboard/page.tsx`, `app/report/[id]/page.tsx`: consume effective plan through `getUserWithPlan`.
- Create `components/dashboard/BetaAccessPanel.tsx`: shows beta grant expiry and referral link.
- Modify `messages/en.ts` and `messages/ru.ts`: add dashboard/admin/growth copy.
- Create `app/admin/growth/page.tsx`: protected internal dashboard with overview, channels, campaigns, referrals, and activation metrics.
- Create `docs/plans/2026-05-10-growth-campaign-launch-playbook.md`: step-by-step traffic-source launch playbook.

## Task 1: Growth Schema And Pure Helpers

**Files:**
- Create: `supabase/migrations/014_growth_referrals.sql`
- Create: `lib/growth/attribution.ts`
- Create: `tests/growth-attribution.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/growth-attribution.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAttributionFromSearchParams,
  normalizeCampaignCode,
  effectivePlanFromSources,
  isGrantActive,
} from '../lib/growth/attribution'

test('buildAttributionFromSearchParams keeps supported UTM, referral, and promo fields', () => {
  const params = new URLSearchParams('utm_source=LinkedIn&utm_medium=social&utm_campaign=beta&utm_content=post-1&utm_term=audit&ref=Eg_Test-01&promo=BUILDERS90&ignored=x')
  assert.deepEqual(buildAttributionFromSearchParams(params), {
    utm_source: 'linkedin',
    utm_medium: 'social',
    utm_campaign: 'beta',
    utm_content: 'post-1',
    utm_term: 'audit',
    referral_code: 'eg_test-01',
    promo_code: 'builders90',
  })
})

test('normalizeCampaignCode rejects unsafe or empty values', () => {
  assert.equal(normalizeCampaignCode(' LinkedIn_01 '), 'linkedin_01')
  assert.equal(normalizeCampaignCode('../secret'), null)
  assert.equal(normalizeCampaignCode(''), null)
  assert.equal(normalizeCampaignCode('a'.repeat(65)), null)
})

test('isGrantActive respects start, expiry, and revoked dates', () => {
  const now = new Date('2026-05-10T12:00:00Z')
  assert.equal(isGrantActive({ starts_at: '2026-05-01T00:00:00Z', expires_at: '2026-06-01T00:00:00Z', revoked_at: null }, now), true)
  assert.equal(isGrantActive({ starts_at: '2026-06-01T00:00:00Z', expires_at: null, revoked_at: null }, now), false)
  assert.equal(isGrantActive({ starts_at: '2026-05-01T00:00:00Z', expires_at: '2026-05-02T00:00:00Z', revoked_at: null }, now), false)
  assert.equal(isGrantActive({ starts_at: '2026-05-01T00:00:00Z', expires_at: null, revoked_at: '2026-05-05T00:00:00Z' }, now), false)
})

test('effectivePlanFromSources prefers agency, then paid/manual pro, then active beta pro', () => {
  const now = new Date('2026-05-10T12:00:00Z')
  const activeGrant = { granted_plan: 'pro' as const, starts_at: '2026-05-01T00:00:00Z', expires_at: '2026-06-01T00:00:00Z', revoked_at: null }
  assert.equal(effectivePlanFromSources('agency', [activeGrant], now).plan, 'agency')
  assert.equal(effectivePlanFromSources('pro', [activeGrant], now).plan, 'pro')
  assert.equal(effectivePlanFromSources('free', [activeGrant], now).plan, 'pro')
  assert.equal(effectivePlanFromSources('free', [], now).plan, 'free')
})
```

- [ ] **Step 2: Verify test fails**

Run: `npm run test:checks -- tests/growth-attribution.test.ts`

Expected: fail because `lib/growth/attribution.ts` does not exist.

- [ ] **Step 3: Implement helpers**

Create `lib/growth/attribution.ts` with exported types and functions:

```ts
export type Plan = 'free' | 'pro' | 'agency'
export type AttributionPayload = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referral_code?: string
  promo_code?: string
}

export type GrantLike = {
  granted_plan?: 'pro' | 'agency'
  starts_at: string
  expires_at: string | null
  revoked_at: string | null
}

const SAFE_VALUE = /^[a-z0-9][a-z0-9._-]{0,63}$/
const FIELD_MAP = {
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  utm_content: 'utm_content',
  utm_term: 'utm_term',
  ref: 'referral_code',
  promo: 'promo_code',
} as const

export function normalizeCampaignCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? ''
  return SAFE_VALUE.test(normalized) ? normalized : null
}

export function buildAttributionFromSearchParams(params: URLSearchParams): AttributionPayload {
  const payload: AttributionPayload = {}
  for (const [sourceKey, targetKey] of Object.entries(FIELD_MAP)) {
    const value = normalizeCampaignCode(params.get(sourceKey))
    if (value) payload[targetKey as keyof AttributionPayload] = value
  }
  return payload
}

export function isGrantActive(grant: GrantLike, now = new Date()): boolean {
  if (grant.revoked_at) return false
  if (new Date(grant.starts_at).getTime() > now.getTime()) return false
  if (grant.expires_at && new Date(grant.expires_at).getTime() <= now.getTime()) return false
  return true
}

export function effectivePlanFromSources(profilePlan: Plan, grants: GrantLike[], now = new Date()) {
  if (profilePlan === 'agency') return { plan: 'agency' as Plan, source: 'profile' as const, activeGrant: null }
  if (profilePlan === 'pro') return { plan: 'pro' as Plan, source: 'profile' as const, activeGrant: null }
  const activeGrant = grants.find((grant) => isGrantActive(grant, now))
  if (!activeGrant) return { plan: 'free' as Plan, source: 'profile' as const, activeGrant: null }
  return { plan: activeGrant.granted_plan ?? 'pro', source: 'beta_grant' as const, activeGrant }
}
```

- [ ] **Step 4: Implement migration**

Create `supabase/migrations/014_growth_referrals.sql` matching the design spec. Include `growth_campaigns`, `referral_codes`, `growth_visits`, `beta_access_grants`, `growth_events`, profile attribution fields, indexes, RLS policies that allow users to read only their own referral/grant rows, and service-role-compatible write policies.

- [ ] **Step 5: Run tests and commit**

Run: `npm run test:checks -- tests/growth-attribution.test.ts`

Expected: pass.

Commit:

```bash
git add supabase/migrations/014_growth_referrals.sql lib/growth/attribution.ts tests/growth-attribution.test.ts
git commit -m "feat: add growth attribution schema"
```

## Task 2: Visit/Event Capture And Signup Binding

**Files:**
- Create: `app/api/growth/visit/route.ts`
- Create: `app/api/growth/event/route.ts`
- Create: `components/growth/AttributionTracker.tsx`
- Modify: `app/(landing)/page.tsx`
- Modify: `app/auth/callback/route.ts`
- Modify: `app/auth/login/page.tsx`

- [ ] **Step 1: Add visit route**

Implement a POST-only route that uses `requireSameOriginJsonRequest`, reads JSON `{ landingPath, referrer, attribution }`, validates all values through `buildAttributionFromSearchParams`/`normalizeCampaignCode`, sets `sr_aid` and `sr_attr` cookies using Next.js `cookies()`/`NextResponse`, and inserts a row into `growth_visits` with `createServiceClient`.

- [ ] **Step 2: Add event route**

Implement a POST-only route guarded by `requireSameOriginJsonRequest`. Accept only allowlisted event names: `signup_started`, `scan_started`, `referral_link_copied`, `pdf_export_clicked`, `monitoring_enabled`. Insert into `growth_events` with current authenticated user if present.

- [ ] **Step 3: Add client tracker**

Create `components/growth/AttributionTracker.tsx` as a small client component. On mount, read `window.location.search`; if UTM/ref/promo exists, POST to `/api/growth/visit`. Use `sessionStorage` to avoid duplicate visit POSTs for the same URL in the same tab.

- [ ] **Step 4: Mount tracker**

Add `<AttributionTracker />` in `app/(landing)/page.tsx` near the root of `LandingPage`.

- [ ] **Step 5: Bind auth callback and signup metadata**

In `app/auth/callback/route.ts`, after successful `exchangeCodeForSession`, call a server helper from `lib/auth.ts` once Task 3 exists, or temporarily update profile attribution fields from the `sr_attr` cookie. In `app/auth/login/page.tsx`, include safe attribution fields in `auth.signUp({ options: { data } })` when available from `document.cookie`.

- [ ] **Step 6: Run lint/build subset and commit**

Run: `npm run lint`

Expected: no lint errors from changed files.

Commit:

```bash
git add app/api/growth components/growth 'app/(landing)/page.tsx' app/auth/callback/route.ts app/auth/login/page.tsx
git commit -m "feat: capture growth attribution"
```

## Task 3: Effective Plan Resolver And Beta Access UI

**Files:**
- Modify: `lib/auth.ts`
- Modify: `app/api/scan/route.ts`
- Modify: `app/api/monitor/route.ts`
- Modify: `app/api/report/[id]/pdf/route.ts`
- Modify: `app/dashboard/page.tsx`
- Modify: `messages/en.ts`
- Modify: `messages/ru.ts`
- Create: `components/dashboard/BetaAccessPanel.tsx`

- [ ] **Step 1: Extend auth types**

Add `effectivePlan`, `planSource`, and `activeBetaGrant` fields to `UserWithPlan`. Preserve `plan` as the base profile plan for compatibility.

- [ ] **Step 2: Implement resolver**

In `lib/auth.ts`, fetch active `beta_access_grants`, call `effectivePlanFromSources`, and return `effectivePlan`. Add `bindCurrentUserGrowthAttribution()` that reads `sr_attr`, updates first/last attribution fields, and creates a beta grant for valid campaign/referral/promo when applicable.

- [ ] **Step 3: Replace gating**

Use `user.effectivePlan` for scan limits, monitoring, PDF export, dashboard plan labels, and upgrade banners. Keep `profiles.plan` unchanged so billing can override later.

- [ ] **Step 4: Add dashboard beta/referral panel**

Create `BetaAccessPanel` with accessible copy, clear expiry date, referral link, copy button, and a "why this matters" hint. Use existing dark ShipReady visual language, 44px touch targets, visible focus states, and no emoji icons.

- [ ] **Step 5: Add translations**

Add English and Russian messages under `Dashboard.betaAccess`.

- [ ] **Step 6: Run tests/lint and commit**

Run:

```bash
npm run test:checks -- tests/growth-attribution.test.ts
npm run lint
```

Expected: both pass.

Commit:

```bash
git add lib/auth.ts app/api/scan/route.ts app/api/monitor/route.ts app/api/report/[id]/pdf/route.ts app/dashboard/page.tsx components/dashboard/BetaAccessPanel.tsx messages/en.ts messages/ru.ts
git commit -m "feat: resolve beta pro access"
```

## Task 4: Internal Growth Admin Dashboard

**Files:**
- Create: `app/admin/growth/page.tsx`
- Modify: `messages/en.ts`
- Modify: `messages/ru.ts`

- [ ] **Step 1: Implement admin guard**

Create a server-only admin helper inside `app/admin/growth/page.tsx` or a local helper function. Read `ADMIN_EMAILS`, split by comma, and require the current Supabase user email to match. If not authenticated, redirect to `/auth/login`; if authenticated but not admin, call `notFound()`.

- [ ] **Step 2: Query metrics**

Using `createServiceClient`, query counts for visits, events, scans, beta grants, campaigns, referral codes, and channel breakdowns. Return only aggregate DTOs to the page.

- [ ] **Step 3: Build dashboard UI**

Create responsive cards and tables:

- Overview cards: visits, signups/events, active beta grants, completed scans.
- Channels table: `utm_source`, visits, signups, completed scans.
- Campaigns table: slug, active, grant_days, grants.
- Referrals table: code, owner, uses/activated.
- Activation checklist: first scan, second scan, PDF export, monitoring enabled.

Follow `ui-ux-pro-max`: contrast, keyboard focus, mobile-first layout, no color-only status, readable tables on mobile.

- [ ] **Step 4: Run lint and commit**

Run: `npm run lint`

Expected: pass.

Commit:

```bash
git add app/admin/growth/page.tsx messages/en.ts messages/ru.ts
git commit -m "feat: add growth admin dashboard"
```

## Task 5: Campaign Launch Playbook And Final Verification

**Files:**
- Create: `docs/plans/2026-05-10-growth-campaign-launch-playbook.md`
- Modify: `docs/plans/2026-05-10-referral-growth-analytics-design.md` if implementation details drifted.

- [ ] **Step 1: Write launch playbook**

Create a markdown playbook with per-source steps for LinkedIn, X/Twitter, Product Hunt, Hacker News, Reddit, Indie Hackers, Dev.to/Hashnode/Medium, Telegram/Discord/Slack, direct outreach, startup directories, agencies, and SEO/tools.

- [ ] **Step 2: Include UTM templates**

For every source, include a concrete URL template using `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and optional `promo`.

- [ ] **Step 3: Include weekly operating cadence**

Add a 14-day launch schedule and daily metrics checklist.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run test:checks
npm run lint
npm run build
```

Expected: pass, or document any pre-existing/environment blocker.

- [ ] **Step 5: Commit**

```bash
git add docs/plans/2026-05-10-growth-campaign-launch-playbook.md docs/plans/2026-05-10-referral-growth-analytics-design.md
git commit -m "docs: add growth campaign launch playbook"
```

## Review Requirements

After each task, run a spec compliance review and code quality review before moving on. After Task 5, run a final code review using `superpowers:requesting-code-review`, then run `security-best-practices` review for the changed Next.js/React/TypeScript surface.

## Self-Review

- Spec coverage: covers UTM/ref/promo capture, beta grants, effective Pro access, referral tracking, admin dashboard, LinkedIn, traffic channels, and launch playbook.
- Placeholder scan: no implementation step relies on "TBD"; each task has concrete files, commands, and expected outcomes.
- Type consistency: `Plan`, `AttributionPayload`, `GrantLike`, `effectivePlan`, and `activeBetaGrant` are defined in Task 1/3 and reused consistently.
