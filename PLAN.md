# PLAN

## Текущая фаза

```
ФАЗА:   8 — Pro Features
СТАТУС: не начата
ЦЕЛЬ:   Платный тариф реально работает: AI промпты видны, PDF скачивается,
        мониторинг сканирует и шлёт письма
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
| 6 | Монетизация | Auth + Lemon Squeezy webhook + paywall UI | 🔄 в процессе (см. TODO) |
| 7 | Запуск | Product Hunt + vc.ru + HN | ⏳ не начата |
| 8 | Pro Features | AI промпты работают + PDF + мониторинг + email | ⏳ не начата |
| 9 | Качество отчёта | Информативный summary + UX улучшения | ⏳ не начата |

---

## Что есть в коде но НЕ РАБОТАЕТ в проде

| Фича | Что написано | Почему не работает |
|------|-------------|-------------------|
| AI fix prompts | `generate-summary.ts` генерирует `aiTechnicalPrompt` + `aiVibePrompt` | Нужен `OPENAI_API_KEY` в env; без него поля пустые, UI показывает "AI prompt not available" |
| Lemon Squeezy webhook | `app/api/webhooks/ls/route.ts` обрабатывает события | Продукты не созданы в LS, `LEMON_SQUEEZY_WEBHOOK_SECRET` не настроен |
| Weekly monitoring rescan | `app/api/cron/rescan/route.ts` запрашивает pro users | Не настроен в `vercel.json` как Cron, нет `CRON_SECRET`, не шлёт email |
| Rate limiting | Не написано | — |
| PDF export | Не написано | — |
| Email alerts | Не написано | — |
| IssueCard per-issue prompts | `cursorPrompt`/`boltPrompt` есть в Issue type | IssueCard их не рендерит, промпты нигде не показаны |

---

## Лог переходов

| Дата | Из фазы | В фазу | Заметка |
|------|---------|--------|---------|
| 2026-04-07 | 0 | 6 | Фазы 1–5 реализованы локально, деплой ещё не сделан |
| 2026-04-07 | 6 | 8 | Фаза 6 частично сделана (auth + webhook код есть), переходим к pro features |
