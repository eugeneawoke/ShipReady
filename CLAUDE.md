# ShipReady — Agent Context

> Keep this file short. It is loaded automatically by some agents.
> Current source of truth for product/spec details: `docs/project-spec.md`.

---

## Startup Ritual

Read these before proposing architecture, features, or status:

1. `docs/project-spec.md` — current product specification
2. `PLAN.md` — current phase
3. `TODO.md` — beta checklist
4. `DECISIONS.md` — accepted and rejected decisions
5. `EVIDENCE.md` — verified facts and outdated assumptions
6. `MEMORY.md` — persistent context

After a completed change, update the relevant doc instead of leaving stale plans behind.

---

## Product

ShipReady is a pre-deploy quality gate for vibe-coded apps.

User flow:

1. User submits a URL.
2. ShipReady scans performance, SEO, security, mobile readiness, and AI visibility.
3. Report shows verified facts, likely/heuristic observations, unavailable measurements, and fix prompts for AI coding tools.

Audience: indie hackers, vibe coders, solo founders.
Current operating phase: **Private Beta Readiness**.

---

## Stack

Change this only with a `DECISIONS.md` entry.

```text
Next.js 16 App Router
React 19
TypeScript strict
Tailwind CSS v4
Supabase PostgreSQL + Auth
OpenAI evidence-grounded enrichment
@sparticuz/chromium + Lighthouse on Railway scanner runtime
cheerio
ssl-checker
Resend
Vercel app runtime
```

Payment provider is **TBD**. Lemon Squeezy is explicitly not selected.

---

## Commands

```bash
npm run dev
npm run lint
npm run build
npx supabase db push
```

There is no `npm run typecheck` script right now; `next build` is the practical type/build gate.

---

## Hard Rules

- Read relevant docs before answering project questions.
- Read relevant Next.js 16 docs under `node_modules/next/dist/docs/` before changing Next.js code.
- Never hardcode secrets; use `process.env.*`.
- Do not reintroduce Lemon Squeezy.
- Technical truth comes from measured evidence, not AI.
- AI may summarize, prioritize, and improve prompts, but must not invent issue IDs or facts.
- Types live in `types/scan.ts`; avoid inline duplicate scan types.
- Scan code belongs in `lib/checks/*`, `lib/ai/*`, or route handlers.
- New architecture decisions go into `DECISIONS.md`.
- New verified facts or invalidated assumptions go into `EVIDENCE.md`.

---

## Current Scan Flow

```text
POST /api/scan
  -> same-origin JSON guard
  -> URL safety validation and quota check
  -> Supabase insert with status pending
  -> production dispatch to Railway scanner

Railway /api/run-scan
  -> SCANNER_SECRET auth
  -> URL safety re-check
  -> shared safe fetch context
  -> Fast Truth Pass
  -> save partial result
  -> Deep Pass
  -> AI enrichment
  -> optional Pro/Agency wow insights
  -> save done/error result

/report/[id]
  -> polls /api/scan/[id]
  -> shows partial/progressive state
  -> marks active scans stale after 3 minutes
```

Statuses currently include:

```text
pending, running, running_fast, running_deep, enriching, done, error
```

---

## Quality Contract

- Each issue can have `confidence`, `scoreEligible`, `evidence`, and `source`.
- Only verified score-eligible issues should affect score.
- Likely and heuristic issues can be shown, but should not be treated as hard facts.
- Heavy measurements can be `measured`, `partial`, or `unavailable`.
- A failed measurement must never appear as a pass.

---

## Active File Map

```text
app/
  api/
    scan/route.ts
    scan/[id]/route.ts
    run-scan/route.ts
    cron/rescan/route.ts
    badge/[domain]/route.ts
  report/[id]/page.tsx
  dashboard/page.tsx
  pricing/page.tsx
components/
  landing/ScanForm.tsx
  report/ReportSkeleton.tsx
  report/IssueCard.tsx
  report/CategoryCard.tsx
lib/
  ai/generate-evidence-enrichment.ts
  ai/generate-wow-insights.ts
  ai/issue-templates.ts
  checks/index.ts
  checks/*.ts
  scoring.ts
  security/url-safety.ts
types/scan.ts
supabase/migrations/*.sql
docs/project-spec.md
```

---

## Environment Variables

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
CRON_SECRET
RAILWAY_SCANNER_URL
SCANNER_SECRET
```
