# First-User Launch Plan

Дата: 2026-04-08
Статус: active
Цель: запустить ShipReady для первых пользователей как можно раньше, не жертвуя доверием к отчёту и не блокируя дальнейшую разработку.

## Recommendation

Самый быстрый и здравый путь:

1. сначала довести продукт до **private beta readiness**
2. запустить первых пользователей вручную или по invite
3. продолжить продуктовую и quality-итерацию уже на живой обратной связи
4. только потом включать полноценный публичный paid launch

Это быстрее, чем ждать, пока одновременно будут идеальны и truthful audit, и billing, и agency-фичи, и integrations.

## Priority 0 — Private Beta Launch

Это минимальный набор, после которого можно безопасно пустить первых реальных пользователей.

### 0.1 Truth and stability

- довести `roadmap` и product copy до честного состояния
- закрыть оставшиеся high-risk false positives / false negatives в scan engine
- убедиться, что failed measurement всегда рендерится как `Could not verify`, а не как pass
- проверить все ключевые user flows:
  - scan → report
  - auth → dashboard
  - share
  - PDF export
  - weekly monitoring toggle

### 0.2 Production readiness

- подключить кастомный production domain
- настроить verified sender domain для Resend или временно не включать email alerts в beta
- проверить все production env для Vercel и Railway
- поставить базовую observability:
  - runtime logs
  - scan failures by phase
  - monitoring cron visibility

### 0.3 First-user UX

- привести onboarding к понятному состоянию:
  - что именно проверяет scan
  - что означают score / unavailable / verified / likely / heuristic
- отполировать empty/error states
- добавить понятный feedback path:
  - email
  - dashboard CTA
  - roadmap / feature request path

## Priority 1 — Public Paid Launch

Это уже не блокирует private beta, но блокирует нормальный публичный запуск.

### 1.1 Billing activation

- создать реальные продукты в Lemon Squeezy
- настроить checkout URLs
- проверить webhook и обновление `profiles.plan`
- вручную прогнать покупку тестовой картой
- убедиться, что paywalled features реально открываются после оплаты

### 1.2 Paid feature completeness

- проверить monitoring end-to-end на production domain
- включить и протестировать email alerts после настройки sender domain
- довести AI fix prompts до стабильного результата на новых scans
- проверить Agency white-label PDF path

### 1.3 Launch messaging

- синхронизировать pricing, landing, roadmap, README и legal copy
- подготовить публичную формулировку:
  - что умеет core report
  - что уже есть в paid plans
  - что пока intentionally not shipped

## Priority 2 — Retention and Product Learning

Это нужно сразу после появления первых пользователей.

- сохранить и регулярно разбирать feedback от первых пользователей
- отслеживать:
  - какие checks чаще всего вызывают недоверие
  - какие issues люди реально пытаются чинить
  - где пользователи отваливаются
- довести top 5 самых важных report improvements по реальному usage
- собрать реальные `p50/p95/p99` scan timings и error rate

## Priority 3 — Agency / Team Expansion

Это не должно тормозить запуск для первых пользователей.

- multi-domain dashboard management
- team seats
- priority support workflow
- API access
- bulk scan scheduling

## Priority 4 — Ecosystem and Advanced Depth

Это можно делать после того, как есть usage, retention и оплата.

- GitHub Action
- Slack / Discord notifications
- Vercel deploy hooks
- accessibility expansion
- cookie / privacy checks
- multi-page crawl
- performance regression tracking

## Execution Order

1. привести публичный roadmap и docs к правде
2. закрыть remaining launch-blocking quality gaps
3. подключить custom domain + production observability
4. запустить private beta
5. активировать billing и paid funnel
6. продолжить улучшения по живому feedback

## Definition of Ready for First Users

ShipReady готов к первым пользователям, когда:

- report не врёт о том, что было или не было измерено
- scan, report, dashboard, PDF и monitoring проходят без критических сбоев
- у команды есть понятный способ увидеть prod errors и ответить пользователю
- product copy не обещает того, чего пользователь не получит
- есть способ принять feedback и быстро доставить fixes
