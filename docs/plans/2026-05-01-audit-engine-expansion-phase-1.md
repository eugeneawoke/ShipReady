# Improvement Backlog: Audit Engine Expansion (Phase 1)

Last updated: 2026-05-01
Status: planned
Owner: ShipReady core

Related:
- [Overview](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-overview.md)
- Product baseline: `docs/project-spec.md`

## Goal

Expand ShipReady audit depth without breaking the trust-first model:

- Keep technical findings evidence-based.
- Keep score impact only for verified score-eligible checks.
- Add strategic/business-aware recommendations as a separate non-score layer.

## Priority P0

### 1) `base_url_normalization`
Scope:
- Normalize `NEXT_PUBLIC_APP_URL` once (strip trailing slash).
- Detect malformed double-slash URLs in `robots`, `sitemap`, `schema`, `canonical`.

Why:
- Removes a critical class of SEO failures with one shared fix.

### 2) `canonical_domain_consistency_check`
Scope:
- Validate consistency of canonical domain across `canonical`, `sitemap`, `robots`, `llms.txt`, and schema URLs.

Why:
- Prevents domain conflicts and indexation ambiguity.

### 3) `indexability_guardrails_check`
Scope:
- Explicit checks for `index/noindex` behavior on private or sensitive surfaces (`/report/*`, `/dashboard`, and similar routes).

Why:
- Reduces accidental indexing of private or low-value pages.

### 4) `social_preview_completeness_check`
Scope:
- Validate `og:image` presence.
- Validate `twitter:image` when `twitter:card=summary_large_image`.
- Validate `og:url` consistency with canonical domain.

Why:
- Improves link previews and discoverability quality.

### 5) `business_context_v2`
Scope:
- Expand business context extraction (`ICP`, monetization model, primary CTA, product type, audience clarity).

Why:
- Enables recommendations that match the real business, not generic templates.

### 6) `prompt_personalization_v2`
Scope:
- Condition AI prompts on `businessContext + scanGoal`.
- Differentiate output by business type (SaaS, agency, local business, etc.).

Why:
- Makes remediation prompts materially more actionable.

## Priority P1

### 1) `schema_validation_extended`
Scope:
- Validate required fields for key types (`WebApplication.operatingSystem`, `Organization.sameAs`, etc.).
- Detect deprecated/restricted schema types.
- Detect placeholder/fake values.

Why:
- Prevents false confidence from incomplete schema.

### 2) `metadata_depth_checks`
Scope:
- Extend checks for meta description quality/length, meta robots, canonical hygiene, and heading structure sanity.

Why:
- Strengthens on-page signal quality with deterministic checks.

### 3) `image_seo_baseline_checks`
Scope:
- Detect missing `alt`, missing image dimensions (CLS risk), and basic oversized asset heuristics where available.
- Detect missing report-level OG image strategy.

Why:
- Closes the current image SEO blind spot with low operational overhead.

### 4) `sitemap_quality_checks_v2`
Scope:
- Validate sitemap URL quality (double slash, redirects, canonical mismatch, weak URL coverage).

Why:
- Turns sitemap checks into quality checks, not existence checks.

### 5) `ai_visibility_citability_checks`
Scope:
- Add deterministic signals for citability (self-contained answer blocks, explicit Q&A blocks, author/entity signals).

Why:
- Improves GEO guidance without external paid APIs.

### 6) `strategy_block_in_report`
Scope:
- Add a dedicated `Strategic Recommendations` section (2-week and 1-month actions).
- Keep this section non-score.

Why:
- Combines scanner reliability with higher-level guidance safely.

## Priority P2

### 1) `sxo_conversion_signals_checks`
Scope:
- Heuristics for high-intent conversion surfaces (indexable pricing, demo report link, dead-end CTA detection).

Why:
- Connects SEO findings with conversion outcomes.

### 2) `perf_architecture_heuristics`
Scope:
- Advisory checks for architecture patterns affecting CWV (CSR-heavy pages, cache-control anti-patterns, heavy client islands).
- Mark as non-score unless measured.

Why:
- Adds early performance guidance while preserving score integrity.

### 3) `trust_signals_checks`
Scope:
- Validate author/about/contact/legal freshness and entity consistency across content and schema.

Why:
- Improves E-E-A-T and AI trust interpretation.

## Definition of Done (Phase 1)

1. Every new check has explicit `confidence` and `scoreEligible` mapping.
2. Strategic and heuristic advisories do not silently penalize score as verified facts.
3. Every new issue includes evidence and a concrete remediation prompt.
4. Report output clearly separates `Technical Findings` and `Strategic Recommendations`.
5. No regressions in CI baseline: `npm run lint` and `npm run build` pass.

## Execution Order

1. P0-1..P0-4 (domain/metadata/indexability/social critical checks).
2. P0-5..P0-6 (business context and prompt personalization).
3. P1-1..P1-4 (schema/image/sitemap depth).
4. P1-5..P1-6 (GEO citability and strategic report layer).

## Out of Scope (Phase 1)

- Full multi-page crawler and crawl queue orchestration.
- Google API integrations (GSC/GA4/CrUX/Indexing API).
- DataForSEO/backlink/LLM mention paid integrations.
- Local maps/citations/reviews infrastructure.

These belong to later phases with dedicated infra and cost controls.
