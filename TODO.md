# TODO

> Формат: `[ ]` ожидает · `[~]` в процессе · `[x]` готово · `[!]` заблокировано

## Текущая фаза — Private Beta Readiness

Цель: сегодня дать продукт первым beta-пользователям без ложных обещаний и без блокировки на полноценный paid launch.

## Beta launch blockers

- [ ] Запушить локальный `main` в GitHub: сейчас local ahead of `origin/main`.
- [ ] Применить production Supabase migrations: `001`–`015` (включая PayPro billing и growth tables).
  - Критично: миграции `014` (beta_access_grants, growth_campaigns, RPC) и `015` (subscriptions, payment_events) обязательны для работы биллинга и кампаний.
- [ ] Убедиться, что Supabase Auth JWT expiry сохранён как `1800` секунд.
- [ ] Задать/проверить production env в Vercel и Railway:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `OPENAI_SCAN_MODEL`
  - `CRON_SECRET`
  - `RAILWAY_SCANNER_URL`
  - `SCANNER_SECRET`
  - `RESEND_API_KEY` и `RESEND_FROM_EMAIL`, если email alerts включаются в beta
  - `PAYPRO_VALIDATION_KEY` — из Store Settings → General → Integration
  - `PAYPRO_SECRET_KEY` — то же значение (для sandbox checkout URL)
  - `PAYPRO_VENDOR_ID` — из Account Settings → Business Info
  - `PAYPRO_SANDBOX` — `"false"` в production
  - `PAYPRO_PRODUCT_PRO_MONTHLY` — integer Product ID из PayPro dashboard
  - `PAYPRO_PRODUCT_PRO_YEARLY` — integer Product ID из PayPro dashboard
- [ ] Создать продукты в PayPro dashboard: Pro Monthly ($14/mo) и Pro Yearly ($140/yr). Получить Product IDs.
- [ ] Настроить IPN URL в PayPro Store Settings: `https://[domain]/api/payments/paypro/webhook` (заблокировано на домен).
- [ ] Пополнить OpenAI billing и проверить, что новый production scan сохраняет:
  - `aiSummary`
  - `topPriorities`
  - `aiTechnicalPrompt`
  - per-issue prompt overrides
- [ ] Прогнать production smoke test:
  - landing scan → report
  - authenticated scan → private report
  - dashboard scan list
  - stalled/error state не крутится бесконечно
  - PDF export для вручную включённого `pro/agency`
  - monitoring toggle для вручную включённого `pro/agency`
  - sandbox checkout → подписка создана → план = pro в dashboard
  - 14-day trial: `/signup?promo=14day-trial` → beta_access_grants запись создана → план = pro
- [ ] Подготовить feedback path для beta users: email/support text/dashboard CTA.

## Done

- [x] **Phase 1 (Cleanup) — 2026-05-24**: Removed noise checks — `missing-twitter-card`, `missing-twitter-image`, `og-url-double-slash`, `sitemap-double-slash`, `missing-touch-icon` from seo.ts / mobile.ts / issue-meta.ts / issue-templates.ts / check-catalog.ts. Build clean. Commit a461a09.
- [x] **Phase 2 (ScanGoal) — 2026-05-24**: Replaced ScanGoal union with `seo|security|ai_visibility|full`. Updated 11 files: types, API routes, report page, enrichment, ScanForm, i18n. Added `buildScanStages(scanGoal?)` with per-goal labels. Commit ce8959e.

## Done in code

- [x] Next.js 16 App Router + React 19 app shell.
- [x] Supabase auth + profiles + scans.
- [x] Landing page, pricing, roadmap, privacy, terms.
- [x] Scan creation with quota checks for anonymous/free users.
- [x] Railway scanner dispatch through `/api/run-scan`.
- [x] Phased scan statuses: `pending`, `running_fast`, `running_deep`, `enriching`, `done`, `error`.
- [x] Fast Truth Pass and Deep Pass.
- [x] Shared fetch context for HTML/headers/timing.
- [x] Confidence/evidence model: `verified`, `likely`, `heuristic`.
- [x] Score uses `scoreEligible` findings.
- [x] Measurement states: `measured`, `partial`, `unavailable`.
- [x] Report UI shows confidence/evidence and measurement warnings.
- [x] AI evidence enrichment via `generate-evidence-enrichment.ts`.
- [x] Pro/Agency wow insights via `generate-wow-insights.ts`.
- [x] Global technical fix prompts (single `aiTechnicalPrompt`).
- [x] Per-issue expandable prompts in `IssueCard`.
- [x] PDF export route for `pro/agency`.
- [x] Weekly monitoring schema, dashboard toggle, cron rescan, email alert pipeline.
- [x] Stale scan handling after 3 minutes with partial report/error explanation.
- [x] SSRF hardening in code: DNS/private IP checks, redirect checks, repeated fetch validation.
- [x] Same-origin JSON guard for state-changing API routes.
- [x] Baseline security headers.
- [x] Public badge access is opt-in via `badge_enabled = false` default.
- [x] Lemon Squeezy removed; PayPro Global selected as payment provider (D-28).
- [x] PayPro checkout + IPN webhook + SHA256 signature verification.
- [x] Subscriptions table + payment_events audit log (migration 015).
- [x] Effective plan logic: paid subscription > beta_access_grant > profiles.plan.
- [x] Growth/referrals infrastructure: campaigns, referral codes, beta_access_grants, RPC (migration 014).
- [x] API key authentication + rate limiting (`/api/v1/scan`).

## Not required for private beta

- [ ] Subscription management UI (cancel, renewal date, payment status).
- [ ] Payment failure / dunning emails.
- [ ] Agency/team workflows (UI).
- [ ] Multi-page crawl.
- [ ] GitHub Action / CI integration.
- [ ] Dedicated scanner outbound firewall/proxy.

## Post-beta next

- [ ] Собрать p50/p95/p99 scan duration и failure rate by phase.
- [ ] Улучшить onboarding в отчёте: объяснить `verified / likely / heuristic / unavailable`.
- [ ] Проверить Resend sender domain и end-to-end email alerts.
- [ ] Subscription management UI: статус, дата renewal, кнопка отмены через PayPro Customer Portal.
- [ ] Добавить share tokens для authenticated reports.
- [ ] Запланировать scanner outbound firewall/proxy hardening перед широким публичным запуском.
- [ ] IP whitelisting для PayPro REST API (если понадобятся исходящие API вызовы к PayPro).
- [ ] Blog / Knowledge Base: SEO-статьи по темам аудита (безопасность, AI visibility, SEO, performance).
- [ ] Report Comparison: сравнение двух сканов одного домена (diff по категориям, issues, score).
