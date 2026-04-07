# ShipReady — Agent Context

> Claude Code читает этот файл автоматически при каждом запуске.
> Держать КОРОТКИМ — только rules, стек, команды, compact policy.
> Всё остальное — в отдельных файлах по ролям.

---

## Стартовый ритуал (первым делом в каждой сессии)

```
1. PLAN.md      → текущая фаза и цель
2. TODO.md      → активный шаг
3. DECISIONS.md → что уже решено, что отклонено (не предлагать снова)
4. EVIDENCE.md  → что реально проверено (не перепроверять)
5. MEMORY.md    → важное между сессиями, продуктовые решения

После каждого завершённого шага → обновить нужный файл.
Отвечать только: что сделал / что узнал / что следующее.
Сырые outputs (логи, test results, curl) → в logs/, не в чат.
```

---

## Продукт

ShipReady — вставляешь URL → отчёт за 30 сек: performance + SEO + security + mobile.
Каждая проблема = plain-English объяснение + готовый промпт для Cursor/Bolt/Lovable.
Аудитория: indie hackers, vibe coders, solo founders. Рынки: СНГ + international.

---

## Стек (менять только с записью в DECISIONS.md)

```
Next.js 14 App Router · TypeScript strict · Tailwind CSS · shadcn/ui
Supabase (PostgreSQL + Auth) · OpenAI gpt-4o-mini
@sparticuz/chromium + lighthouse · cheerio · ssl-checker
Resend · lucide-react · Vercel (fra1)
```

---

## Команды

```bash
npm run dev           # dev server
npm run build         # production build
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npx supabase db push  # apply migrations
```

---

## Hard rules

- `process.env.*` только — никогда hardcode secrets
- HTML fetчится ОДИН раз в оркестраторе → передаётся строкой во все checks
- Типы только из `types/scan.ts` — никогда inline
- API логика только в `lib/` или `app/api/` — не в компонентах
- OpenAI API: один вызов на весь скан, max_tokens 300
- Новый check → сначала запись в `CHECKS.md`, потом код
- Новое архитектурное решение → сначала запись в `DECISIONS.md`, потом код

---

## Compact policy (что re-inject после /compact)

1. Текущая фаза из PLAN.md
2. Активный шаг из TODO.md
3. Последние 3 записи DECISIONS.md
4. Последние 3 записи EVIDENCE.md
5. Весь MEMORY.md целиком

---

## Файловая структура проекта

```
shipready/
├── CLAUDE.md           ← этот файл (читается автоматически)
├── PLAN.md             ← фазы + текущая фаза
├── TODO.md             ← шаги + статусы
├── DECISIONS.md        ← решения + rejected paths
├── EVIDENCE.md         ← подтверждённые факты
├── MEMORY.md           ← постоянная память между сессиями
├── CHECKS.md           ← спецификация всех 25 checks с кодом
├── DESIGN.md           ← дизайн-система (цвета, компоненты)
├── logs/               ← сырые outputs (никогда не в чат)
├── app/
│   ├── (landing)/page.tsx
│   ├── report/[id]/page.tsx
│   ├── dashboard/page.tsx
│   ├── pricing/page.tsx
│   ├── auth/callback/route.ts
│   └── api/
│       ├── scan/route.ts
│       ├── scan/[id]/route.ts
│       ├── badge/[domain]/route.ts
│       ├── cron/rescan/route.ts
│       └── webhooks/ls/route.ts
├── lib/
│   ├── checks/
│   │   ├── index.ts       ← оркестратор
│   │   ├── lighthouse.ts
│   │   ├── seo.ts
│   │   ├── security.ts
│   │   ├── mobile.ts
│   │   └── links.ts
│   ├── ai/
│   │   ├── generate-summary.ts
│   │   └── issue-templates.ts
│   ├── scoring.ts
│   ├── auth.ts
│   ├── supabase.ts
│   └── utils.ts
├── components/
│   ├── report/
│   │   ├── ScoreRing.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── IssueCard.tsx
│   │   ├── OGPreview.tsx
│   │   └── ReportSkeleton.tsx
│   └── landing/
│       └── ScanForm.tsx
├── types/scan.ts
├── messages/en.json
├── messages/ru.json
├── supabase/migrations/001_initial.sql
└── vercel.json
```

---

## DB schema

```sql
CREATE TABLE scans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url        TEXT NOT NULL,
  status     TEXT DEFAULT 'pending'
             CHECK (status IN ('pending','running','done','error')),
  results    JSONB,
  user_id    UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read by id" ON scans FOR SELECT USING (true);
CREATE POLICY "insert allowed"    ON scans FOR INSERT WITH CHECK (true);
CREATE POLICY "update own"        ON scans FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);
```

---

## TypeScript типы (types/scan.ts)

```typescript
export type ScanStatus    = 'pending' | 'running' | 'done' | 'error';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'pass';
export type IssueCategory = 'performance' | 'seo' | 'security' | 'mobile';

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  plainEnglish: string;
  cursorPrompt: string;
  boltPrompt: string;
  docsUrl?: string;
  value?: string | number;
}

export interface CategoryScore {
  score: number;
  label: 'excellent' | 'good' | 'needs-work' | 'poor';
  issues: Issue[];
  passedChecks: number;
  totalChecks: number;
}

export interface ScanResult {
  url: string;
  scannedAt: string;
  totalScore: number;
  performance: CategoryScore;
  seo: CategoryScore;
  security: CategoryScore;
  mobile: CategoryScore;
  aiSummary?: string;
}
```

---

## Scoring алгоритм

```
Deductions per issue: critical −25 · high −15 · medium −7 · low −3
categoryScore = max(0, 100 − sum(deductions))
totalScore = performance×0.30 + seo×0.25 + security×0.30 + mobile×0.15
Labels: 90–100 excellent · 70–89 good · 50–69 needs-work · 0–49 poor
```

---

## Paywall

```
Free:   3 скана/мес · scores видны · AI prompts заблюрены
Pro:    $14/мес · unlimited · prompts открыты · PDF · monitoring
Agency: $39/мес · 10 доменов · white-label PDF
```

---

## Environment variables

```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
```
