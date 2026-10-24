# ShipReady — Agent Context

> Keep this file short. It is loaded automatically by some agents.
> Current source of truth for product/spec details: `docs/project-spec.md`.

---

## Startup Ritual

Before proposing architecture, features, or status — in order:

0. **Ruflo RAG recall** — search relevant past insights: `mcp__ruflo__memory_search {query: "<current topic>"}`. Apply any relevant findings before proceeding.
1. `AGENTS.md` — unified agent context, tool mapping, current blockers
2. `docs/project-spec.md` — current product specification
3. `PLAN.md` — current phase
4. `TODO.md` — beta checklist
5. `DECISIONS.md` — accepted and rejected decisions
6. `EVIDENCE.md` — verified facts and outdated assumptions
7. `MEMORY.md` — persistent context

After a completed change, update the relevant doc instead of leaving stale plans behind.

**After every completed phase or architectural decision:**
- `PLAN.md` — mark phase ✅ done with commit hash
- `TODO.md` — check off items, add new ones
- `DECISIONS.md` — add D-N entry if architectural choice was made
- `EVIDENCE.md` — add verified fact or mark assumption outdated
- `MEMORY.md` — update current phase + key changes if significant

---

## Product

ShipReady is a free website audit tool. Paste a URL — get a clear report on why
Google, ChatGPT, Claude, Codex, Gemini, and Perplexity can't find your site,
and the exact steps to fix it.

User flow:

1. User submits a URL.
2. ShipReady scans performance, SEO, security, mobile readiness, and AI visibility.
3. Report shows verified facts, likely/heuristic observations, unavailable measurements, and fix prompts.

Audience: solo founders, developers, web agencies, and anyone who wants their site found online.
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

Payment provider is **PayPro Global** (Merchant of Record, D-28). Lemon Squeezy and Stripe are explicitly rejected. Webhook + checkout code written; pending prod env vars and IPN URL configuration on PayPro side.

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

## ⛔️ GIT — НИКОГДА НЕ КОММИТИТЬ

**Это нарушалось и попало в репо. Никогда не повторять.**

Запрещено трекать в git:
- `.claude/`, `.agents/`, `.kiro/`, `.windsurf/`, `.superpowers/`, `.cursor/` — IDE-конфиги
- `MEMORY.md` — содержит личные данные
- `PLAN.md`, `TODO.md`, `ACTION-PLAN.md`, `DECISIONS.md`, `EVIDENCE.md`, `DESIGN.md`, `CHECKS.md`, `AGENTS.md`
- `docs/plans/`, `docs/superpowers/`, `docs/setup/`, `docs/feature-plans/`, `docs/marketing/`
- `docs/paypro-global-integration.md`, любые интеграционные инструкции
- `agentdb.rvf`, `ruvector.db`, `*.pid`, `*.log` — runtime файлы
- Любые research/анализ документы в корне (`*_research_*.md`, `*-analysis.md`)

Перед `git add` — всегда проверять `git status` и добавлять файлы поимённо, не `git add -A`.

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
- **After `git commit` on any phase: run `npm run test:all`. Phase is NOT ✅ done until `test:all` passes with 0 failures.**
- Manual scan flow is NOT coverable by Playwright — always test manually via smoke checklist (`docs/qa/smoke-checklist.md`) before prod deploy.

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
OAUTH_STATE_SECRET
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
YANDEX_OAUTH_CLIENT_ID
YANDEX_OAUTH_CLIENT_SECRET
YANDEX_OAUTH_REDIRECT_URI
BING_OAUTH_CLIENT_ID
BING_OAUTH_CLIENT_SECRET
BING_OAUTH_TENANT_ID
BING_OAUTH_REDIRECT_URI
SERPER_API_KEY
PAYPRO_VALIDATION_KEY
PAYPRO_PRODUCT_PRO_MONTHLY
PAYPRO_PRODUCT_PRO_YEARLY
PAYPRO_SANDBOX
PAYPRO_SECRET_KEY
```

<!-- codebase-memory:start -->
# Code intelligence

This project is indexed by **codebase-memory-mcp** (persistent code knowledge graph). Before editing a function/class, use its graph tools (`search_graph`, `trace_path`, `detect_changes`) to find callers and blast radius. If the project is not indexed yet, ask to "index this project".
<!-- codebase-memory:end -->
