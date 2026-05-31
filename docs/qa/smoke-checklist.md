# Pre-deploy Smoke Checklist — ShipReady

Run before every production deploy. ~15 minutes. Start from top — if Core fails, stop and fix first.

---

## Core — Scan flow ⚠️ CRITICAL

> Cannot be automated (requires live Railway + real Chromium + Supabase).
> If this breaks, everything else is irrelevant.

- [ ] Paste any public URL → Scan button becomes active
- [ ] Click Scan → progress screen appears (ReportSkeleton)
- [ ] Report loads → 6 category score rings visible with numbers
- [ ] At least one IssueCard expands → evidence/description shown
- [ ] Rescan button triggers new scan

---

## Auth

- [ ] `/auth/login` renders without errors
- [ ] Email signup form submits (don't need to complete full flow)
- [ ] Dashboard `/dashboard` opens for a logged-in user with scan history

---

## Pricing

- [ ] `/pricing` — feature comparison table renders
- [ ] Monthly/Yearly toggle switches prices correctly

---

## SEO Landing Pages

- [ ] `/seo` — loads, ScanForm visible with SEO goal pre-selected
- [ ] `/security` — loads, ScanForm visible
- [ ] `/ai-visibility` — loads, ScanForm visible

---

## Phase 62 — Competitor Comparison Pages

- [ ] `/vs` — 5 competitor cards visible (Ahrefs, Screaming Frog, Semrush, SE Ranking, Otterly)
- [ ] `/vs/semrush` — page loads, view-source contains `"@type": "FAQPage"`
- [ ] CTA on any `/vs/[slug]` links to `/`

---

## Phase 63 — Roadmap Changelog

- [ ] `/roadmap` — both "Roadmap" and "What's New" tabs visible
- [ ] Click "What's New" → changelog entries appear (not empty)
- [ ] Changelog order: "Growth & Quality Tooling" (May 28) above "Scanner Engine" (May 7)

---

## Phase 64 — Blog

- [ ] `/blog` — page loads without JS errors, tag filter chips visible
- [ ] `/blog?tag=SEO` — page loads (may show empty state, must not crash)

---

## Phase 65 — Audit Reports

- [ ] `/audits` — page loads without JS errors

---

## Infrastructure

- [ ] `sitemap.xml` — contains at least one `/vs/` URL and `/blog`
- [ ] Footer → "Blog" link → `/blog`
- [ ] Footer → "Compare" link → `/vs`
- [ ] Footer → "Audit Reports" link → `/audits`
- [ ] `npm run build` — exits with 0 errors
- [ ] `npm run lint` — exits with 0 errors

---

## Notes

- **Scan flow is manual-only** — Railway scanner cannot be mocked reliably in automated tests
- **Admin pages** (`/admin/blog`, `/admin/audits`) — test only if `ADMIN_SECRET` is set in local env
- Playwright E2E covers all non-scan checks automatically; this checklist is a final sanity pass for things only a human can verify

Last updated: 2026-05-29
