# DECISIONS

> Все архитектурные решения и rejected paths.
> Агент читает перед любым техническим решением — не предлагать отклонённое снова.

---

## Принятые решения

| ID | Решение | Почему |
|----|---------|--------|
| D-01 | Lemon Squeezy, не Stripe | Stripe требует юр. лицо. LS — merchant of record: налоги сами, карты СНГ, нет требований |
| D-02 | @sparticuz/chromium для Lighthouse | Единственный Chrome билд для Vercel serverless (~50MB). Playwright там не работает |
| D-03 | Статичные issue templates + один AI вызов | AI на каждый issue = 25 вызовов = $0.25+/скан. Один вызов для summary — достаточно |
| D-04 | Supabase для PostgreSQL + Auth + Storage | Free tier включает всё. @supabase/ssr хорошо интегрируется с Next.js |
| D-05 | HTML fetчится один раз, передаётся строкой | Несколько fetch = медленнее + риск разных HTML если страница динамическая |
| D-06 | Vercel region fra1 (Frankfurt) | Ближе к СНГ + Европе. US добавляет 100–200ms на каждый fetch |
| D-07 | next-intl без /ru/ /en/ URL сегментов | i18n routing усложняет MVP. Переключатель в navbar — достаточно |
| D-08 | Lemon Squeezy checkout с custom user_id | `?checkout[custom][user_id]={id}` → webhook знает кому обновить план |

---

## Rejected paths (не предлагать)

| Отклонено | Причина |
|-----------|---------|
| Stripe | Нет юр. лица для старта |
| Playwright | Не работает на Vercel serverless |
| Browserless | Платный $49/мес — лишние расходы для MVP |
| Prisma | Supabase JS SDK напрямую проще, меньше слоёв |
| Redis | Не нужен — Supabase достаточно |
| Docker | Усложняет деплой, Vercel serverless проще |
| Firebase | Vendor lock-in, NoSQL не подходит для scan results |
| Claude на каждый issue | Дорого: 25 вызовов × $0.01 = $0.25+/скан |
| Multi-region Vercel | Дорого для MVP |
| Глубокий DAST (runtime XSS, auth bypass) | Это VibeEval territory. Наш v1 — passive analysis |
| Мультистраничный краулинг | Только главная страница в v1 |
| CI/CD интеграция | v2 фича |

---

## Лог новых решений

> Добавлять при каждом новом архитектурном решении.

### D-10: OpenAI вместо Anthropic для AI summary
Решение: `gpt-4o-mini` вместо `claude-sonnet-4-20250514` для генерации summary.
Почему: Anthropic недоступен для оплаты на старте. OpenAI уже оплачен. gpt-4o-mini дешевле и достаточен для 2–3 предложений summary.
Переменная: `OPENAI_API_KEY` вместо `ANTHROPIC_API_KEY`.
Отклонено: Anthropic — вернуться можно в v2 если нужно.

### D-11: Добавить категорию ai_visibility (AEO + GEO)
Решение: 5-я категория `ai_visibility` (8 проверок) — AEO (Schema.org, FAQ schema, heading hierarchy, thin content) + GEO (llms.txt, AI crawlers в robots.txt, sitemap.xml, author entity).
Почему: Аудитория — indie hackers которые хотят попасть в ChatGPT/Perplexity/Google SGE. Ни один конкурент (Cheeeck, Lighthouse, VibeEval) это не проверяет — это наш дифференциатор.
Веса scoring обновлены: performance×0.25 + seo×0.20 + security×0.25 + mobile×0.10 + ai_visibility×0.20 = 1.0.

### D-12: Два AI промпта на весь скан + UI-селектор инструмента
Решение: GPT генерирует два варианта в одном вызове: `aiTechnicalPrompt` (Cursor, Windsurf, Claude Code — файловые пути, конкретные теги) и `aiVibePrompt` (Bolt, Lovable, v0, Replit — высокоуровнево). UI показывает таббар с иконками инструментов, маппинг: Cursor/Windsurf/Claude → technical, Bolt/Lovable/v0/Replit/OpenAI → vibe.
Почему: Пересматривает D-03. Один GPT вызов, два поля. Технические и vibe-инструменты реально нуждаются в разном стиле промптов. Per-issue промпты убраны из UI.

### Pending decisions (решить перед реализацией Phase 8)

- **D-13: PDF generation** — puppeteer screenshot на Railway runner vs react-pdf/jsPDF на клиенте?
  - Puppeteer: точный pixel-perfect вывод, но нужен Railway round-trip, медленно (~5 сек)
  - react-pdf: быстро, на клиенте, но нужно вёрстать PDF отдельно
  - Рекомендация: react-pdf — у нас уже есть Railway runner, но PDF дёшевле делать клиентом

- **D-14: Monitored domains хранение** — отдельная таблица `monitored_domains` vs флаг в scans?
  - Отдельная таблица: чище, позволяет хранить email + настройки per domain
  - Флаг в scans: проще, но нет single source of truth для "какие домены мониторим"
  - Рекомендация: отдельная таблица `monitored_domains`

---

### D-09: Lighthouse runner на Railway, фронт на Vercel
Решение: Vercel (Hobby) деплоит фронт + все API кроме Lighthouse. Railway (Hobby $5/мес) запускает `/api/run-scan` — тяжёлый Lighthouse scan.
Почему: Vercel Hobby лимит 1024MB RAM и 10 сек timeout. Lighthouse + Chromium требуют ~2GB и ~40 сек. Railway Hobby даёт до 8GB RAM, без timeout.
Связь: Vercel вызывает `RAILWAY_SCANNER_URL/api/run-scan` с `Authorization: Bearer SCANNER_SECRET`. Lighthouse обновляет Supabase напрямую.
Fallback: если `RAILWAY_SCANNER_URL` не задан — запуск локально через setTimeout (dev режим).
Отклонено: Vercel Pro — $20/мес дороже. Отдельный Express сервис — дублирование кода.
