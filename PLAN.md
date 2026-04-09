# PLAN

## Текущая фаза

```
ФАЗА:   9 — Quality Overhaul
СТАТУС: в процессе
ЦЕЛЬ:   Отчёт всегда правдивый: score строится только на подтверждённых фактах,
        медленные проверки не маскируются под success, AI работает поверх evidence,
        а product promise опирается на telemetry
```

---

## Фазы

| # | Название | Цель | Статус |
|---|---------|------|--------|
| 0 | Подготовка | Инфраструктура | ✅ частично (домен + Vercel + Supabase не задеплоены) |
| 1 | Скелет | Next.js + роуты + DB | ✅ готово |
| 2 | Core checks | Lighthouse + SEO + mobile + links | ✅ готово |
| 3 | Security | 11 security проверок | ✅ готово |
| 4 | AI Engine | issue templates + OpenAI summary + AI Visibility | ✅ готово (код написан) |
| 5 | Report UI | ScoreRing + IssueCard + FixPromptSection | ✅ готово (UI есть) |
| 6 | Монетизация | Auth + provider-agnostic billing + paywall UI | 🔄 в процессе (см. TODO) |
| 7 | Запуск | Product Hunt + vc.ru + HN | ⏳ не начата |
| 8 | Pro Features | AI промпты работают + PDF + мониторинг + email | 🔄 в процессе |
| 9 | Quality Overhaul | Confidence/evidence model, phased scan flow, truthful scoring, telemetry | 🔄 стартует |
| 10 | Pro Features | AI промпты работают + PDF + мониторинг + email | 🔄 в процессе |
| 11 | AI Content Checks | AI-only wow insights поверх evidence, Pro-only аддон | 💡 идея |

---

## Что есть в коде но НЕ РАБОТАЕТ в проде

| Фича | Что написано | Почему не работает |
|------|-------------|-------------------|
| AI fix prompts | `generate-summary.ts` генерирует `aiTechnicalPrompt` + `aiVibePrompt` | Нужен `OPENAI_API_KEY` в env; без него поля пустые, UI показывает "AI prompt not available" |
| Billing webhook | Legacy Lemon Squeezy route removed | Payment provider TBD; paid access can be manual during beta |
| Weekly monitoring rescan | `monitored_domains` + dashboard toggle + `app/api/cron/rescan/route.ts` ресканят активные домены | Нужны prod env (`CRON_SECRET`, `RAILWAY_SCANNER_URL`, `SCANNER_SECRET`) и applied migration `008_monitoring.sql` |
| Rate limiting | Написан в `app/api/scan/route.ts` | Работает только как базовый monthly limit; нет richer abuse controls и observability |
| PDF export | `GET /api/report/[id]/pdf` генерирует PDF через Chromium | Нужен `pro/agency` user, node runtime и applied deploy |
| Email alerts | `lib/email/send-alert.ts` + monitoring diff logic отправляют письма через Resend | Нужны `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, verified sender domain |
| IssueCard per-issue prompts | `cursorPrompt`/`boltPrompt` есть в Issue type | IssueCard их не рендерит, промпты нигде не показаны |
| Truthful scoring | Сейчас любой найденный issue штрафует score | Нет confidence model; heuristics и likely checks смешаны с verified findings |
| Measurement status | Тяжёлые checks fallback'ятся молча | При провале Lighthouse система может не показать, что performance вообще не измерялся |

---

## Лог переходов

| Дата | Из фазы | В фазу | Заметка |
|------|---------|--------|---------|
| 2026-04-07 | 0 | 6 | Фазы 1–5 реализованы локально, деплой ещё не сделан |
| 2026-04-07 | 6 | 8 | Фаза 6 частично сделана (auth + webhook код есть), переходим к pro features |
| 2026-04-08 | 8 | 9 | Перед pro-фичами запускаем quality overhaul: без truthful scan model нельзя обещать high-quality product |
| 2026-04-08 | 9 | 10 | Во время quality overhaul реализованы платные promise-фичи: PDF export, weekly monitoring, email alerts |
