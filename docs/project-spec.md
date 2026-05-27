# ShipReady Project Specification

Last updated: 2026-05-24
Status: private beta readiness

## Purpose

ShipReady is a web audit tool for founders, developers, and agencies who want their site found — by Google, by AI assistants, and by real users. Paste a URL and get a confidence-scored report across SEO, AI visibility, security, performance, mobile, and accessibility.

The product serves three tiers: solo founders who scan and fix manually; developers and tech leads who use fix prompts and copy-paste artifacts; freelancers and agencies who use the API and MCP server (coming soon) for client audits and bulk workflows.

The product promise is trust-first: the report says what was verified, what is likely, what is heuristic, and what could not be measured. AI improves wording, prioritization, and fix prompts, but must not invent technical findings.

## Current Phase

Current operating phase: **Private Beta Readiness**.

This sits between the old planning phases:

- Phase 9, Quality Overhaul: mostly implemented in code.
- Phase 10, Pro Features: core code is present, production setup still needs verification.
- Phase 7, Launch: not public launch yet; today’s target is controlled beta with real users.

Practical interpretation: ShipReady is close enough to show to first beta users, as long as the beta is framed honestly and production setup is verified before inviting them.

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
- Email alert pipeline after Resend production setup is complete.
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
- Agency/team workflows.
- CI/CD integrations.
- Multi-page crawl mode.
- Deep DAST, runtime XSS testing, or auth bypass testing.
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
- Payment provider is PayPro Global (Merchant of Record). Lemon Squeezy and Stripe are explicitly rejected. See D-28.
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

Obsolete plan:

- `docs/superpowers/plans/2026-04-07-ai-prompts-v4.md`
- kept for history only; do not implement it as written.

## Access Model

- Anonymous scans are readable by report URL.
- Authenticated scans are private to the owner.
- Authenticated report polling uses an ownership check.
- Future public sharing for authenticated reports must use a separate share token or explicit public flag.
- Public badges require explicit `badge_enabled = true`; default is `false`.

## Monetization And Paid Features

Current code state:

- Free / Pro / Agency plan model exists.
- Free scan limits exist for user/IP.
- Pricing UI exists.
- PDF export exists for Pro/Agency.
- Weekly monitoring exists for Pro/Agency.
- Email alert pipeline exists.
- PayPro Global checkout + IPN webhook + SHA256 verification implemented (D-28).
- `subscriptions` table + `payment_events` audit log (migration 015).
- `beta_access_grants` + referral campaigns infrastructure (migration 014).
- Effective plan: paid sub > beta_access_grant > profiles.plan (`getEffectivePlanForUserId`).
- REST API v1 (`/api/v1/scan`) with Bearer API key auth + rate limiting.

Production setup still required before relying on paid features:

- Apply Supabase migrations 001–015 in production.
- Create Pro Monthly/Yearly products in PayPro dashboard; get Product IDs.
- Configure PayPro IPN URL and env vars (`PAYPRO_VALIDATION_KEY`, `PAYPRO_VENDOR_ID`, etc.).
- Configure Resend API key and verified sender.
- Verify the Railway scanner and shared `SCANNER_SECRET`.
- Run end-to-end production smoke test.

For today’s beta, manual invite/manual Pro access is acceptable and safer than rushing full paid launch.

## Security Posture

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

Beta can start after these are true in production:

- `OPENAI_API_KEY` is funded and set where scanner code runs.
- Supabase JWT expiry is saved as `1800` seconds.
- Supabase migrations are applied, including monitoring and `badge_enabled`.
- Vercel and Railway env vars are present.
- At least one production scan completes from landing page to report.
- A stalled scan shows partial report or clear failure instead of infinite loading.
- Authenticated dashboard opens and shows user scans.
- The owner has a direct feedback/support path for beta users.

Not required for beta:

- Full paid launch.
- Email alerts, if Resend sender domain is not verified yet.
- Dedicated egress firewall/proxy.
- Agency/team workflows.

## Current Launch Recommendation

Launch as **controlled private beta**, not broad public paid launch.

Recommended wording:

> ShipReady is in private beta. Reports are evidence-based, and some deeper checks may still be marked as unavailable when they cannot be measured reliably. Feedback is welcome while we harden the scanner and paid workflows.

## Post-Beta Roadmap

Priority 1:

- Production observability for scan failures by phase.
- Real p50/p95/p99 scan duration telemetry.
- End-to-end paid flow verification.
- Resend sender verification and monitoring alerts.
- Better report onboarding explaining verified / likely / heuristic.

Priority 2:

- Scanner outbound firewall/proxy hardening.
- Share tokens for authenticated reports.
- Improved per-issue prompt UI.
- Public paid launch messaging.

Priority 3:

- Agency workflows.
- Team seats.
- API access.
- GitHub Action and deployment integrations.
- Multi-page crawl and broader accessibility checks.

### Coming Soon

- IntentLead AI integration — post-audit "Who You're Missing" overlay layer
- Growth Bundle (ShipReady Agency + IntentLead) — bundled pricing
- REST API public documentation and SDK examples
- GSC + Яндекс Вебмастер OAuth integration — real indexation data in report
- GA4 + Яндекс Метрика OAuth integration — traffic data in report
- Rank tracking via DataForSEO
- Competitor analysis (keywords gap + backlinks)

## Agency/Pro Integrations Roadmap

These integrations require OAuth or paid APIs and are not part of the current scanner.

| Integration | What it adds | When |
|---|---|---|
| Google Search Console | Real indexation, Coverage report, CTR per page | Pro tier, future phase |
| Яндекс Вебмастер | Яндекс indexation, diagnostics | Pro tier, future phase |
| Google Analytics 4 | Traffic, goals, conversions | Agency tier |
| Яндекс Метрика | Same for RU/CIS market | Agency tier |
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
