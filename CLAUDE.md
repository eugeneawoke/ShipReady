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
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ShipReady** (3401 symbols, 5841 relationships, 275 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ShipReady/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ShipReady/clusters` | All functional areas |
| `gitnexus://repo/ShipReady/processes` | All execution flows |
| `gitnexus://repo/ShipReady/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
