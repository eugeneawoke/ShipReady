# Improvement Backlog: Audit Engine Expansion (Phase 3)

Last updated: 2026-05-01
Status: planned
Owner: ShipReady core

Related:
- [Overview](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-overview.md)
- [Phase 2](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/plans/2026-05-01-audit-engine-expansion-phase-2.md)
- Product baseline: `docs/project-spec.md`

## Goal

Turn expanded audit capabilities into reliable product features for ongoing monitoring, team workflows, and enterprise-ready reporting.

## Priority P0

### 1) `monitoring_and_alerting_v2`
Scope:
- Drift-aware scheduled monitoring with category-level change detection.
- Alert quality controls: dedupe, severity thresholding, noise suppression.

Why:
- Converts one-time audits into continuous, high-signal monitoring.

### 2) `share_and_access_controls_v2`
Scope:
- Harden sharing model for authenticated reports (explicit share tokens/public flags).
- Role-aware access behavior for team workflows.

Why:
- Enables safe collaboration without weakening privacy guarantees.

### 3) `report_experience_v2`
Scope:
- Layered report UX:
  - Verified score-impact findings.
  - Measured provider insights.
  - Strategic recommendations.
- Explicit uncertainty communication for `partial/unavailable` checks.

Why:
- Improves trust and decision speed for end users.

### 4) `playbook_generation_v1`
Scope:
- Time-bounded execution plans in report (`Now`, `Next 2 Weeks`, `Next Month`) derived from evidence and business context.

Why:
- Turns findings into concrete execution workflows.

## Priority P1

### 1) `agency_workflows_v1`
Scope:
- Portfolio-level view for multiple client domains.
- Prioritization queue by impact/risk/business goal.

Why:
- Supports the core agency use case at scale.

### 2) `api_and_ci_surface_v1`
Scope:
- API and CI integration path for scheduled scans and deployment quality gates.

Why:
- Enables automation and repeatable QA processes.

### 3) `knowledge_feedback_loop_v1`
Scope:
- Capture issue-resolution outcomes and feed prompt-quality improvements.

Why:
- Improves recommendation quality over time.

### 4) `advanced_geo_layer_v1`
Scope:
- Platform-specific GEO recommendations with stronger entity/citation strategy guidance.

Why:
- Increases practical value of AI visibility outputs.

## Priority P2

### 1) `enterprise_compliance_pack_v1`
Scope:
- Audit trail, run metadata, and policy-ready exports.

Why:
- Supports enterprise governance requirements.

### 2) `custom_rules_engine_v1`
Scope:
- User-defined rule packs and category weighting per workspace.

Why:
- Allows product customization by team/process needs.

### 3) `predictive_prioritization_v1`
Scope:
- Confidence-aware prioritization using historical fix impact.

Why:
- Focuses effort on highest expected ROI actions.

## Definition of Done (Phase 3)

1. Monitoring produces low-noise, high-signal alerts with drift context.
2. Sharing/access controls support collaboration safely.
3. Report UX clearly separates certainty layers and execution plans.
4. Agency/team workflows are usable without breaking private-report guarantees.
5. API/CI surface supports repeatable automated quality gating.

## Dependencies

- Stable Phase 2 crawl plus external data pipeline.
- Mature access-control model and audit logging.
- Product analytics for alert/report quality tuning.
