# TODO

> Формат: `[ ]` ожидает · `[~]` в процессе · `[x]` готово · `[!]` заблокировано

---

## Фаза 0 — Подготовка (часть не сделана)

- [x] Создать GitHub репозиторий
- [x] `npx create-next-app@latest` с TypeScript + Tailwind + App Router
- [ ] Зарегистрировать домен shipready.app
- [ ] Подключить Vercel к репозиторию (автодеплой из main)
- [ ] Создать проект Supabase, регион Frankfurt (fra1)
- [ ] `npx supabase db push` — применить миграции
- [ ] Добавить env variables в Vercel (APP_URL, SUPABASE_*, ANTHROPIC_API_KEY, LS_*, RESEND_API_KEY)
- [ ] Создать `.env.local` локально
- [ ] Первый живой деплой на кастомном домене

---

## Фаза 1–5 — Скелет + Checks + UI

- [x] `types/scan.ts` — полные типы (включая ai_visibility)
- [x] `lib/supabase.ts` — server client
- [x] `supabase/migrations/001_initial.sql` — scans таблица
- [x] `supabase/migrations/002_profiles.sql` — profiles таблица
- [x] `vercel.json` — maxDuration, region
- [x] `app/api/scan/route.ts` — POST создаёт scan
- [x] `app/api/scan/[id]/route.ts` — GET polling
- [x] `app/api/run-scan/` — воркер выполняет checks
- [x] `lib/checks/index.ts` — оркестратор
- [x] `lib/checks/lighthouse.ts`
- [x] `lib/checks/seo.ts`
- [x] `lib/checks/security.ts`
- [x] `lib/checks/mobile.ts`
- [x] `lib/checks/links.ts`
- [x] `lib/checks/ai-visibility.ts` — 8 AEO/GEO checks
- [x] `lib/scoring.ts`
- [x] `lib/ai/generate-summary.ts`
- [x] `lib/ai/issue-templates.ts`
- [x] `components/report/` — все 5 компонентов
- [x] `app/report/[id]/page.tsx`
- [x] `app/(landing)/page.tsx` — лендинг с анимациями
- [x] `app/opengraph-image.tsx`
- [x] `app/sitemap.ts`
- [x] `app/robots.ts`

---

## Фаза 6 — Монетизация (почти готова)

- [x] `lib/auth.ts` — `getUserWithPlan()`
- [x] `app/auth/callback/` — OAuth callback
- [x] `app/auth/login/` — страница входа
- [x] `app/dashboard/page.tsx` — список сканов пользователя
- [x] `components/auth/SignOutButton.tsx` — кнопка выхода
- [x] Nav лендинга — auth state (Dashboard / Sign in)
- [x] `app/pricing/page.tsx` — три карточки
- [x] `app/api/webhooks/ls/route.ts` — subscription_created/cancelled → plan='pro'/'free'
- [ ] Создать продукты в Lemon Squeezy: Pro $14, Agency $39
- [ ] Добавить env: `LEMON_SQUEEZY_WEBHOOK_SECRET`, `LEMON_SQUEEZY_API_KEY`
- [ ] Rate limiting: 3 скана/мес для free (по IP + user_id)
- [ ] Тест: купить план тестовой картой → `profiles.plan = 'pro'` в Supabase

---

## Фаза 8 — Pro Features (следующая)

### 8.1 AI fix prompts — починить и показать

- [ ] Убедиться что `OPENAI_API_KEY` задан в env (локально и в Railway)
- [ ] Проверить что новый скан сохраняет `aiTechnicalPrompt` и `aiVibePrompt` в DB
- [ ] IssueCard — добавить expandable промпт для каждого issue (pro only, blur для free)
  - поле `cursorPrompt` и `boltPrompt` уже есть в типах и issue-templates.ts
  - показывать как коллапсибл "Fix with AI →" внизу каждой карточки
- [ ] Убрать сообщение "AI prompt not available" — заменить на skeleton/spinner если ещё loading

### 8.2 PDF export

- [ ] Решение: puppeteer screenshot → PDF (используем уже установленный puppeteer-core + @sparticuz/chromium)
  - альтернатива: `react-pdf` если нет Railway runner
  - **записать выбор в DECISIONS.md как D-13 перед реализацией**
- [ ] `app/api/report/[id]/pdf/route.ts` — GET → возвращает PDF blob
- [ ] Кнопка "Download PDF" в хедере отчёта — видна только для Pro/Agency
- [ ] PDF включает: score, category scores, все issues с plainEnglish, aiSummary

### 8.3 Weekly monitoring + email alerts

- [ ] Понять концепцию для пользователя:
  - **Monitoring** = система автоматически сканирует сохранённые домены раз в неделю
  - **Email alerts** = если появились новые Critical/High issues или score упал >10 — письмо на email
- [ ] `supabase/migrations/003_monitoring.sql` — таблица `monitored_domains` (user_id, domain, last_scan_id, notify_email)
  - **или** добавить флаг `monitored: boolean` к scans и хранить per-domain
  - **записать выбор в DECISIONS.md как D-14 перед реализацией**
- [ ] UI в Dashboard — toggle "Monitor this domain weekly" (Pro only)
- [ ] `app/api/cron/rescan/route.ts` — dispatch в Railway уже есть, нужно:
  - убедиться что `CRON_SECRET`, `RAILWAY_SCANNER_URL`, `SCANNER_SECRET` заданы в prod
  - привязать rescan не ко всем Pro/Agency users вообще, а к `monitored_domains`
  - после rescan сравнить с предыдущим — если score упал >10 или появились новые critical/high → `sendAlert()`
- [ ] `lib/email/send-alert.ts` — Resend: письмо с diff score, топ-3 новых issue, ссылка на отчёт
  - нужен `RESEND_API_KEY` в env
  - нужен `from:` домен в Resend (shipready.app)
- [ ] Тест: создать monitored domain → запустить cron вручную → письмо пришло

---

## Фаза 9 — Качество отчёта

### 9.1 Информативный summary сверху

- [ ] Заменить текущий summary (2–3 строки) на структурированный блок:
  - Самые важные 3 проблемы (critical + high, с иконками)
  - Что хорошо (если есть strong categories ≥ 85)
  - Quick wins — топ-2 проблемы которые проще всего починить (low/medium severity)
- [ ] `generateAISummary` — добавить поле `keyIssues: string[]` (3 элемента) в JSON ответ
- [ ] UI: карточки "Key Issues" перед category tabs, не после

### 9.2 Информативность issue cards

- [ ] Добавить в каждый IssueCard:
  - Конкретные числа/значения (value поле уже есть — сделать prominent)
  - Ссылку на docs (docsUrl уже есть — убедиться что у всех 41 шаблонов заполнено)
  - "How to fix" в одну строку (уже есть как `plainEnglish` — проверить что тексты хорошие)
- [ ] Пройтись по всем 41 шаблонам в `lib/ai/issue-templates.ts` — убедиться что:
  - `plainEnglish` реально объясняет ПОЧЕМУ это важно для инди-хакера
  - `docsUrl` заполнен везде где возможно
  - `cursorPrompt` конкретен (с именами файлов, не абстрактен)

### 9.3 Визуальная иерархия отчёта

- [ ] Добавить "What's broken vs what's fine" секцию в начале (до category tabs)
  - Визуальный breakdown: сколько critical / high / medium / low / pass
  - Одна строка типа "3 critical, 7 high — needs immediate attention"
- [ ] Category tabs — показывать цветной индикатор (🔴🟡🟢) по score рядом с числом
- [ ] Passed checks — сделать более заметными, сейчас они "спрятаны" под кнопкой

---

## Фаза 7 — Запуск

- [ ] Self-audit: scan shipready.app → исправить все Critical/High
- [ ] `app/api/badge/[domain]/route.ts` — добавить явную публичность badge для auth scans (`share_token` или `is_public`), сейчас route видит только anonymous/public scans
- [ ] Twitter/X thread + Product Hunt + vc.ru + Show HN
