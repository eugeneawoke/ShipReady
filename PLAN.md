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
| 16 | Scanner Expansion Stage 5 | Agency dashboard + team seats | ⏳ после Stage 4 |
| 17 | Agency Integrations | GitHub Action (Marketplace), Vercel deploy hook, Slack/Discord alerts | 💡 Agency tier, post-Stage 5 |

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
