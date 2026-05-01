# Improvement Backlog: Audit Engine Expansion (Phase 2)

Last updated: 2026-05-01
Status: planned
Owner: ShipReady core

Related:
- [Overview](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-overview.md)
- [Phase 1](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-phase-1.md)
- Product baseline: `docs/project-spec.md`

## Goal

Move from single-page deep scan to site-level and data-backed audit with resilient external integrations.

## Priority P0

### 1) `crawl_engine_v1`
Scope:
- Add controlled multi-page crawl mode (start with capped scope by plan).
- Respect robots.txt directives.
- URL deduplication, canonical consolidation, crawl depth controls.
- Partial-result persistence for progressive report updates.

Why:
- Enables site-level findings instead of isolated page checks.

### 2) `scan_job_orchestration_v1`
Scope:
- Queue-based execution for crawl tasks and heavy checks.
- Stage-level timeouts/retries/dead-letter handling.
- Explicit stage telemetry (`queued`, `running`, `partial`, `failed`, `done`).

Why:
- Improves reliability and observability of long-running scans.

### 3) `cost_and_quota_guardrails_v1`
Scope:
- Per-scan budget controls for external calls.
- Plan-based limits for crawl depth and provider usage.
- Circuit-breakers for failing providers.

Why:
- Prevents runaway cost and unstable behavior.

### 4) `google_pagespeed_crux_integration_v1`
Scope:
- Integrate PSI/CrUX for measured field/lab context.
- Show data provenance and freshness timestamp in output.

Why:
- Adds stronger performance data quality versus heuristics-only signals.

## Priority P1

### 1) `google_search_console_integration_v1`
Scope:
- Optional GSC domain hookup for indexed pages, coverage, and query-level context.

Why:
- Connects audit with real search visibility signals.

### 2) `ga4_integration_v1`
Scope:
- Optional GA4 linkage for organic landing-page performance context.

Why:
- Aligns technical findings with traffic impact.

### 3) `sitemap_index_and_page_quality_v1`
Scope:
- Parse sitemap index files and validate URL status classes at scale.
- Map sitemap-vs-crawl coverage gaps.

Why:
- Upgrades sitemap checks from shallow presence to structural quality.

### 4) `cross_page_issue_aggregation_v1`
Scope:
- Aggregate recurring issues by route/template group (not only per-page).

Why:
- Makes large-site reports actionable and less noisy.

### 5) `historical_baseline_v1`
Scope:
- Store baseline snapshots and produce drift summary between scan versions.

Why:
- Adds meaningful change tracking over time.

## Priority P2

### 1) `dataforseo_optional_adapter_v1`
Scope:
- Optional paid connector for SERP/backlink/AI mention datasets.
- Hard fail-safe when credentials are not configured.

Why:
- Enables richer market and authority signals when needed.

### 2) `local_maps_signals_optional_v1`
Scope:
- Optional local SEO signals when integrations are configured and business type matches.

Why:
- Supports local businesses without forcing complexity on everyone.

## Definition of Done (Phase 2)

1. Multi-page crawl works with bounded limits and stable retries.
2. External provider failures degrade gracefully without blocking scan completion.
3. Reports label source provenance (`measured`, `provider`, `heuristic`) clearly.
4. Quota/cost guardrails are enforced and visible in telemetry.
5. End-to-end run provides progressive updates and final cross-page aggregation.

## Dependencies

- Secrets and OAuth handling for Google integrations.
- Persistent queue/job layer and telemetry storage.
- Plan model enforcement (free/pro/agency feature gates).
