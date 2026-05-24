# DECISIONS

> Все архитектурные решения и rejected paths.
> Агент читает перед любым техническим решением — не предлагать отклонённое снова.

---

## Принятые решения

| ID | Решение | Почему |
|----|---------|--------|
| D-01 | Payment provider TBD, не Stripe и не Lemon Squeezy | Stripe требует юр. лицо; Lemon Squeezy не подходит для страны основателя. Провайдер будет выбран позже из доступных вариантов |
| D-02 | @sparticuz/chromium для Lighthouse | Единственный Chrome билд для Vercel serverless (~50MB). Playwright там не работает |
| D-03 | Статичные issue templates + один AI вызов | AI на каждый issue = 25 вызовов = $0.25+/скан. Один вызов для summary — достаточно |
| D-04 | Supabase для PostgreSQL + Auth + Storage | Free tier включает всё. @supabase/ssr хорошо интегрируется с Next.js |
| D-05 | HTML fetчится один раз, передаётся строкой | Несколько fetch = медленнее + риск разных HTML если страница динамическая |
| D-06 | Vercel region fra1 (Frankfurt) | Ближе к СНГ + Европе. US добавляет 100–200ms на каждый fetch |
| D-07 | next-intl без /ru/ /en/ URL сегментов | i18n routing усложняет MVP. Переключатель в navbar — достаточно |
| D-08 | Billing integration должен быть provider-agnostic | Какой бы провайдер ни был выбран, webhook/checkout должен передавать внутренний `user_id`, чтобы обновлять `profiles.plan` |
| D-09 | Lighthouse runner на Railway, фронт на Vercel | Vercel Hobby не подходит для тяжёлого Chromium scan; Railway держит Lighthouse и пишет результат в Supabase |

---

## Rejected paths (не предлагать)

| Отклонено | Причина |
|-----------|---------|
| Stripe | Нет юр. лица для старта |
| Lemon Squeezy | Не подходит для страны основателя |
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

### D-12: Один AI промпт в UI — vibePrompt предпочтительный
Решение: GPT генерирует два варианта в одном вызове — `aiTechnicalPrompt` (Cursor, Windsurf, Claude Code — файловые пути, конкретные теги) и `aiVibePrompt` (Bolt, Lovable, v0, Replit — высокоуровнево). UI показывает **один** блок "Fix everything" с единственным промптом. Логика выбора: `aiVibePrompt` → `aiTechnicalPrompt` (fallback если vibePrompt слабый) → deterministic fallback. Таббар/инструментный селектор не реализован.
Почему: Пересматривает D-03. Один GPT вызов, два поля внутри, но пользователь видит один лучший вариант без необходимости выбирать. Per-issue промпты убраны из UI (используются только для обогащения `cursorPrompt`/`boltPrompt` на issue-уровне внутри).
Реализация: `app/report/[id]/page.tsx` строки 481–485, `lib/ai/generate-evidence-enrichment.ts`.

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

### D-22: Payment provider TBD → заменено D-28
Закрыто. Провайдер выбран — см. D-28 (PayPro Global).

### D-24: api_keys таблица использует key_hash + service role для валидации
Решение: API ключи хранятся как `sha256(rawKey)` в поле `key_hash`. Route handlers, которые валидируют ключ по `key_hash`, используют Supabase **service role client** (bypasses RLS), а не anon/user клиент.
Почему: API caller не имеет Supabase сессии — только Bearer token. RLS на `api_keys` настроена для dashboard UI (пользователь управляет своими ключами через сессию). Но валидация ключа при API-запросе — это server-side операция от имени сервиса, не от имени пользователя.
Последствие: `key_hash` — единственное поле для lookup при API-запросе. Никогда не хранить plain-text ключ. Service role используется только в API route handlers, не в клиентском коде.

### D-25: Accessibility — 6-я категория сканера, a11y-score мигрирует из performance
Решение: добавляем категорию `accessibility` (6-я). Существующий check `a11y-score-low` в `buildPerformanceIssues` переносится в новый `lib/checks/accessibility.ts` под новым ID `low-a11y-score`. TOTAL_CHECKS.performance падает с 6 до 5.
Почему: accessibility — самостоятельная область, не подкатегория performance. Группировка её под performance размывала scoring и делала performance category семантически нечёткой.
Веса после Stage 2: performance 0.22, seo 0.18, security 0.22, mobile 0.10, ai_visibility 0.18, accessibility 0.10 = 1.0.
Последствие: `IssueCategory`, `IssueSource`, `ScanResult`, `getAllIssues()`, `buildScanResult()` и `CATEGORY_WEIGHTS` — все обновляются в рамках Stage 2. Report UI добавляет accessibility card.

### D-23: Lighthouse runner должен использовать официальный config path и облегчённый mobile fallback
Решение: запускать Lighthouse через custom config object по официальной схеме `lighthouse(url, flags, config)`, а не через случайный набор flags/settings. Основной профиль остаётся mobile, но ограничивается нужными категориями (`performance`, `accessibility`), возвращается к коротким wait thresholds (`15s/35s`) и отключает full-page screenshot. При `TARGET_CRASHED` допускается один честный fallback на более лёгкий mobile performance-only профиль с `partial` статусом.
Почему: документация Lighthouse прямо рекомендует config extension для кастомных запусков, предупреждает что очень высокий `max-wait-for-load` ведёт к большим trace и instability, и отдельно даёт флаг `disable-full-page-screenshot` как способ убрать тяжёлый артефакт. Наш предыдущий запуск делал обратное: держал `maxWaitForLoad=120s`, тащил лишние категории и собирал тяжёлые артефакты, повышая шанс `TARGET_CRASHED`.
Последствие: mobile audit остаётся правдивым и продуктово полезным, но не тратит ресурсы на ненужный SEO score внутри Lighthouse. При деградации пользователь получает partial measurement с предупреждением, а не silent pass и не полностью пустой результат.

### D-26: Agency multi-domain dashboard UI отложен до Phase 17
Решение: не реализовывать multi-domain dashboard UI (Stage 5.1 из спека) в рамках Scanner Expansion. Инфраструктура (`monitored_domains` с `last_scan_id`, `last_alerted_at`) уже есть; нужна только UI для domain cards с trend badge и plan-limit enforcement.
Почему: dashboard UI сложнее, чем team seats + bulk scan API. Billing ещё не активирован, поэтому Agency-клиентов пока нет. Добавление UI без реальных пользователей — преждевременно.
Последствие: Phase 17 содержит Agency Integrations (GitHub Action, Vercel hook, Slack/Discord alerts) + multi-domain dashboard UI. Всё Agency-tier — в одной итерации после подтверждения первых agency-клиентов.

### D-27: team_members — design owner-centric, accept через API key
Решение: таблица `team_members` с полями `owner_user_id`, `member_user_id`, `invite_token`, `invited_email`. "Команда" — это аккаунт Agency-владельца, без отдельного `teams` table. Accept через `POST /api/v1/teams/accept` с Bearer API-ключом приглашённого + токеном из письма.
Почему: отдельная `teams` таблица нужна только при multi-owner setup. Для Agency (один владелец, до 5 мест) owner-centric model проще и не создаёт лишних join'ов. Приглашённые — разработчики с API-ключами, поэтому token+API-key accept достаточен для MVP.
Последствие: team access check в `/api/v1/scan/:id` и `/api/v1/scan/:id/issues` смотрит в `team_members` по `owner_user_id` = scan owner и `member_user_id` = requester. Максимум 5 мест на Agency аккаунт проверяется при invite, не через DB constraint.

### D-28: PayPro Global выбран как payment provider (Merchant of Record)
Решение: PayPro Global — платёжный провайдер для Pro Monthly ($14/mo) и Pro Yearly ($140/yr). Agency план — только manual/контакт, без PayPro checkout в v1. Интеграция через hosted checkout + IPN webhook.
Почему: Stripe требует юр. лицо, Lemon Squeezy не подходит для страны основателя. PayPro Global работает как MoR для Беларуси.
Ключевые архитектурные решения:
- PayPro webhook пишет только в `subscriptions` и `payment_events`. Никогда не трогает `beta_access_grants`, `profiles` или другие таблицы.
- Effective plan вычисляется в момент чтения через `getEffectivePlanForUserId()` с приоритетом: paid sub > beta grant > profiles.plan.
- Идемпотентность через `INSERT ON CONFLICT (provider, external_event_id, event_type) DO NOTHING`.
- SHA256 SIGNATURE verification (без разделителя между полями). MD5 HASH fallback только в test mode.
- Sandbox через `PAYPRO_SANDBOX=true` + `secret-key` параметр в checkout URL.
Отклонено: хранение плана в `profiles.plan` при каждом webhook'е — нарушает независимость billing/beta систем.

### D-29: ScanGoal — заменить маркетинговые цели на технические режимы
Решение: `ScanGoal` тип заменён с `'sales' | 'leads' | 'traffic' | 'visibility' | 'general'` на `'seo' | 'security' | 'ai_visibility' | 'full'`.
Почему: старые значения отражали маркетинговый outcome пользователя, а не технический режим сканера. Новые значения соответствуют трём landing page (`/seo`, `/security`, `/ai-visibility`) и позволяют строить mode-aware прогресс и report ordering. `'full'` заменяет `'general'` как дефолт.
Маппинг: `traffic → seo`, `visibility → ai_visibility`, `sales/leads/general → full`.
Следствие: scan progress labels теперь mode-aware через `buildScanStages(scanGoal?)`. Enrichment prompt приоритизирует issues по выбранному режиму. ScanForm показывает 4 цели вместо 5.
