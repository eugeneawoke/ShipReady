# Quality Overhaul Plan

Дата: 2026-04-08
Статус: approved for implementation
Основание: внутренний аудит + сравнительный аудит Claude + текущий код `lib/checks/*`, `lib/scoring.ts`, `types/scan.ts`

## Goal

Сделать отчёт правдивым по умолчанию:

- score строится только на подтверждённых фактах
- сбой тяжёлой проверки не может выглядеть как "всё хорошо"
- медленные проверки не блокируют быстрый truthful feedback
- AI усиливает полезность отчёта, но не изобретает технические факты
- product promise по времени опирается на telemetry, а не на guesswork

## Main changes

### 1. Findings model

Каждый issue получает:

- `confidence: 'verified' | 'likely' | 'heuristic'`
- `scoreEligible: boolean`
- `evidence[]`
- `source`

Каждый тяжёлый блок получает measurement status:

- `measured`
- `partial`
- `unavailable`

Правило:

- только `verified + scoreEligible` влияют на score
- `likely` и `heuristic` видны в UI, но не штрафуют score
- `unavailable` рендерится как "Could not verify", а не как green/pass

### 2. Phase split

Новый status flow:

- `pending`
- `running_fast`
- `running_deep`
- `enriching`
- `done`
- `error`

#### Fast Truth Pass

В fast pass входят:

- safe URL validation
- shared fetch context: HTML + headers + final URL + timing
- verified SEO presence checks
- verified security checks
- mobile checks
- verified AI visibility checks

Fast pass должен быстро сохранять partial truthful result.

#### Deep Pass

В deep pass входят:

- Lighthouse
- link validation
- `og:image` validation
- noisy heuristics

Если deep pass падает:

- fast pass данные сохраняются
- итоговый scan не должен притворяться complete
- unavailable measurements должны быть видны в result

### 3. Reliability fixes before any feature work

Обязательные fixes:

1. Lighthouse failure больше не подставляет silent zero metrics.
2. Security перестаёт делать отдельный `fetch(url)` и reuse'ит shared context.
3. `.env` probes больше не выполняются последовательно.
4. `HEAD` checks получают `GET` fallback.
5. Text extraction исключает `script/style/noscript/template`.

## Confidence map

### Verified, score-eligible

- Performance: `lcp-slow`, `cls-high`, `inp-slow`, `fcp-slow`, `perf-score-low`, `a11y-score-low`
- SEO presence: `missing-title`, `missing-description`, `missing-h1`, `missing-canonical`, `missing-og-title`, `missing-og-description`, `missing-og-image`, `missing-twitter-card`
- Security: `no-https`, `missing-hsts`, `missing-x-frame`, `missing-xcto`, `missing-referrer-policy`, `missing-csp`, `unsafe-csp`, `ssl-expiring`, `exposed-env-file`
- Mobile: `missing-viewport`, `blocking-viewport`, `missing-favicon`, `missing-touch-icon`
- AI visibility: `missing-schema-org`, `missing-llms-txt`, `ai-crawlers-blocked`, `missing-sitemap`

### Likely, non-score

- SEO: `og-image-invalid`, `broken-links`
- Security: `api-key-in-html`, `mixed-content`
- AI visibility: `missing-faq-schema`, `poor-heading-hierarchy`

### Heuristic, non-score

- SEO: `title-length`, `placeholder-text`
- AI visibility: `thin-content`, `missing-author-entity`

## AI strategy

### Call A — evidence enrichment

Для всех scans.

Input:

- category scores
- findings with confidence and evidence
- top metrics

Output:

- concise summary
- top priorities
- wording improvements
- optional prompt overrides

Ограничения:

- не создаёт новые issue IDs
- не создаёт новые technical facts
- только summarizes and prioritizes existing evidence

### Call B — wow insights

Только для Pro/Agency.

Input:

- title / description / h1
- cleaned body text
- top verified findings
- optional cheap render context if already available

Output:

- copy/value-prop review
- trust/CTA clarity notes
- quick wins

Ограничения:

- не влияет на score
- opinionated output должен быть отделён от factual findings

### Why not multi-agent scan-time architecture

- дороже
- менее воспроизводимо
- хуже контролируется по latency
- не решает базовую проблему truthful scoring

Выбор: один compact enrichment call на все scans + отдельный wow-pass только для paid plans.

## Cost model

Модель: `gpt-5 mini`
Предположение по цене:

- input: $0.25 / 1M tokens
- output: $2.00 / 1M tokens

### Call A

- ~2k input + 800 output
- около `$0.0021` / scan

### Call B

- ~8k input + 2k output
- около `$0.0060` / paid scan

### Monthly estimate

Если все scans получают только Call A:

- 100 scans: `$0.21`
- 1,000 scans: `$2.10`
- 10,000 scans: `$21.00`

Если все scans получают Call A, а 20% paid scans получают Call B:

- 100 scans: `$0.33`
- 1,000 scans: `$3.30`
- 10,000 scans: `$33.00`

## PSI decision

PageSpeed Insights API не идёт в immediate implementation.

Сначала:

- fixing truthful scoring
- collecting telemetry
- measuring Railway Lighthouse p50/p95/p99 and failure rate

После этого можно сделать benchmark:

- Railway Lighthouse
- PSI API

Критерии сравнения:

- latency
- stability
- metric drift
- quota pressure
- cost

## Files to change

### Types and scoring

- `types/scan.ts`
- `lib/scoring.ts`
- `supabase/migrations/*`

### Orchestration

- `lib/checks/index.ts`
- `lib/checks/lighthouse.ts`
- `lib/checks/security.ts`
- `lib/checks/seo.ts`
- `lib/checks/links.ts`
- `lib/checks/ai-visibility.ts`
- `lib/checks/mobile.ts`

### AI layer

- `lib/ai/generate-summary.ts`
- or split into:
  - `lib/ai/generate-evidence-enrichment.ts`
  - `lib/ai/generate-wow-insights.ts`

### UI

- `app/report/[id]/page.tsx`
- `components/report/IssueCard.tsx`
- `components/report/ReportSkeleton.tsx`
- landing/metadata copy files that still mention exact seconds

### Telemetry

- scanner persistence path in `lib/checks/index.ts`
- script or SQL recipe for duration analysis

## Execution order

1. Types + schema + docs already aligned
2. Fix garbage-data paths
3. Introduce confidence/evidence and score gating
4. Split fast/deep orchestration
5. Add AI enrichment
6. Add telemetry and duration reporting
7. Only after telemetry, rewrite public timing promise

## Acceptance criteria

- No failed measurement can render as healthy score.
- No heuristic issue can reduce total score.
- Every user-visible issue has explicit evidence.
- Report can show partial truthful result before deep pass finishes.
- Exact timing promises stay out of public copy until telemetry threshold is met.
