# Plan Sync & Roadmap Design

**Date:** 2026-05-22  
**Goal:** Синхронизировать PLAN.md со всей накопленной документацией проекта. Создать ROADMAP.md как файл-проводник очерёдности. Зафиксировать новые архитектурные решения в DECISIONS.md и MEMORY.md.

---

## Контекст

За последние недели появились планы и исследования, которые не отражены в PLAN.md:
- `docs/superpowers/plans/2026-05-21-product-evolution.md` — 9-фазный план Product Evolution v2
- `docs/feature-plans/checks-deepening-main.md` — 25+ новых проверок (три фазы)
- `docs/shipready-growth-roadmap.md` — SEO-фундамент, free tools, MCP-сервер, case studies
- `docs/plans/2026-05-10-growth-campaign-launch-playbook.md` — Beta Pro distribution
- Анализ конкурентов ChatSEO и Promptwatch — три продуктовых инсайта

PLAN.md сейчас содержит фазы 0–19. Нужно добавить фазы 20–35 и создать файл очерёдности.

---

## Deliverable 1 — Новые фазы в PLAN.md (20–35)

Добавить строки в существующую таблицу фаз. Статусы:
- `💡 спроектировано` — есть детальный план в docs/
- `💡 идея` — концепция есть, детального плана нет
- `💡 Coming Soon` — заявлено, зависит от внешних факторов

| # | Название | Источник-план | Статус |
|---|---------|--------------|--------|
| 20 | Product Evolution v2 | 2026-05-21-product-evolution.md | 💡 спроектировано |
| 21 | IntentLead Integration | product-evolution Task 9.1 | 💡 Coming Soon |
| 22 | Growth Bundle | product-evolution Task 9.1 | 💡 Coming Soon |
| 23 | REST API v1 публичный | product-evolution Task 9.1 | 💡 Coming Soon |
| 24 | GSC + Яндекс Вебмастер | product-evolution Task 9.4 | 💡 Coming Soon |
| 25 | Analytics Integration | product-evolution Task 9.4 | 💡 Coming Soon |
| 26 | Rank Tracking | product-evolution Task 9.4 | 💡 Coming Soon |
| 27 | Competitor Analysis | product-evolution Task 9.4 | 💡 Coming Soon |
| 28 | Checks Deepening | checks-deepening-main.md | 💡 спроектировано |
| 29 | Weekly Digest | ChatSEO analysis, май 2026 | 💡 идея |
| 30 | Issue Checklist | ChatSEO analysis, май 2026 | 💡 идея |
| 31 | SEO Foundation — сайт | shipready-growth-roadmap Фаза 1 | 💡 идея |
| 32 | Free Standalone Tools | shipready-growth-roadmap Фаза 2 | 💡 идея |
| 33 | MCP Server | shipready-growth-roadmap Фаза 4 | 💡 идея |
| 34 | Case Studies | shipready-growth-roadmap Фаза 3 | 💡 идея |
| 35 | Growth Campaigns Beta | growth-campaign-launch-playbook | 💡 инфра есть, prod нет |

### Описание новых фаз

**Phase 20 — Product Evolution v2**
Cleanup шум-checks (twitter-card, double-slash, apple-touch-icon). Новый ScanGoal тип: `seo | security | ai_visibility | full`. Generated artifacts: llms.txt, schema.org JSON-LD, security headers config. Per-platform AI readiness breakdown (ChatGPT/Claude/Perplexity/Google AI). SPA/no-SSR detection. Security ALERT banner для exposed credentials. Redirect chain detection. Lighthouse mobile metrics mapping. Три новых landing pages: /seo, /security, /ai-visibility. ModePicker на главной.
⚠️ Риск: смена ScanGoal типа — breaking change. Требует migration-шага (описан в плане Task 2.1).

**Phase 28 — Checks Deepening**
25+ новых проверок в три фазы по сложности. Phase 1: DNS/email security (SPF, DKIM, DMARC, CAA), cookie flags, expanded path probes, per-bot AI crawler checks, llms.txt content validation. Phase 2: sitemap quality, robots.txt quality, semantic HTML analysis, schema required fields. Phase 3: SSL Labs API (TLS audit), OSV CVE lookup (known vulnerabilities), PSI CrUX issues, AI content citability (Pro).
⚠️ Prerequisite: Phase 20 должна быть завершена (checks-deepening использует per-platform AI readiness из Phase 20 Task 4.1).

**Phase 29 — Weekly Digest**
Еженедельный email с diff двух сканов: что изменилось, прогресс по checklist, одно рекомендованное действие. Заменяет модель alert-при-изменении-score. Реализация: cron + Resend поверх существующей архитектуры monitored_domains. Новое решение D-29 (ревизирует D-21).
⚠️ Prerequisite: Phase 10 (Resend + monitored_domains уже есть).

**Phase 30 — Issue Checklist**
Каждый issue в отчёте — checkbox с персистентным состоянием. Пользователь отмечает выполненное → перезапускает скан → видит прогресс. Новая Supabase таблица: `issue_status (scan_id, issue_key, status, updated_at)`. Additive migration, не ломает существующие scans.
⚠️ Prerequisite: Phase 20 (стабильный ScanResult с финальным набором issue keys).

**Phase 31 — SEO Foundation собственного сайта**
Alternative pages: /alternatives/vs-screaming-frog, /alternatives/vs-lighthouse и др. Use-case pages: /for/producthunt-launch, /for/agency-client-delivery. Blog: контентный план на квартал (темы с purchase intent). Покрывает также тактические задачи из ACTION-PLAN.md (17 SEO-задач для shipready.app).
⚠️ Prerequisite: Phase 10 (нужен живой prod сайт). Нет кодовых зависимостей от других фаз.

**Phase 32 — Free Standalone Tools**
Отдельные страницы без регистрации: /tools/og-image-checker, /tools/robots-txt-tester, /tools/meta-tags-preview, /tools/ai-visibility-checker. Каждый инструмент — форма URL → результат → CTA на полный аудит. Органика + демонстрация продукта.
⚠️ Prerequisite: Phase 20 (паттерн landing pages).

**Phase 33 — MCP Server**
MCP-сервер поверх существующего REST API v1 (Phase 13 ✅). Инструменты: `shipready_audit(url)`, `shipready_quick_check(url, aspect)`. Публикация в Anthropic MCP directory. Документация + примеры промптов для Claude Code/Cursor.
⚠️ Prerequisite: Phase 13 ✅ done. REST API уже есть — нужна только MCP-обёртка.

**Phase 34 — Case Studies**
Кейсы по сегментам: Product Hunt launches, agency client delivery, SEO audits. Структура: контекст → что нашёл ShipReady → что исправили → результат.
⚠️ Prerequisite: реальные beta пользователи (Phase 10 → первые пользователи → первые истории).

**Phase 35 — Growth Campaigns Beta**
Beta Pro distribution через UTM-ссылки. Код и инфраструктура (growth_campaigns, referral_codes, beta_access_grants, migration 014) уже написаны. Нужна: применить migration 014 в prod, создать кампании в Supabase, настроить /admin/growth.
⚠️ Prerequisite: Phase 10 (prod Supabase, applied migrations).

---

## Deliverable 2 — Новый файл `ROADMAP.md` (корень проекта)

Файл-проводник: "что делать следующим и в каком порядке". PLAN.md — реестр фаз. ROADMAP.md — очерёдность с зависимостями и правилами безопасности.

### Структура файла

```
# ROADMAP — Execution Order

## Назначение
PLAN.md — полный реестр всех фаз и их статусов.
ROADMAP.md — ответ на вопрос: что делать следующим и почему.

## Текущая фаза
Phase 10 — Private Beta Readiness (🔄 активная)

## Tier 1 — Core Product (строго последовательно)
Phase 20 → Phase 28

## Tier 2 — Retention (параллельно с Tier 1)
Phase 29 → Phase 30

## Tier 3 — Distribution (параллельно, нет кодовых зависимостей)
Phases 31, 32, 33, 34 (любой порядок)

## Tier 4 — Agency / Long-term
Phases 21–27, 35

## Правила безопасности (non-breaking constraints)
[для каждой фазы — что может сломать и как избежать]
```

---

## Deliverable 3 — Новые записи в `DECISIONS.md`

**D-29: Weekly Digest заменяет alert-мониторинг** (ревизирует D-21)
Решено: вместо уведомления при изменении score — еженедельный digest с diff, прогрессом по checklist и одним рекомендованным действием. Причина: мониторинг = страховка, digest = привычка и retention. Отклонено: push-уведомления и real-time алерты — создают noise. D-21 (monitored_domains как storage) остаётся валидным — таблица используется для digest так же, как для alert.

**D-30: Issue checklist как core retention-механика**
Решено: каждый issue в отчёте — checkbox с персистентным состоянием. Хранение: Supabase, таблица `issue_status (scan_id, issue_key, status, updated_at)`. Причина: статичный список читают один раз, чеклист возвращает пользователя. Отклонено: только визуальный checklist без сохранения состояния — не даёт retention-эффекта.

---

## Deliverable 4 — Новая секция в `MEMORY.md` (корень проекта)

Добавить раздел "Инсайты из анализа конкурентов (май 2026)" с тремя пунктами:
1. Weekly digest > alert-мониторинг (retention-механика)
2. Issue checklist с персистентным состоянием — retention, не просто UX
3. MCP-сервер как growth-канал для vibe coding аудитории (наша аудитория буквально живёт в Cursor)

---

## Non-Breaking Rules

Правила, которые гарантируют что новые фазы не ломают предыдущие:

1. **Additive checks only** — новые проверки добавляются в существующие категории через существующий pattern (template → CONFIDENCE_MAP → check). Scoring formula не меняется без новой записи в DECISIONS.md.

2. **Additive Supabase migrations** — все новые таблицы (issue_status) добавляются через новую миграцию с `IF NOT EXISTS`. Нет ALTER TABLE без backward-compatible дефолтов.

3. **ScanGoal migration** — единственное breaking изменение. Phase 20 содержит явный шаг замены старых значений ('sales'/'leads'/'traffic'/'visibility'/'general') на новые. Выполнять grep до коммита.

4. **New routes = new files** — landing pages (/seo, /security, /ai-visibility), /tools/* добавляются как новые файлы. Существующие роуты не затрагиваются.

5. **MCP wrapper** — не меняет REST API, добавляет обёртку поверх. API контракт Phase 13 сохраняется.

6. **D-21 остаётся** — monitored_domains таблица используется для Weekly Digest так же как для alert. Digest заменяет логику email, не схему.

---

## Scope exclusions

- `ACTION-PLAN.md` (SEO-задачи для собственного сайта) — остаётся отдельным операционным файлом. Его задачи поглощаются Phase 31 как подзадачи.
- Phases 21–27 из product-evolution плана — Coming Soon, без детальных планов. Добавляются в PLAN.md только как строки с статусом `💡 Coming Soon`.
- Subscription management UI, dunning emails, Agency team UI — явно вне scope (уже зафиксировано в TODO.md "Not required for private beta").
