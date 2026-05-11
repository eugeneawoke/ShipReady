# Growth Campaign Launch Playbook

Дата: 2026-05-10
Статус: operational draft
Кампания по умолчанию: `beta_pro_may_2026`
Базовая ссылка: `https://shipready.app/`

Цель: запустить Beta Pro распространение так, чтобы каждый канал имел отдельную UTM-ссылку, понятный CTA, антиспам-правила и первый показатель в `/admin/growth`, который нужно смотреть ежедневно.

## 0. Setup перед запуском

1. Применить миграцию `supabase/migrations/014_growth_referrals.sql` в Supabase для текущего проекта.
2. В production env добавить `ADMIN_EMAILS=founder@example.com,ops@example.com` и задеплоить. Без этого `/admin/growth` вернет `404` даже для залогиненного пользователя.
3. Проверить env для Supabase service role на сервере. `/admin/growth` и growth capture должны иметь доступ к таблицам `growth_campaigns`, `growth_visits`, `growth_events`, `referral_codes`, `beta_access_grants`.
4. Создать кампании в Supabase. В реализации поле называется `code`, не `slug`; использовать lowercase safe values.

```sql
insert into growth_campaigns
  (code, name, description, utm_source, utm_medium, utm_campaign, default_plan, grant_days, max_grants, is_active)
values
  ('beta_pro_may_2026', 'Beta Pro May 2026', 'Default cross-channel beta campaign', null, null, 'beta_pro_may_2026', 'pro', 30, null, true),
  ('builders90', 'Builders 90 Day Beta', 'Extended pass for partners, agencies, and community owners', null, 'partner', 'beta_pro_may_2026', 'pro', 90, 250, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  grant_days = excluded.grant_days,
  max_grants = excluded.max_grants,
  is_active = excluded.is_active;
```

5. Promo codes работают через `promo={growth_campaigns.code}`. Для обычных каналов использовать `promo=beta_pro_may_2026`; для партнеров и комьюнити - `promo=builders90`.
6. Реферальные коды создавать только для конкретных пользователей/партнеров после ручного отбора. `owner_user_id` обязателен.

```sql
insert into referral_codes
  (code, owner_user_id, campaign_id, grant_days, max_uses, is_active)
select
  'partner_acme',
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  90,
  50,
  true
from growth_campaigns
where code = 'builders90'
on conflict (code) do nothing;
```

7. Перед публикацией открыть `/admin/growth` под email из `ADMIN_EMAILS` и убедиться, что видны блоки Overview, Channels, Campaigns, Referrals, Activation.

## 1. Каналы и ссылки

Все ссылки должны содержать `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`. `promo` или `ref` добавлять только когда это реально дает Beta Pro grant или партнерский трекинг.

| Канал | UTM URL template | Что постить | Как не спамить | CTA | Asset | Первый metric в `/admin/growth` |
| --- | --- | --- | --- | --- | --- | --- |
| LinkedIn | `https://shipready.app/?utm_source=linkedin&utm_medium=social&utm_campaign=beta_pro_may_2026&utm_content={post_id}&promo=beta_pro_may_2026` | Founder post: "I audited 20 AI-built launch pages. Here are the repeat failures." Плюс 3-5 конкретных ошибок и скрин отчета. | Не писать одинаковые комменты под чужими постами. Сначала дать полезный teardown, ссылку оставить в конце или в первом комменте. | `Run a free launch-readiness scan. Beta users get Pro for 30 days.` | 1-page carousel или screenshot report before/after. | Visits by `linkedin`, затем completed scans. |
| X/Twitter | `https://shipready.app/?utm_source=x&utm_medium=social&utm_campaign=beta_pro_may_2026&utm_content={thread_slug}&promo=beta_pro_may_2026` | Thread из 6-8 постов: ошибка, почему она ломает launch, как ShipReady это находит. | Не тегать людей без причины, не просить retweets, не дублировать один и тот же thread. | `Reply/DM with your URL or run the scan yourself.` | Short thread, 1 annotated screenshot, pinned reply with link. | Visits by `x`, event `scan_started`. |
| Product Hunt | `https://shipready.app/?utm_source=producthunt&utm_medium=launch&utm_campaign=beta_pro_may_2026&utm_content=launch_day&promo=beta_pro_may_2026` плюс видимый URL без редиректа в listing. | Product page: "ShipReady - pre-launch QA for AI-built websites" с maker comment, demo GIF, sample report, clear beta offer. | Не просить upvotes. Просить "visit, try, comment with feedback". Отвечать на комментарии весь день. | `Try the scan and comment with the one issue we missed.` | PH gallery, 30-45 sec demo GIF/video, maker comment, sample report. | `producthunt` visits, active grants, comments converted to scans. |
| Hacker News Show HN | `https://shipready.app/?utm_source=hackernews&utm_medium=show_hn&utm_campaign=beta_pro_may_2026&utm_content=show_hn_post` без `promo` в основной ссылке; promo дать в комментарии при необходимости. | `Show HN: ShipReady - launch-readiness audits for AI-built sites`. Фокус на том, как работает scanner, confidence model, false positives. | Постить только когда продукт можно попробовать без лишних барьеров. Не просить друзей голосовать или комментировать. Быть готовым обсуждать технические детали. | `Try it on a public URL and tell me where the report is wrong.` | Fast demo URL, public sample report, technical writeup comment. | Spike visits by `hackernews`, scan errors, p95 scan duration. |
| Reddit | `https://shipready.app/?utm_source=reddit&utm_medium=community&utm_campaign=beta_pro_may_2026&utm_content={subreddit}_{post_slug}&promo=beta_pro_may_2026` | Value-first posts: checklist, teardown of anonymized examples, "I will audit 5 landing pages in comments". | Читать правила subreddit. Не постить tracking/ref links там, где они запрещены. Держать self-promo ниже 10% активности, отвечать в комментариях без sales pitch. | `Drop your URL for a public teardown, or use the beta link if self-audit is easier.` | Text post, checklist, anonymized screenshots, no link until context is accepted. | Visits by subreddit in `utm_content`, activation rate. |
| Indie Hackers | `https://shipready.app/?utm_source=indiehackers&utm_medium=community&utm_campaign=beta_pro_may_2026&utm_content={post_slug}&promo=beta_pro_may_2026` | Build-in-public update: metrics, what broke in first scans, what founders learned before launch. | Не делать "launch announcement only". Просить обратную связь и делиться цифрами. | `I can run 10 free teardown scans for makers launching this month.` | Short case study with real metrics and screenshots. | Signups and first completed scan by `indiehackers`. |
| Dev.to / Hashnode / Medium | `https://shipready.app/?utm_source={devto|hashnode|medium}&utm_medium=content&utm_campaign=beta_pro_may_2026&utm_content={article_slug}&promo=beta_pro_may_2026` | Technical article: "Pre-launch checklist for AI-generated apps" with examples from SEO, performance, headers, social previews, AI visibility. | Publish useful standalone content. Add canonical links correctly. Avoid thin reposts with only a product CTA. | `Run the checklist automatically on your site.` | Long-form article, code/checklist snippets, sample report. | Organic/content visits, signup to scan conversion. |
| Telegram / Discord / Slack communities | `https://shipready.app/?utm_source={telegram|discord|slack}&utm_medium=community&utm_campaign=beta_pro_may_2026&utm_content={community_name}&promo=builders90` | Ask admin/mod first: offer a free audit thread for builders launching this week. | Не DM-ить участников массово. Соблюдать правила канала. Давать ценность в треде, ссылку после разрешения. | `Post your URL in thread; I will return a ShipReady report.` | Short moderator DM, audit thread template, 3 sample reports. | Visits by community, active grants, scans/user. |
| Direct outreach | `https://shipready.app/?utm_source=direct_outreach&utm_medium=email&utm_campaign=beta_pro_may_2026&utm_content={segment}_{batch}&promo=builders90` | 1:1 email/DM to public Lovable/Bolt/v0/Replit projects: one specific issue found manually or via report. | Не отправлять bulk generic pitch. Один человек - один конкретный reason. Stop after one follow-up. | `I made a free pre-launch report for your site. Want the link?` | Personalized mini-report, screenshot, 3-line email. | Replies, visits by batch, first scan completion. |
| Startup directories | `https://shipready.app/?utm_source={betalist|uneed|startupstash|launchingnext}&utm_medium=directory&utm_campaign=beta_pro_may_2026&utm_content={listing_id}&promo=beta_pro_may_2026` | Listing focused on "free pre-launch QA for makers before public launch". | Не сабмитить незаконченный landing. Не использовать fake reviews. Обновлять listing при major iteration. | `Check whether your launch page is ready before submitting to directories.` | Directory copy, logo, 3 screenshots, sample report. | Directory visits, visitor to signup. |
| Agencies / no-code makers / launch consultants | `https://shipready.app/?utm_source=partner&utm_medium=partner&utm_campaign=beta_pro_may_2026&utm_content={partner_code}&ref={partner_ref}` | Partner offer: free 90-day Beta Pro for their clients and co-branded teardown session. | Не обещать revenue share до paid launch. Дать ясный benefit: faster QA, reusable reports, client trust. | `Use this referral link for client pre-launch audits.` | Partner one-pager, demo report, referral code. | Grants by referral, activated users per partner. |
| Owned SEO/tools | `https://shipready.app/?utm_source=owned&utm_medium=organic&utm_campaign=beta_pro_may_2026&utm_content={page_or_tool_slug}&promo=beta_pro_may_2026` | SEO pages and mini-tools: `AI visibility checker`, `launch readiness checklist`, sample reports. | Не создавать doorway pages. Каждая страница должна решать один search intent и показывать пример результата. | `Run the full ShipReady scan after this quick check.` | SEO page, free mini-tool, sample report, internal links. | Organic visits, scan_started, PDF export intent. |

## 2. 14-дневный launch schedule

| День | Действия | Контроль |
| --- | --- | --- |
| 1 | Применить migration, выставить `ADMIN_EMAILS`, создать `beta_pro_may_2026` и `builders90`, проверить `/admin/growth`. | В Overview нет ошибок, Campaigns показывает новые rows. |
| 2 | Подготовить assets: 3 sample reports, 1 carousel, 1 demo GIF, 1 technical article draft, 3 outreach templates. | Все ссылки с UTM открываются и создают visit после захода. |
| 3 | Soft launch: LinkedIn founder post и X thread. | Смотреть `linkedin`, `x`, `scan_started`, completed scans. |
| 4 | Direct outreach batch 1: 20 персональных сообщений по public AI-built projects. | Replies, visits by `direct_outreach`, first scan completion. |
| 5 | Reddit/communities: 2 value-first posts или audit threads после проверки правил. | Удаления/модерация, visits by `utm_content`, activation rate. |
| 6 | Dev.to/Hashnode/Medium article с canonical strategy и ShipReady CTA. | Content visits и signup to scan. |
| 7 | Review day: сравнить каналы, отключить слабые generic CTAs, усилить лучший asset. | Channel activation, scan errors, p95 scan duration. |
| 8 | Indie Hackers build-in-public update с реальными цифрами первой недели. | Comments, visits, completed scans. |
| 9 | Telegram/Discord/Slack: 3 moderator asks, 1 audit thread при разрешении. | Grants by `builders90`, scans/user. |
| 10 | Partner outreach: agencies/no-code makers/launch consultants, 10 персональных pitches. | Referral grants, activated users per partner. |
| 11 | Startup directories: submit/update 3-5 listings. | Directory visits and visitor to signup. |
| 12 | Product Hunt prep: gallery, maker comment, first comment, launch supporters list без просьбы upvote. | PH assets ready, no broken links. |
| 13 | Product Hunt launch or final rehearsal if product/report quality is not stable. | `producthunt` visits, grants, comments to scans. |
| 14 | HN Show HN only if demo is fast, useful without heavy signup, and founder can answer comments. Otherwise publish technical post elsewhere. | `hackernews` spike, scan health, qualitative feedback. |

## 3. Daily metrics checklist in `/admin/growth`

Каждый день фиксировать цифры в одной строке launch log.

- Overview: total visits, growth events, active beta grants, completed scans.
- Channels: visits by `utm_source`, top `utm_campaign`, share of traffic by channel.
- Campaigns: grant count for `beta_pro_may_2026` and `builders90`, exhausted `max_grants`, inactive campaigns.
- Referrals: `uses_count`, activated users, exhausted or expired codes.
- Activation: first completed scan, second completed scan, PDF export intent, monitoring enabled.
- Quality: if traffic spike came from PH/HN/Reddit, check scanner errors and p95 scan duration before posting more.
- Decision: keep, pause, or change each source based on activation, not visits.

Минимальные thresholds для продолжения канала:

- `visitor -> signup` ниже 3%: CTA/landing mismatch, переписать пост или ссылку.
- `signup -> first completed scan` ниже 30%: проверить onboarding, scan failures, ожидания из поста.
- Много visits и мало grants: promo/ref не применяется или ссылка сломана.
- Много scans и мало second scan/PDF/monitoring: канал дает curiosity, но не рабочий use case.

## 4. Message templates

LinkedIn/X:

```text
I audited 20 AI-built launch pages. The same issues kept showing up: missing social previews, weak SEO basics, slow mobile, broken headers, and AI visibility gaps.

I built ShipReady to catch these before launch. Beta users get Pro access while we harden the scanner.

Run a free scan: {utm_link}
```

Reddit/community:

```text
I'm testing a pre-launch audit workflow for AI-built sites. If you are comfortable sharing a public URL, drop it here and I will return the top 3 launch blockers. No DM needed.

If self-serve is easier, this beta link runs the same scan: {utm_link}
```

Direct outreach:

```text
Subject: quick pre-launch issue on {site}

I noticed {specific_issue}. It can hurt {launch_outcome}.

I am building ShipReady, a pre-launch QA scanner for AI-built sites. I can send you the free report I generated, or you can run it here: {utm_link}
```

Partner:

```text
You help founders ship fast. ShipReady can be your pre-launch QA pass: SEO basics, mobile/performance, security headers, social previews, AI visibility, PDF reports.

I can give you a 90-day Beta Pro referral link for client audits: {ref_link}
```

## 5. Anti-spam rules

- Не публиковать одну и ту же ссылку в нескольких местах без адаптации под аудиторию.
- Не использовать `ref` в публичных местах, где referral/tracking links запрещены. Для Reddit/HN лучше чистая UTM или ссылка без promo, а grant дать в комментарии по запросу.
- Не просить upvotes на Product Hunt или HN. Просить feedback, comments, bug reports.
- Не делать массовые DMs в Telegram/Discord/Slack/Reddit.
- Не считать signup успехом. Основной успех: completed scan, second scan, PDF export, monitoring enabled.

## References

- Product Hunt Launch Guide: https://www.producthunt.com/launch
- Hacker News Show HN Guidelines: https://news.ycombinator.com/showhn.html
- Hacker News Guidelines: https://news.ycombinator.com/newsguidelines.html
- Reddit spam guidance: https://support.reddithelp.com/hc/en-us/articles/28012014962580-How-do-I-keep-spam-out-of-my-community
- DEV getting started and posting guidance: https://dev.to/help/getting-started
