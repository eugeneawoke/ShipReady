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

## Фаза 6 — Монетизация (активная)

- [x] `lib/auth.ts` — `getUserWithPlan()`
- [x] `app/auth/callback/` — OAuth callback
- [x] `app/auth/login/` — страница входа
- [x] `app/pricing/page.tsx` — три карточки
- [ ] Rate limiting: 3 скана/мес для free (по IP + user_id)
- [ ] Создать продукты в Lemon Squeezy: Pro $14, Agency $39
- [ ] `app/api/webhooks/ls/route.ts` — subscription_created → plan='pro'
- [ ] IssueCard paywall — блюрить cursorPrompt/boltPrompt для free
- [ ] Тест: купить план тестовой картой → промпты разблокировались

---

## Фаза 7 — Запуск

- [ ] Self-audit: scan shipready.app → исправить все Critical/High
- [ ] `app/api/badge/[domain]/route.ts` — SVG badge со score
- [ ] Vercel Cron: weekly rescan для Pro/Agency
- [ ] Twitter/X thread + Product Hunt + vc.ru + Show HN
