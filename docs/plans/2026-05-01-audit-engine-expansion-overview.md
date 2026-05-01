# Improvement Roadmap: Audit Engine Expansion (Overview)

Last updated: 2026-05-01
Status: planned
Owner: ShipReady core

Related:
- [Phase 1](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-phase-1.md)
- [Phase 2](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-phase-2.md)
- [Phase 3](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-phase-3.md)
- Product baseline: `docs/project-spec.md`

## Roadmap Objective

Build a broader SEO/GEO audit engine in 3 phases without breaking ShipReady's trust-first contract:

- Evidence first.
- Clear confidence model (`verified`, `likely`, `heuristic`).
- Score penalties only for verified score-eligible findings.
- Strategic guidance as a separate layer from hard technical scoring.

## Phase Summary

### Phase 1 — Foundation Expansion (No New External Infra)
Goal:
- Increase audit depth and business relevance using deterministic checks and current runtime stack.

Primary outcomes:
- Stronger technical checks (domain/meta/schema/sitemap/image/indexability).
- Better business-context extraction and prompt personalization.
- Separate strategic report layer without score contamination.

### Phase 2 — Data Integrations and Crawl Infrastructure
Goal:
- Move from single-page deep scan to site-level and data-backed audit with resilient external integrations.

Primary outcomes:
- Controlled multi-page crawl.
- Queue orchestration, retries, failure handling.
- Optional Google and paid provider data with quota/cost guardrails.

### Phase 3 — Productization and Advanced Intelligence
Goal:
- Turn expanded audit capabilities into reliable product features for monitoring, team workflows, and enterprise-ready reporting.

Primary outcomes:
- Drift-aware monitoring and alert quality controls.
- Stronger sharing/access controls.
- Layered report UX and execution playbooks.
- Agency/API/CI product surfaces.

## Cross-Phase Guardrails

1. Never mix strategic heuristics into verified score penalties.
2. Every new check must define:
- Evidence contract.
- Confidence level.
- Score eligibility.
- Failure behavior (`measured`, `partial`, `unavailable`).
3. All external integrations must have:
- Retry policy.
- Timeout policy.
- Cost/usage guardrails.
- Explicit fallback behavior.
4. User-facing copy must clearly state what was measured vs inferred.

## Suggested Delivery Sequence

1. Finish Phase 1 `P0` then `P1` before enabling Phase 2 integrations.
2. Ship Phase 2 in slices:
- Crawl engine + orchestration first.
- Google integrations second.
- Optional paid connectors last.
3. Start Phase 3 only after Phase 2 reliability metrics are stable (latency, failure rate, alert noise).
