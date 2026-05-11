# Referral, Free Pro Beta, and Growth Analytics Design

Дата: 2026-05-10
Статус: draft
Контекст: ShipReady находится в private beta readiness. Платный запуск еще не включен, payment provider не выбран, а Pro/Agency доступ уже может выдаваться вручную через Supabase `profiles.plan`.

## Цель

Нужно запустить бесплатное распространение ShipReady так, чтобы:

- привлекать максимум релевантных пользователей до paid launch;
- понимать, откуда пришел каждый пользователь;
- выдавать временный Pro-доступ по кампаниям, реферальным ссылкам и invite-кодам;
- видеть продуктовую аналитику в одном внутреннем дашборде;
- не ломать будущий billing и не смешивать маркетинговую beta-механику с настоящими paid-подписками.

Ключевой принцип: бесплатная раздача должна быть оформлена как `Beta Pro Pass`, а не как бесконечный бесплатный Pro для всех. Иначе потом будет сложно конвертировать пользователей в оплату без ощущения, что у них что-то отобрали.

## Product Offer

Основной оффер для роста:

> Get a free Beta Pro Pass for ShipReady: unlimited scans, AI fix prompts, PDF export, and weekly monitoring while we harden the product before paid launch.

Русская версия:

> Бесплатный Beta Pro-доступ к ShipReady: неограниченные сканы, AI fix prompts, PDF и weekly monitoring, пока мы доводим продукт до публичного paid launch.

Ограничение должно быть явным:

- `30 days` для обычных кампаний;
- `60-90 days` для людей и групп, которых мы специально привлекаем как будущих партнеров, микро-комьюнити или первых амбассадоров;
- `lifetime beta` только вручную для очень ценных пользователей или активных промоутеров, которые уже доказали пользу: привели аудиторию, дали сильный фидбек, сделали кейс или стали каналом распространения.

Рекомендуемое позиционирование: не "все бесплатно навсегда", а "ранний доступ за фидбек и распространение".

Важно: партнеры, комьюнити и амбассадоры не считаются уже существующими активами. Их нужно создавать через outreach: находить создателей no-code/AI/dev сообществ, владельцев Telegram/Discord/LinkedIn-групп, микро-инфлюенсеров, agency founders и активных пользователей, давать им расширенный Beta Pro Pass и просить конкретное действие: пост, teardown, intro, кейс, фидбек или referral link.

## Growth Funnel

Целевой флоу:

1. Пользователь приходит по ссылке с UTM, referral code или promo code.
2. Landing сохраняет attribution в cookie и отправляет серверное событие `visit`.
3. Пользователь запускает scan или регистрируется.
4. При signup система связывает пользователя с first-touch и last-touch attribution.
5. Если кампания дает доступ, создается `beta_access_grant`.
6. Entitlement resolver считает пользователя Pro до `expires_at`.
7. Dashboard, report и API используют единый resolver, а не читают только `profiles.plan`.
8. Внутренний `/admin/growth` показывает каналы, когорты, активацию, конверсию в scans и будущую конверсию в оплату.

## Attribution Parameters

Поддерживаемые параметры:

- `utm_source`: platform or channel, например `reddit`, `producthunt`, `x`, `linkedin`, `telegram`, `direct_outreach`.
- `utm_medium`: `community`, `social`, `referral`, `directory`, `partner`, `email`, `organic`.
- `utm_campaign`: кампания, например `beta_pro_may_2026`.
- `utm_content`: пост, креатив, автор или placement.
- `utm_term`: опционально для search/SEO.
- `ref`: referral code пользователя или партнера.
- `promo`: campaign invite code, например `BUILDERS90`.

Cookie:

- `sr_aid`: anonymous visitor id, 180 дней.
- `sr_attr`: compressed/signed attribution payload, 30 дней.

First-touch attribution не перезаписывается после первого визита. Last-touch обновляется при каждом новом валидном UTM/ref/promo.

## Data Model

Минимальная новая схема:

```sql
create table growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  default_plan text check (default_plan in ('free', 'pro', 'agency')) default 'pro',
  grant_days integer not null default 30,
  max_grants integer,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  grant_days integer,
  max_uses integer,
  uses_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table growth_visits (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  referral_code_id uuid references referral_codes(id) on delete set null,
  landing_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referral_code text,
  promo_code text,
  user_agent text,
  ip_hash text,
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table beta_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  referral_code_id uuid references referral_codes(id) on delete set null,
  granted_plan text not null check (granted_plan in ('pro', 'agency')),
  grant_reason text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table growth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  visit_id uuid references growth_visits(id) on delete set null,
  campaign_id uuid references growth_campaigns(id) on delete set null,
  referral_code_id uuid references referral_codes(id) on delete set null,
  event_name text not null,
  event_properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

`profiles` should get marketing fields:

```sql
alter table profiles
  add column if not exists first_utm_source text,
  add column if not exists first_utm_medium text,
  add column if not exists first_utm_campaign text,
  add column if not exists first_referral_code text,
  add column if not exists first_promo_code text,
  add column if not exists last_utm_source text,
  add column if not exists last_utm_medium text,
  add column if not exists last_utm_campaign text,
  add column if not exists last_referral_code text,
  add column if not exists last_promo_code text,
  add column if not exists plan_source text default 'manual',
  add column if not exists plan_expires_at timestamptz;
```

MVP can temporarily set `profiles.plan = 'pro'` when a valid beta grant is created. The cleaner target state is a single `getEffectivePlan(userId)` resolver that returns `agency > paid pro > active beta pro > free`.

## Referral Mechanics

Referral links:

```text
https://shipready.app/?ref={code}&utm_source=referral&utm_medium=user&utm_campaign=beta_pro
```

Recommended reward model for beta:

- invited user gets `30 days Pro`;
- referrer gets `+14 days Pro` when invited user completes first scan;
- referrer gets `+30 days Pro` when invited user completes three scans or enables monitoring;
- manual bonus for creators, LinkedIn posters, community owners, agency founders, or early users that bring qualified users.

Do not reward only signups. Reward activation. Otherwise the program will optimize for low-quality accounts.

Referral fraud controls:

- do not count self-referrals by same user id;
- hash IP for abuse checks, but do not store raw IP for marketing analytics unless necessary;
- only award referrer bonus after first completed scan;
- cap bonuses per code until manually reviewed;
- show referrer performance in admin before automating large rewards.

## Admin Dashboard

Create `/admin/growth`, protected by an explicit admin allowlist:

- `admin_users` table, or
- `ADMIN_EMAILS` env for MVP.

Do not expose this through normal dashboard navigation.

Dashboard sections:

- `Overview`: visitors, signups, activated users, completed scans, active beta grants.
- `Channels`: metrics by `utm_source`, `utm_medium`, `utm_campaign`.
- `Campaigns`: grant count, activation rate, scans/user, scan completion rate.
- `Referrals`: code owner, invited users, activated users, bonus days earned.
- `Activation`: signup to first scan, first scan to dashboard return, monitoring enabled, PDF exported.
- `Retention`: day 1 / day 7 / day 30 return and repeat scan.
- `Quality`: scan errors by phase, p50/p95 scan duration, failed scans by campaign.
- `Conversion readiness`: users with 3+ scans, users with monitoring enabled, users who exported PDF, users who returned after 7 days.

Primary metrics:

- visitor to signup conversion;
- signup to first completed scan;
- first completed scan to second scan;
- scans per activated user;
- Pro feature usage: PDF, AI prompt copy, monitoring toggle;
- channel-level activation rate;
- referral K-factor: invites sent, accepted, activated;
- future paid conversion by original campaign.

## Platform Decision

Use existing platforms, but with clear boundaries:

- Supabase: source of truth for attribution, grants, referrals, user cohorts, product events.
- Vercel Web Analytics: page traffic, referrers, top routes, lightweight custom events if plan allows it.
- Railway: scanner health, logs, CPU/memory, runtime errors.
- Vercel Observability/logs: route errors and app runtime health.
- Custom `/admin/growth`: product and business dashboard. This is necessary because Vercel/Railway observability will not answer "which campaign brought users who completed scans and used Pro features?"

Do not start with a heavy BI stack. If SQL queries become painful, add Metabase, Supaview, Grafana, or another dashboard later. The first version should be in-app because the product-specific joins are simple and sensitive.

## Traffic Channels

Priority 1: high-intent founder/developer channels.

- Product Hunt: launch as "free Beta Pro Pass for builders shipping AI/vibe-coded apps".
- Hacker News `Show HN`: only when the report is reliable and the demo URL/report is strong.
- Reddit: value-first posts in relevant communities; no link dumping. Use teardown posts, checklists, and "I audited 20 vibe-coded apps, here are the mistakes" formats.
- Indie Hackers: build-in-public posts with real metrics and lessons.
- LinkedIn: founder/build-in-public posts, short teardown carousels, before/after issue screenshots, and direct comments under posts from founders shipping MVPs.
- X/Twitter: short teardown threads with before/after issues from real sites.
- Dev.to, Hashnode, Medium: SEO-friendly technical posts.
- Telegram/Discord/Slack founder and no-code communities: offer free audit threads.

Priority 2: direct outreach.

- Find public Lovable/Bolt/v0/Replit projects and send a free ShipReady report.
- DM indie founders with a short, specific issue from their site, not a generic pitch.
- Create first partner relationships with small agencies, no-code makers, launch consultants, and LinkedIn creators who work with founders shipping landing pages and MVPs.
- Offer "free pre-launch QA report" to startup directories and makers preparing launches.
- Build the first ambassador list manually from users who complete multiple scans, share reports, give useful feedback, or bring at least one activated referral.

Priority 3: owned SEO and tools.

- Publish pages targeting `free website launch checklist`, `pre launch website audit`, `AI visibility checker`, `vibe coded app audit`, `landing page SEO audit`.
- Create public sample reports for popular categories.
- Add shareable report badges only after privacy and opt-in behavior is clear.
- Build one free mini-tool if needed: `AI visibility checker` or `launch readiness checklist`, powered by the same scan engine.

## Messaging

Core pain:

- AI-built apps often look finished but silently fail SEO, performance, security headers, mobile basics, social preview, and AI visibility.
- Founders do not need a huge audit agency before launch; they need a fast, honest pre-deploy quality gate.

Why ShipReady:

- evidence-backed report, not generic AI advice;
- verified / likely / heuristic confidence model;
- actionable fix prompts for coding agents;
- PDF reports and monitoring for repeat work;
- built for builders and small agencies shipping fast.

CTA:

> Run a free scan. If you join during beta, use code `{CODE}` for free Pro access.

## Launch Plan

Phase 0: manual beta tracking, 1-2 days.

- Create a few campaign slugs manually in a spreadsheet or Supabase table.
- Use UTM links immediately.
- Manually upgrade good users to `profiles.plan = 'pro'`.
- Track source, signup, and first scan manually if needed.

Phase 1: attribution and beta grants, 3-5 days.

- Add growth tables and RLS.
- Add UTM/ref/promo capture on landing.
- Bind attribution on signup and auth callback.
- Add `beta_access_grants`.
- Add effective plan resolver.
- Show "Beta Pro active until ..." in dashboard.

Phase 2: admin growth dashboard, 2-4 days.

- Add `/admin/growth`.
- Add overview, campaigns, referrals, activation, and scan health.
- Add CSV export for users/campaigns.
- Add manual grant/revoke actions.

Phase 3: referral loop, 3-5 days.

- Generate referral code for each activated user.
- Add referral card in dashboard.
- Award referrer bonus only after invited user's first completed scan.
- Add abuse caps and admin review list.

Phase 4: public growth push, ongoing.

- Launch 3-5 campaigns with separate UTM links.
- Publish teardown content weekly.
- Run direct outreach daily.
- Seed LinkedIn weekly with one founder story, one teardown, and one practical checklist post.
- Launch Product Hunt only after report quality and landing copy are stable.
- Prepare paid transition messaging once retention and activation are visible.

## Definition of Done

- A visitor can arrive through UTM/ref/promo and attribution survives signup.
- A valid campaign can grant temporary Pro access.
- Pro access can expire without manual cleanup.
- Admin can see campaign, referral, activation, scan, and Pro-feature metrics.
- Every growth campaign has a measurable activation rate, not just signup count.
- Paid launch can later distinguish paid subscription from beta grant.

## References

- Supabase Auth Hooks can track signup origin and add metadata: https://supabase.com/docs/guides/auth/auth-hooks
- Supabase RLS should protect exposed tables: https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security
- Supabase Reports cover database observability, not product growth analytics: https://supabase.com/docs/guides/telemetry/reports
- Vercel Web Analytics supports custom events on Pro/Enterprise: https://vercel.com/docs/analytics/custom-events
- Railway provides service metrics and logs for scanner observability: https://docs.railway.com/observability/metrics
- Product Hunt Launch Guide: https://www.producthunt.com/launch/
- Hacker News Show page: https://news.ycombinator.com/show
- Reddit spam guidance notes self-promotion can be treated as spam and many communities use a 10% rule: https://support.reddithelp.com/hc/en-us/articles/28012014962580-How-do-I-keep-spam-out-of-my-community
