# PLAN

## Текущая фаза

```
ФАЗА:   0 — Подготовка
СТАТУС: не начата
ЦЕЛЬ:   инфраструктура готова, первый деплой пустой страницы на Vercel
```

---

## Фазы

| # | Название | Цель | Готово когда |
|---|---------|------|-------------|
| 0 | Подготовка | Инфраструктура | Живой URL, все env подключены |
| 1 | Скелет | Next.js + роуты + DB | POST /api/scan работает, /report/[id] показывает polling |
| 2 | Core checks | Lighthouse + SEO + mobile + links | scan URL → JSON с реальными данными |
| 3 | Security | 11 security проверок | exposed .env и API keys in HTML находит |
| 4 | AI Engine | 25 issue templates + Claude summary | cursorPrompt/boltPrompt работают при вставке в Cursor |
| 5 | Report UI | ScoreRing + IssueCard + OGPreview | Выглядит профессионально, промпты копируются |
| 6 | Монетизация | Auth + Lemon Squeezy + paywall | Первая оплата технически возможна |
| 7 | Запуск | Product Hunt + vc.ru + HN | Первый платный пользователь |

---

## Лог переходов

| Дата | Из фазы | В фазу | Заметка |
|------|---------|--------|---------|
| —    | —       | —      | —       |
