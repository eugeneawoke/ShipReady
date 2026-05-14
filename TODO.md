# TODO

> Формат: `[ ]` ожидает · `[~]` в процессе · `[x]` готово · `[!]` заблокировано

## Текущая фаза — Private Beta Readiness

Цель: сегодня дать продукт первым beta-пользователям без ложных обещаний и без блокировки на полноценный paid launch.

## Beta launch blockers

- [ ] Запушить локальный `main` в GitHub: сейчас local ahead of `origin/main`.
- [ ] Применить production Supabase migrations: `001`–`009`, включая `008_monitoring.sql` и `009_badge_opt_in.sql`.
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
- [ ] Пополнить OpenAI billing и проверить, что новый production scan сохраняет:
  - `aiSummary`
  - `topPriorities`
  - `aiTechnicalPrompt`
  - `aiVibePrompt`
  - per-issue prompt overrides
- [ ] Прогнать production smoke test:
  - landing scan → report
  - authenticated scan → private report
  - dashboard scan list
  - stalled/error state не крутится бесконечно
  - PDF export для вручную включённого `pro/agency`
  - monitoring toggle для вручную включённого `pro/agency`
- [ ] Подготовить feedback path для beta users: email/support text/dashboard CTA.

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
- [x] Global technical/vibe fix prompts.
- [x] Per-issue expandable prompts in `IssueCard`.
- [x] PDF export route for `pro/agency`.
- [x] Weekly monitoring schema, dashboard toggle, cron rescan, email alert pipeline.
- [x] Stale scan handling after 3 minutes with partial report/error explanation.
- [x] SSRF hardening in code: DNS/private IP checks, redirect checks, repeated fetch validation.
- [x] Same-origin JSON guard for state-changing API routes.
- [x] Baseline security headers.
- [x] Public badge access is opt-in via `badge_enabled = false` default.
- [x] Payment provider reset to TBD; Lemon Squeezy removed from active code/docs.

## Not required for private beta

- [ ] Выбор нового payment provider.
- [ ] Public paid launch.
- [ ] Automated checkout/webhook billing.
- [ ] Dedicated scanner outbound firewall/proxy.
- [ ] Agency/team workflows.
- [ ] API access.
- [ ] GitHub Action / CI integration.
- [ ] Multi-page crawl.

## Post-beta next

- [ ] Собрать p50/p95/p99 scan duration и failure rate by phase.
- [ ] Улучшить onboarding в отчёте: объяснить `verified / likely / heuristic / unavailable`.
- [ ] Проверить Resend sender domain и end-to-end email alerts.
- [ ] Выбрать payment provider и спроектировать provider-agnostic checkout/webhook.
- [ ] Добавить share tokens для authenticated reports.
- [ ] Запланировать scanner outbound firewall/proxy hardening перед широким публичным запуском.
- [ ] Blog / Knowledge Base: SEO-статьи по темам аудита (безопасность, AI visibility, SEO, performance).
- [ ] Report Comparison: сравнение двух сканов одного домена (diff по категориям, issues, score).
