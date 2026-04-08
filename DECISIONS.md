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
| D-09 | Lighthouse runner на Railway, фронт на Vercel | Vercel Hobby не подходит для тяжёлого Chromium scan; Railway держит Lighthouse и пишет результат в Supabase |

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

### D-13: Scan visibility model
Решение: анонимные сканы остаются доступными по `report/[id]`, а сканы авторизованных пользователей приватны и доступны только владельцу.
Почему: это сохраняет текущий frictionless flow для первого скана без аккаунта, но убирает утечку данных между пользователями dashboard/auth flow.
RLS: `user_id IS NULL OR user_id = auth.uid()` для SELECT на `scans`.
Последствие: любые публичные sharing features для авторизованных отчётов в будущем должны идти через отдельный `share_token` или явный `is_public`, а не через raw UUID.

### D-14: Unified scanner dispatch
Решение: и обычный scan, и weekly rescan диспатчатся в Railway scanner одинаковым способом через `RAILWAY_SCANNER_URL/api/run-scan`.
Почему: `setTimeout`/fire-and-forget внутри Vercel route handler ненадёжен для продового фонового исполнения. Один dispatch path уменьшает расхождения между flows и упрощает observability.
Fallback: локально в dev можно продолжать запускать checks напрямую, но production должен считать Railway обязательным scanner runner.

### D-15: SSRF protection — DNS/IP level, не только hostname string
Решение: URL для сканирования валидируется не только по схеме и hostname pattern, но и по resolved IP + redirect hops.
Почему: домен может резолвиться во внутренний адрес, и строковой фильтр hostname этого не ловит. Сканер — request-facing fetcher, поэтому его нужно считать SSRF sink.
Блокируем: loopback, RFC1918, link-local, metadata endpoints и redirects в private network.

### D-16: Truth-first scan model
Решение: система переходит с "любой найденный issue влияет на score" на trust-first модель:
- у каждого findings есть `confidence`: `verified | likely | heuristic`
- у тяжёлых измерений есть `measurement status`: `measured | unavailable | partial`
- только `verified` findings влияют на score
Почему: текущая модель смешивает факты и эвристики. Это создаёт риск ложных штрафов и, что хуже, ложных "всё хорошо" при сбое тяжёлого check.
Следствие: UI обязан показывать разницу между "подтверждённая проблема", "вероятная проблема" и "не удалось проверить".

### D-17: AI — только evidence-grounded enrichment, не источник истины
Решение: AI остаётся поверх детерминированных проверок и получает только уже собранные evidence/facts. AI не создаёт новые score-bearing technical issues.
Почему: deterministic checks лучше для воспроизводимости и цены. AI полезен для приоритизации, улучшения wording, контент-ревью и wow-инсайтов, но не должен решать "сломано ли это технически".
Практика:
- базовый AI вызов на каждом scan: enrichment/summary/prioritization
- wow-pass только для Pro/Agency
- browser-agent / multi-agent review не входит в основной scan-time path

### D-18: Fast Truth Pass + Deep Pass вместо одного монолитного scan
Решение: скан делится на две фазы.
- `Fast Truth Pass`: shared HTML + headers + SSL + verified SEO/mobile/AI visibility checks
- `Deep Pass`: Lighthouse и более шумные/дорогие проверки
Почему: пользователь должен быстро получать честные данные, а медленные проверки не должны блокировать truthful feedback или превращать отчёт в fake success/error.
Следствие: статусы scan должны стать детальнее (`running_fast`, `running_deep`, `enriching`, `done`, `error`).

### D-19: PSI API — только как benchmark, не замена по умолчанию
Решение: PageSpeed Insights API рассматривается как экспериментальный benchmark path, а не немедленная замена Railway Lighthouse.
Почему: PSI может дать лучшую latency, но приносит внешние квоты, data drift и меньший контроль над execution profile. Сначала нужен production telemetry baseline по текущему runner.
Что сравнивать: `p50/p95`, failure rate, metric drift, стоимость, quota stability.

### D-20: PDF generation — server-side Chromium route
Решение: PDF генерируется на сервере через `puppeteer-core + @sparticuz/chromium` в `app/api/report/[id]/pdf/route.ts`.
Почему: нужен один канонический export path для Pro/Agency, одинаковый результат на Vercel, и white-label режим для Agency. `window.print()` не подходит как продуктовая фича, а client-side `react-pdf` потребовал бы отдельную PDF-вёрстку.
Последствие: route работает только для авторизованных `pro/agency` пользователей и требует node runtime.

### D-21: Weekly monitoring state хранится в `monitored_domains`
Решение: отдельная таблица `monitored_domains` — single source of truth для weekly monitoring.
Почему: monitoring — это per-domain настройка, а не свойство отдельного scan. Нужно хранить `notify_email`, `last_scan_id`, `last_alerted_at`, активность и baseline вне scan history.
Последствие:
- dashboard управляет monitoring через `POST/DELETE /api/monitor`
- cron берёт только активные monitored domains
- weekly rescan пишет `monitored_domain_id`, `baseline_scan_id`, `trigger='cron'` в `scans`
