# PLAN

## Текущая фаза

```
ФАЗА:   Private Beta Readiness
СТАТУС: активная подготовка к первым реальным пользователям
ЦЕЛЬ:   Дать продукт первым beta-пользователям без ложных обещаний:
        scan/report/auth/dashboard должны работать в проде,
        AI prompts должны быть включены через OPENAI_API_KEY,
        billing provider остаётся TBD и не блокирует beta.
```

---

## Фазы

| # | Название | Цель | Статус |
|---|---------|------|--------|
| 0 | Подготовка | Инфраструктура | 🔄 production verification |
| 1 | Скелет | Next.js + роуты + DB | ✅ готово |
| 2 | Core checks | Lighthouse + SEO + mobile + links | ✅ готово |
| 3 | Security | 11 security проверок | ✅ готово |
| 4 | AI Engine | issue templates + OpenAI summary + AI Visibility | ✅ готово (код написан) |
| 5 | Report UI | ScoreRing + IssueCard + FixPromptSection | ✅ готово (UI есть) |
| 6 | Монетизация | Auth + provider-agnostic billing + paywall UI | 🔄 provider TBD; beta manual access |
| 7 | Public Launch | Product Hunt + vc.ru + HN | ⏳ после beta |
| 8 | Pro Features | AI промпты + PDF + мониторинг + email | 🔄 код есть, prod setup/checks нужны |
| 9 | Quality Overhaul | Confidence/evidence model, phased scan flow, truthful scoring, telemetry | ✅ core shipped; telemetry script остаётся |
| 10 | Private Beta Readiness | Продовая проверка, env, миграции, feedback loop | 🔄 текущая фаза |
| 11 | AI Content Checks | AI-only wow insights поверх evidence, Pro-only аддон | 💡 идея |
| 12 | Scanner Expansion Stage 1 | +11 checks: SEO×5, Security×4, Mobile×2 | ✅ done (2026-05-07, commit 53c37c3) |
| 13 | Scanner Expansion Stage 2 | Accessibility category + REST API v1 + api_keys table | ✅ done (2026-05-07, commit a272270) |
| 14 | Scanner Expansion Stage 3 | GitHub Action + Vercel hook + Slack/Discord | 🚫 отложено → Agency roadmap |
| 15 | Scanner Expansion Stage 4 | Multi-page crawl (Pro/Agency) | ✅ done (2026-05-07, BFS crawler + guardrails + report UI) |
| 16 | Scanner Expansion Stage 5 | Team seats + bulk scan API | ✅ done (2026-05-07) — Agency dashboard defer→Phase 17 |
| 17 | Agency Integrations | GitHub Action (Marketplace), Vercel deploy hook, Slack/Discord alerts | 💡 Agency tier, post-Stage 5 |
| 18 | Blog / Knowledge Base | SEO-контент: статьи по безопасности, AI visibility, SEO. Органика + экспертное позиционирование | 💡 идея |
| 19 | Report Comparison     | Сравнение двух сканов одного домена: до/после, diff по категориям и issues                       | 💡 идея |
| 20 | Product Evolution v2 — Phase 1 Cleanup | Удалить шум: twitter-card, og-url-double-slash, sitemap-double-slash, apple-touch-icon | ✅ done (2026-05-24, commit a461a09) |
| 21 | Product Evolution v2 — Phase 2 ScanGoal | ScanGoal: seo\|security\|ai_visibility\|full; mode-aware progress labels | ✅ done (2026-05-24, commit ce8959e) |
| 22 | Product Evolution v2 — Phase 3 Artifacts | GeneratedArtifacts: llms.txt, schema.org, security headers | ✅ done (2026-05-24, commit 8db8f51) |
| 23 | Product Evolution v2 — Phase 4 AI Visibility | AIPlatformReadiness breakdown, SPA detection, analytics check | ✅ done (2026-05-24, commit 3d905a5) |
| 24 | Product Evolution v2 — Phase 5 Security | SecurityAlertBanner (3 critical IDs), redirect-chain detection | ✅ done (2026-05-24, commit 938e628) |
| 25 | Product Evolution v2 — Phase 6 Mobile | tapTargets + fontSizeIssues in LighthouseMetrics → mobileIssues | ✅ done (2026-05-24, commit 1a22f13) |
| 26 | Product Evolution v2 — Phase 7 Report UI | scanGoal-aware category ordering, ArtifactBlock copy UI, SupportingCategoryChips, AI platform readiness grid | ✅ done (2026-05-24, commit dc577c2) |
| 27 | Product Evolution v2 — Phase 8 Landing Pages | /seo, /security, /ai-visibility pages + ModePicker на главной + nav update | ✅ done (2026-05-24, commit a79745a) |
| 28 | Product Evolution v2 — Phase 9 Docs Sync | Обновить PLAN.md + project-spec.md после фаз 7–8 | ✅ done (2026-05-24) |
| 29 | Checks Deepening — Phase 1 Zero Deps | +17 checks: SPF/DMARC/DKIM DNS, cookie flags, per-bot AI crawler, llms.txt validation | 💡 planned |
| 30 | Checks Deepening — Phase 2 Light npm | sitemap quality, robots.txt quality, semantic HTML, schema required fields (fast-xml-parser, robots-parser) | 💡 planned |
| 31 | Checks Deepening — Phase 3 Free APIs | SSL Labs TLS checks, OSV CVE lookup, CrUX from PSI, Pro AI content citability | 💡 planned |
| 32 | IntentLead Integration | Post-audit "Who You're Missing" overlay via IntentLead AI (Reddit/HN signals by businessContext) | 💡 Coming Soon |
| 33 | Growth Bundle | ShipReady Agency + IntentLead Growth as bundled plan ($99/mo). Single billing, unified dashboard | 💡 Coming Soon |
| 34 | REST API Public Docs | Public docs + SDKs for Agency API v1 (already exists in code, needs docs + rate-limit tuning) | 💡 Coming Soon (Agency tier) |
| 35 | GSC + Яндекс Вебмастер Integration | OAuth → реальная индексация, Coverage report, CTR по страницам в отчёте | 💡 Coming Soon (Pro) |
| 36 | Analytics Integration | GA4 + Яндекс Метрика OAuth → traffic data в отчёте | 💡 Coming Soon (Agency) |
| 37 | Rank Tracking | Позиции по ключевым словам через DataForSEO | 💡 Coming Soon (Agency) |
| 38 | Competitor Analysis | Keywords gap + backlink comparison через DataForSEO | 💡 Coming Soon (Agency) |

---

## Что есть в коде но НЕ РАБОТАЕТ в проде

| Фича | Что написано | Почему не работает |
|------|-------------|-------------------|
| AI fix prompts | `generate-evidence-enrichment.ts` генерирует summary/priorities/prompts поверх evidence | Нужен `OPENAI_API_KEY` в env там, где выполняется scanner |
| Billing webhook | Legacy Lemon Squeezy route removed | Payment provider TBD; paid access can be manual during beta |
| Weekly monitoring rescan | `monitored_domains` + dashboard toggle + `app/api/cron/rescan/route.ts` ресканят активные домены | Нужны prod env (`CRON_SECRET`, `RAILWAY_SCANNER_URL`, `SCANNER_SECRET`) и applied migration `008_monitoring.sql` |
| Rate limiting | Написан в `app/api/scan/route.ts` | Работает только как базовый monthly limit; нет richer abuse controls и observability |
| PDF export | `GET /api/report/[id]/pdf` генерирует PDF через Chromium | Нужен `pro/agency` user, node runtime и applied deploy |
| Email alerts | `lib/email/send-alert.ts` + monitoring diff logic отправляют письма через Resend | Нужны `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, verified sender domain |
| Telemetry baseline | timings сохраняются в result | Нужен SQL/script для p50/p95/p99 и failure rate by phase |

---

## Лог переходов

| Дата | Из фазы | В фазу | Заметка |
|------|---------|--------|---------|
| 2026-04-07 | 0 | 6 | Фазы 1–5 реализованы локально, деплой ещё не сделан |
| 2026-04-07 | 6 | 8 | Фаза 6 частично сделана (auth + webhook код есть), переходим к pro features |
| 2026-04-08 | 8 | 9 | Перед pro-фичами запускаем quality overhaul: без truthful scan model нельзя обещать high-quality product |
| 2026-04-08 | 9 | 10 | Во время quality overhaul реализованы платные promise-фичи: PDF export, weekly monitoring, email alerts |
| 2026-04-09 | 10 | Private Beta Readiness | Core quality/security fixes shipped locally; осталось применить prod setup и прогнать smoke test |
