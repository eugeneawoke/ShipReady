# Code Review Report

## Executive summary

Проект в рабочем состоянии по `next build`, но не проходит quality gate по `npm run lint` и содержит несколько дефектов в основном scan flow. Самая существенная функциональная проблема: weekly rescan для платных пользователей фактически не выполняется в production, а страница отчета может показать ложный `error`, хотя бэкенд все еще обрабатывает scan.

## Findings

### CR-001 — High — Weekly rescans are not actually executed on Vercel cron

**Location:** `app/api/cron/rescan/route.ts:43-64`

**Evidence:**

```ts
setTimeout(async () => {
  try {
    const { runAllChecks } = await import('@/lib/checks/index')
    await runAllChecks(scan.url, data.id)
  } catch {}
}, 0)
```

**Why this is a problem:** unlike the Railway-only `run-scan` endpoint, this code runs inside a Vercel route handler. Returning the response ends the request lifecycle, so the fire-and-forget `setTimeout` is not a reliable execution mechanism. The cron endpoint reports `rescanned: count`, but production rescans can be silently skipped.

**Impact:** Pro and Agency monitoring is unreliable; users may believe weekly rescans are happening when they are not.

### CR-002 — High — Report page can show a false scan failure after 70 seconds

**Location:** `app/report/[id]/page.tsx:172-178`, `app/report/[id]/page.tsx:215-220`

**Evidence:**

```ts
const timeout = setTimeout(() => {
  clearInterval(interval)
  setScan(prev => prev ? { ...prev, status: 'error' } : null)
  setInitialLoading(false)
}, 70_000)
```

**Why this is a problem:** the client unilaterally flips the scan to `error` after 70 seconds even if the backend is still processing it. Long Lighthouse runs, slow targets, or queueing delays will be surfaced as failures in the UI despite eventually succeeding server-side.

**Impact:** users can abandon a valid scan, re-run unnecessarily, and consume limits because the frontend timed out before the backend finished.

### CR-003 — Medium — The project currently fails its own lint gate

**Location:** multiple files; reproduced by `npm run lint`

**Evidence:** `eslint` reports 17 errors and 3 warnings. The highest-signal ones are:

- `app/auth/login/page.tsx:69` — synchronous `setState` inside `useEffect`
- `components/report/ReportSkeleton.tsx:39` — synchronous `setState` inside `useEffect`
- `components/ui/dot-pattern.tsx:105-106` — `Math.random()` during render
- `components/ui/meteors.tsx:40` — synchronous `setState` inside `useEffect`
- `app/(landing)/page.tsx:425` and `app/report/[id]/page.tsx:259` — raw `<a>` used for internal navigation

**Why this is a problem:** even though `next build` succeeds, the repo has no green static-analysis baseline. That makes regressions easier to miss and weakens CI as a release gate.

**Impact:** review friction increases, future regressions are harder to separate from existing debt, and any CI job that enforces lint will block delivery.

### CR-004 — Medium — Anonymous monthly limit is inconsistent with the free-tier limit shown elsewhere

**Location:** `app/api/scan/route.ts:9-10`, `app/api/scan/route.ts:58-69`, `app/api/scan/route.ts:81-97`

**Evidence:**

- authenticated free users are limited from the first day of the current month
- anonymous users are limited using a rolling last-30-days window

```ts
const startOfMonth = new Date()
...
.gte('created_at', startOfMonth.toISOString())
```

vs.

```ts
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
...
.gte('created_at', thirtyDaysAgo)
```

**Why this is a problem:** the product copy and comments describe the same monthly limit, but two different accounting models are implemented.

**Impact:** users can hit limits at different times depending on auth state, which will look like billing or quota bugs.

## Verification

- `npm run build` — passed
- `npm run lint` — failed with 17 errors and 3 warnings

