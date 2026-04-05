# TODO

> Формат: `[ ]` ожидает · `[~]` в процессе · `[x]` готово · `[!]` заблокировано
> Обновлять статусы по ходу работы. Завершённые шаги не удалять.

---

## Фаза 0 — Подготовка (активная)

- [ ] Зарегистрировать домен shipready.app (Namecheap или Cloudflare Registrar, ~$12)
- [x] Создать GitHub репозиторий `shipready`
- [ ] Подключить Vercel к репозиторию (Hobby plan, автодеплой из main)
- [ ] Создать проект Supabase, регион Frankfurt (fra1)
- [ ] Добавить env variables в Vercel: APP_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, LS_API_KEY, LS_WEBHOOK_SECRET, RESEND_API_KEY
- [ ] Создать `.env.local` локально, проверить что в `.gitignore`
- [ ] `npx create-next-app@latest shipready --typescript --tailwind --app`
- [ ] Первый деплой — пустая страница на кастомном домене
- [ ] Создать Figma файл: Cover / Components / Report / Landing / Auth

---

## Фаза 1 — Скелет

- [ ] Установить зависимости (см. CHECKS.md — Installation)
- [ ] `npx shadcn-ui@latest init` + добавить компоненты: button card badge progress tabs input
- [ ] Создать `types/scan.ts` — полные типы из CLAUDE.md
- [ ] Настроить Tailwind — цвета и шрифты из DESIGN.md
- [ ] Установить Geist: `npm i geist`, подключить в layout.tsx
- [ ] Создать `lib/supabase.ts` (server client через @supabase/ssr)
- [ ] Создать `supabase/migrations/001_initial.sql` — схема из CLAUDE.md
- [ ] Создать `vercel.json` — maxDuration:60, memory:3009, region:fra1
- [ ] Создать `app/globals.css` — CSS переменные из DESIGN.md
- [ ] `app/api/scan/route.ts` — POST: валидация URL → Supabase insert → return {id}
- [ ] `app/api/scan/[id]/route.ts` — GET: вернуть {status, results}
- [ ] `app/(landing)/page.tsx` — ScanForm, отправляет POST, редирект на /report/[id]
- [ ] `app/report/[id]/page.tsx` — polling каждые 2 сек, skeleton пока loading

---

## Фаза 2 — Core checks

- [ ] `lib/checks/lighthouse.ts` — @sparticuz/chromium + lighthouse
- [ ] Протестировать Lighthouse на Vercel (главный технический риск) → записать в EVIDENCE.md
- [ ] `lib/checks/seo.ts` — 12 SEO/OG checks, cheerio
- [ ] `lib/checks/mobile.ts` — 4 mobile checks
- [ ] `lib/checks/links.ts` — internal links max 20, HEAD requests
- [ ] `lib/checks/index.ts` — оркестратор: fetch HTML один раз → Promise.all
- [ ] `lib/scoring.ts` — алгоритм из CLAUDE.md

---

## Фаза 3 — Security

- [ ] `lib/checks/security.ts` — все 11 checks (см. CHECKS.md)
- [ ] Security issue templates в `lib/ai/issue-templates.ts`
- [ ] Тест: scan сайта с намеренно открытым .env → убедиться что находит

---

## Фаза 4 — AI Engine

- [ ] Все 25 issue templates с cursorPrompt + boltPrompt
- [ ] Тест качества: скопировать 5 prompts в Cursor → проверить что работают
- [ ] `lib/ai/generate-summary.ts` — один вызов Claude, max 300 tokens
- [ ] `lib/scoring.ts` → `buildScanResult()` собирает полный ScanResult

---

## Фаза 5 — Report UI

- [ ] `components/report/ScoreRing.tsx` — SVG анимированное кольцо
- [ ] `components/report/ReportSkeleton.tsx` — loading state
- [ ] `components/report/CategoryCard.tsx` — карточка категории, collapsible
- [ ] `components/report/IssueCard.tsx` — issue + blur paywall + copy prompt
- [ ] `components/report/OGPreview.tsx` — Twitter / Telegram / WhatsApp tabs
- [ ] `app/report/[id]/page.tsx` — обновить с реальными компонентами + stagger анимация
- [ ] Скриншот-тест: показать 3 людям → "это выглядит профессионально?"

---

## Фаза 6 — Монетизация

- [ ] Supabase Auth: Google OAuth + `app/auth/callback/route.ts`
- [ ] `lib/auth.ts` → `getUserWithPlan()` возвращает user + plan
- [ ] Rate limiting в scan API: 3/мес для free (по user_id или IP)
- [ ] Создать продукты в Lemon Squeezy: Pro $14, Agency $39
- [ ] `app/api/webhooks/ls/route.ts` — subscription_created → plan='pro', cancelled → 'free'
- [ ] `app/pricing/page.tsx` — три карточки, Pro выделена border-accent
- [ ] Тест: купить свой план тестовой картой → промпты разблокировались

---

## Фаза 7 — Запуск

- [ ] Лендинг: платформы (Cursor/Bolt/Lovable/v0/Replit), how it works, demo report
- [ ] `app/opengraph-image.tsx` — динамический OG через next/og
- [ ] `app/sitemap.ts`
- [ ] `app/api/badge/[domain]/route.ts` — SVG badge со score
- [ ] Vercel Cron: weekly rescan для Pro/Agency
- [ ] Self-audit: scan shipready.app → исправить все Critical/High
- [ ] Twitter/X thread + Product Hunt + vc.ru + Show HN
