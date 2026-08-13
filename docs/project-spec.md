# Glook Project Specification

Last updated: 2026-08-13
Status: private beta readiness

## Purpose

Glook is an evidence-based website audit for business owners who suspect that something is wrong with their site but do not yet know the cause. It finds blind spots that can prevent customers from discovering the business or trusting the website, then turns the evidence into priorities and ready-to-use fixes.

The primary buyer is a business owner. Initial use-case segments include SaaS and online services, ecommerce, local businesses, and agencies auditing client websites. Developers, marketers, and agency staff remain important users and implementation partners, but the public entry point is the owner's symptom: "something is wrong with my website."

The two primary product pillars are **Visibility** (Google and AI discovery/readiness) and **Security** (external website security posture and trust). Performance, mobile, and accessibility provide supporting evidence for the unified diagnosis.

The confirmed brand message is:

- RU: **«У вашего сайта есть слепые зоны. Glook их находит.»**
- EN: **“Your website has blind spots. Glook finds them.”**

Hero support copy:

- RU: «Glook показывает, что мешает клиентам находить ваш бизнес и доверять вашему сайту. В отчёте — проверенные причины, чёткие приоритеты и готовые исправления.»
- EN: “Glook reveals what keeps customers from finding your business and trusting your website—with verified findings, clear priorities, and ready-to-use fixes.”

The product promise is trust-first: the report says what was verified, what is likely, what is heuristic, and what could not be measured. AI improves wording, prioritization, and fix prompts, but must not invent technical findings.

## Current Phase

Current operating phase: **Private Beta Readiness**.

Practical interpretation: the scanner and core beta flow have been verified in production. Current work is owner-first positioning, customer validation, report redesign, OAuth production verification, and selecting a viable payment/tax model after the PayPro and FastSpring rejections.

## Product Scope

### In scope for beta

- URL scan from landing page.
- Report page with partial/progressive scan states.
- Report page actions for rescan of the current URL and starting a new URL scan.
- Six categories:
  - Performance
  - SEO
  - Security
  - Mobile
  - AI visibility
  - Accessibility
- Evidence-backed issue cards.
- Verified / likely / heuristic confidence model.
- Measurement states for heavy checks.
- AI summary and fix prompts when `OPENAI_API_KEY` is funded and configured.
- Auth, dashboard, and owned reports.
- PDF export for Pro/Agency users.
- Weekly monitoring toggle for Pro/Agency users.
- Email alert pipeline through the verified Resend sender.
- Three focused landing pages: `/seo`, `/security`, `/ai-visibility` with pre-selected scanGoal.
- Per-platform AI readiness breakdown (ChatGPT, Claude, Perplexity, Google AI) in report.
- Generated artifacts: llms.txt, Schema.org JSON-LD, security headers config (copy-paste blocks in report).
- SPA/no-SSR detection (sites that render only in browser).
- Redirect chain detection (2+ hops).
- Lighthouse mobile metrics mapped to Mobile category (tap targets, font size).
- Analytics detection (GA4/GTM/Яндекс Метрика).
- Keyword-in-page check via businessContext.

### Out of scope for beta

- Full public paid launch.
- A polished Agency/team dashboard workflow (core API, MCP, team primitives and CI template already exist).
- Marketplace distribution and production hardening of CI/CD integrations.
- Deep DAST, runtime XSS testing, or auth bypass testing.
- Repository/source-code security audit of customer applications.
- Dedicated scanner outbound firewall/proxy infrastructure.

## Architecture

### Runtime split

- Vercel hosts the Next.js app and lightweight route handlers.
- Railway runs the scanner path for heavier Lighthouse/Chromium work.
- Supabase provides PostgreSQL, auth, and report storage.
- OpenAI provides evidence-grounded report enrichment.
- Resend sends monitoring alerts.

### Key decisions

- Supabase is the database and auth provider.
- Payment strategy is reopened. PayPro Global and FastSpring declined the project; no production payment processor is currently approved. See D-41.
- Railway is used for scanner execution because Vercel Hobby is not a good fit for heavy Chromium scans.
- AI is one compact enrichment call for normal scans, with Pro/Agency wow insights as a separate add-on.
- PageSpeed Insights is only a future benchmark, not the default scanner path.
- REST API v1 (`/api/v1/scan`) exists with API key authentication; Agency/team UI is deferred to Phase 17.

## Scan Flow

1. Browser submits `POST /api/scan`.
2. The API enforces same-origin JSON request checks, validates URL safety, applies quota checks, and creates a `pending` scan.
3. Production dispatches to Railway via `RAILWAY_SCANNER_URL`.
4. Railway calls `/api/run-scan` with `Authorization: Bearer ${SCANNER_SECRET}`.
5. Scanner runs:
   - Fast Truth Pass
   - Deep Pass
   - AI enrichment
   - optional Pro/Agency wow insights
6. Results are saved to Supabase.
7. `/report/[id]` polls `/api/scan/[id]`, shows partial results where possible, and transitions to the final report when complete.
8. If a scan stalls, polling marks stale active scans using stage-specific limits and shows the best available partial report plus a clear processing issue. Fast stages use short limits; deep Lighthouse work gets a longer window because Chromium audits can legitimately take several minutes on the Railway scanner.

## Quality Model

Each issue can include:

- `confidence`: `verified`, `likely`, or `heuristic`
- `scoreEligible`
- `evidence[]`
- `source`

Only verified score-eligible findings should affect score. Likely and heuristic findings can be shown, but should not silently penalize the user as hard facts.

Heavy checks should expose measurement state:

- `measured`
- `partial`
- `unavailable`

A failed measurement must never look like a pass.

## Target Report Experience

The current report already exposes category scores, evidence-backed issues, priorities, prompts, and generated artifacts. The next report iteration will reorganize that information without weakening the evidence model:

1. **Unified diagnosis** — a concise explanation of the site's overall condition.
2. **Key causes** — verified, likely, heuristic, and unavailable evidence shown separately.
3. **Visibility card** — Google and AI discoverability/readiness.
4. **Security card** — external security posture and trust risks.
5. **Prioritized plan** — what to address first, next, and later.
6. **Ready fixes** — deterministic artifacts, implementation instructions, and technical prompts.

The diagnosis must not claim that an issue caused traffic, revenue, or lead loss unless connected first-party data proves the relationship. It may explain plausible impact with the appropriate confidence label.

## AI Model

Current active implementation:

- `lib/ai/generate-evidence-enrichment.ts`
- called from `lib/checks/index.ts`

AI receives compact evidence and existing findings. It generates in one call:

- `summary`
- `topPriorities`
- `technicalPrompt` — code-file level detail, for Cursor / Windsurf / Claude Code
- `issuePrompts` — per-issue `{ technical }` used to populate individual issue `fixPrompt` fields
- `strategicRecommendations` — timeframe-bucketed strategic actions

**UI "Fix everything" block shows `technicalPrompt`** with a deterministic fallback if AI enrichment did not run. No tool selector or tab bar.

Rules:

- AI cannot create new issue IDs.
- AI cannot introduce new technical facts.
- AI must respect confidence and evidence.
- AI failures are timeout-bounded and must not block scan completion forever.

The functional core often described as an "AI Visibility Agent" already exists: deterministic checks, per-platform readiness, trust signals, evidence, and grounded enrichment. It should evolve through orchestration and verification rather than be rewritten as an autonomous agent from zero.

Obsolete plan:

- `docs/superpowers/plans/2026-04-07-ai-prompts-v4.md`
- kept for history only; do not implement it as written.

## Access Model

- Current scans are readable by their unguessable UUID report URL; the UUID acts as a bearer token for both anonymous and authenticated scans.
- This is acceptable for the current controlled beta but is not equivalent to explicit privacy controls.
- Phase 67 adds `is_public`/share controls and blocks private authenticated scans for other users.
- Public badges require explicit `badge_enabled = true`; default is `false`.

## Monetization And Paid Features

Current code state:

- Free / Pro / Agency plan model exists.
- Anonymous and Free users are limited to 3 scans per month (anonymous by IP).
- Pricing UI exists.
- PDF export exists for Pro/Agency.
- Weekly monitoring exists for Pro/Agency.
- Email alert pipeline exists.
- Legacy PayPro Global checkout + IPN webhook + SHA256 verification remains implemented, but the provider declined the project and the flow cannot be used for production payments.
- `subscriptions` table + `payment_events` audit log (migration 015).
- `beta_access_grants` + referral campaigns infrastructure (migration 014).
- Effective plan: paid sub > beta_access_grant > profiles.plan (`getEffectivePlanForUserId`).
- REST API v1 (`/api/v1/scan`) with Bearer API key auth + rate limiting.

Current production state:

- Railway scanner, AI enrichment, PDF export, weekly monitoring and the verified Resend sender have been confirmed in production.
- PayPro declined the application without an explanation. FastSpring also declined because the requested statements were unavailable.
- FastSpring recommended using a non-MoR processor temporarily and reapplying after several months of operating history. This is an option to evaluate, not an approved implementation decision.
- No public checkout should be enabled until processor availability, KYC, payout, tax/VAT/sales-tax responsibility, chargebacks, and jurisdictional constraints are reviewed.
- OAuth routes and scan-flow integrations exist; Google/Yandex/Bing production OAuth E2E and report-data verification remain follow-up work.

For the controlled beta, manual invite/manual Pro access is the current path while the payment strategy is re-evaluated.

## Security Posture

### Customer-facing audit boundary

The current Glook URL scan measures **external website security posture**: HTTPS/TLS, security headers, DNS and email-security signals, cookie flags, exposed-file/key patterns, and limited endpoint probes. It is not a penetration test and does not perform deep DAST, exploit validation, authenticated attack simulation, or auth-bypass testing.

Security auditing of customer websites remains part of Glook, not a separate third product. The future deeper mode requires:

- explicit proof of ownership or written authorization;
- a declared target scope;
- safe rate limits and stop conditions;
- auditable consent and scan logs;
- isolated DAST infrastructure.

Codex Security is appropriate for a customer repository or source tree that the customer explicitly connects. It is not a drop-in URL scanner for arbitrary client websites. Agent roles may orchestrate checks, validate evidence, prioritize remediation, and support ongoing monitoring under the hood, but deterministic measurements remain the source of technical facts.

### Glook application posture

Fixed in code:

- `.claude/settings.local.json` removed from git tracking and ignored.
- Supabase temp metadata ignored.
- State-changing JSON routes use same-origin request guards.
- Scan URL validation checks protocol, credentials, DNS, private IPs, and redirects.
- Scanner fetches re-run URL safety checks and use manual redirects.
- App-wide security headers are configured.
- CSP is currently report-only to avoid breaking Next.js runtime behavior before production observation.
- Public badge exposure is opt-in by schema default.
- Railway Docker build uses `npm ci`.

Still operational, not code-only:

- Rotate/revoke any previously exposed external token-like credential.
- Keep Supabase access token expiry at 1800 seconds for beta.
- Apply production Supabase migrations.
- Add scanner outbound firewall/proxy later, before a broader public launch.

## Beta Readiness

Core beta readiness confirmed by the latest project checklist:

- Railway scans complete and save results in production.
- AI enrichment and generated artifacts are active.
- PDF export and weekly monitoring have been verified.
- Resend sender/domain is configured.
- The manual smoke checklist has been completed.

Remaining beta follow-up:

- owner interviews and feedback loop;
- owner-first public messaging;
- OAuth production E2E/report verification;
- telemetry baseline and richer abuse observability.

Not required for controlled beta: full paid launch, a payment processor, dedicated egress firewall/proxy, or a polished Agency/team UI.

## Current Launch Recommendation

Launch as **controlled private beta**, not broad public paid launch.

Recommended wording:

> Glook is in private beta. Reports are evidence-based, and some deeper checks may still be marked as unavailable when they cannot be measured reliably. Feedback is welcome while we validate the product with business owners and harden paid workflows.

## Post-Beta Roadmap

Priority 1:

- Production observability for scan failures by phase.
- Real p50/p95/p99 scan duration telemetry.
- End-to-end paid flow verification.
- Owner-first messaging and customer interviews.
- Diagnosis-first report information architecture.
- Better report onboarding explaining verified / likely / heuristic.

Priority 2:

- Scanner outbound firewall/proxy hardening.
- Share tokens for authenticated reports.
- Improved per-issue prompt UI.
- Public paid launch messaging.

Priority 3:

- Production-hardened Agency dashboard workflows around the existing API, MCP and team primitives.
- GitHub Marketplace distribution and deploy-integration hardening.
- Broader authorized security testing and accessibility coverage.

### Coming Soon

- IntentLead AI integration — post-audit "Who You're Missing" overlay layer
- Growth Bundle (Glook Agency + IntentLead) — bundled pricing
- Production verification for GSC, Яндекс Вебмастер, GA4, Яндекс Метрика and Bing OAuth flows
- Authorized deeper website security audit after ownership verification
- Optional connected-repository security audit through Codex Security
- Rank tracking via DataForSEO
- Competitor analysis (keywords gap + backlinks)

## Agency/Pro Integrations Roadmap

OAuth routes and scan-flow integrations exist, but production E2E/report verification is still pending. Paid data-provider integrations remain future work.

| Integration | What it adds | When |
|---|---|---|
| Google Search Console | Real indexation, Coverage report, CTR per page | Code shipped; prod verification pending |
| Яндекс Вебмастер | Яндекс indexation, diagnostics | Code shipped; prod verification pending |
| Google Analytics 4 | Traffic and engagement signals | Code shipped; prod verification pending |
| Яндекс Метрика | Same for RU/CIS market | Code shipped; prod verification pending |
| Bing Webmaster | Crawl/indexing diagnostics | Code shipped; prod verification deferred for beta |
| Rank tracking | Keyword positions via DataForSEO / SerpAPI | Agency tier |
| Competitor analysis | Keywords gap + backlink comparison via DataForSEO | Agency tier |

Until integration: fix prompts for relevant issues contain manual instructions with direct links to GSC, Яндекс Вебмастер, etc.

## Source Documents

- `README.md`
- `DECISIONS.md`
- `PLAN.md`
- `TODO.md`
- `docs/plans/2026-04-08-first-user-launch-plan.md`
- `docs/plans/2026-04-08-quality-overhaul-plan.md`
- `docs/setup/paid-features-setup.md`
- `security_best_practices_report.md`
- `app/roadmap/page.tsx`
