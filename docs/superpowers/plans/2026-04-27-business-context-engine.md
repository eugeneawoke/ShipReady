# Business Context Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Business Intelligence pass that auto-detects what kind of business a site represents and generates business-context-aware technical fix prompts for agencies; remove all vibe-coder positioning.

**Architecture:** A new `analyzeBusinessContext` module runs in parallel with the Fast Truth Pass (no added latency), produces a `BusinessContext` object, which flows into the AI enrichment call to make all recommendations specific to the detected business type, tech stack, and scan goal. The scan form adds an optional goal selector. The report shows a Business Profile block and cleans up to one technical-only fix prompt.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, OpenAI gpt-4.1-nano, Supabase PostgreSQL, Tailwind CSS v4

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `types/scan.ts` | Add BusinessContext, ScanGoal types; remove aiVibePrompt, boltPrompt |
| Modify | `lib/scoring.ts` | Update buildScanResult params to match new types |
| Create | `supabase/migrations/010_scan_goal.sql` | Add scan_goal column |
| Create | `lib/ai/analyze-business-context.ts` | Deterministic + AI business detection |
| Modify | `app/api/scan/route.ts` | Accept scanGoal, store in DB, pass to dispatch |
| Modify | `lib/server/scanner-dispatch.ts` | Forward scanGoal to Railway |
| Modify | `app/api/run-scan/route.ts` | Receive scanGoal, pass to runAllChecks |
| Modify | `lib/checks/index.ts` | Run BI pass, thread scanGoal through scan flow |
| Modify | `lib/ai/generate-evidence-enrichment.ts` | Use BusinessContext + scanGoal, remove vibePrompt |
| Modify | `components/report/IssueCard.tsx` | Remove boltPrompt, use cursorPrompt only |
| Modify | `app/report/[id]/page.tsx` | Business Profile block, clean fix prompt logic |
| Modify | `components/landing/ScanForm.tsx` | Goal selector UI |
| Modify | `messages/en.ts` | Remove vibe-coder copy, add new agency copy |
| Modify | `messages/en.json` | Update subtitle |
| Modify | `messages/ru.ts` | Remove vibe-coder copy |
| Modify | `messages/ru.json` | Update subtitle |

---

## Task 1: Update Types and buildScanResult

**Files:**
- Modify: `types/scan.ts`
- Modify: `lib/scoring.ts`

- [ ] **Step 1: Update `types/scan.ts`**

Replace the entire file with:

```typescript
export type ScanStatus =
  | 'pending'
  | 'running'
  | 'running_fast'
  | 'running_deep'
  | 'enriching'
  | 'done'
  | 'error'

export type ScanPhase = 'fast' | 'deep' | 'enriching' | 'final'
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'pass'
export type IssueCategory = 'performance' | 'seo' | 'security' | 'mobile' | 'ai_visibility'
export type IssueConfidence = 'verified' | 'likely' | 'heuristic'
export type IssueSource = 'lighthouse' | 'http' | 'dom' | 'ssl' | 'link-check' | 'ai-visibility' | 'ai-enrichment'
export type EvidenceKind = 'metric' | 'header' | 'selector' | 'response' | 'text' | 'count' | 'status'
export type MeasurementStatus = 'measured' | 'partial' | 'unavailable'

export type ScanGoal = 'sales' | 'leads' | 'traffic' | 'visibility' | 'general'

export interface BusinessContext {
  businessType: 'ecommerce' | 'saas' | 'local_business' | 'portfolio' | 'blog' | 'agency' | 'other'
  techStack: string[]
  mainCTA: string | null
  detectedService: string | null
  targetAudience: string | null
  businessProfile: string | null
}

export interface IssueEvidence {
  kind: EvidenceKind
  label: string
  value: string | number
}

export interface Issue {
  id: string
  category: IssueCategory
  severity: IssueSeverity
  title: string
  description: string
  plainEnglish: string
  cursorPrompt: string
  docsUrl?: string
  value?: string | number
  confidence?: IssueConfidence
  scoreEligible?: boolean
  evidence?: IssueEvidence[]
  source?: IssueSource
}

export interface MeasurementState {
  status: MeasurementStatus
  label: string
  message?: string
  durationMs?: number
}

export interface CategoryScore {
  score: number | null
  label: 'excellent' | 'good' | 'needs-work' | 'poor' | 'unavailable'
  issues: Issue[]
  passedChecks: number
  totalChecks: number
  measurement?: MeasurementState
}

export interface ScanTimings {
  htmlFetchMs?: number
  fastPassMs?: number
  lighthouseMs?: number
  deepPassMs?: number
  aiEnrichmentMs?: number
  totalMs?: number
}

export interface WowInsight {
  title: string
  body: string
  evidenceRefs?: string[]
}

export interface ScanProcessingIssue {
  kind: 'timeout'
  stage: ScanStatus
  message: string
  recommendation: string
  staleAgeSeconds: number
}

export interface ScanResult {
  url: string
  scannedAt: string
  phase: ScanPhase
  totalScore: number | null
  confidenceSummary: {
    verified: number
    likely: number
    heuristic: number
  }
  timings?: ScanTimings
  performance: CategoryScore
  seo: CategoryScore
  security: CategoryScore
  mobile: CategoryScore
  ai_visibility: CategoryScore
  aiSummary?: string
  topPriorities?: string[]
  aiTechnicalPrompt?: string
  issuePrompts?: Record<string, { technical: string }>
  wowInsights?: WowInsight[]
  businessContext?: BusinessContext | null
  scanGoal?: ScanGoal
  processingIssue?: ScanProcessingIssue
}

export interface Scan {
  id: string
  url: string
  status: ScanStatus
  results: ScanResult | null
  user_id: string | null
  created_at: string
  updated_at: string
  processingIssue?: ScanProcessingIssue
}
```

- [ ] **Step 2: Update `buildScanResult` in `lib/scoring.ts`**

Find the `buildScanResult` function (starts at line ~200) and replace it:

```typescript
export function buildScanResult(params: {
  url: string
  phase: ScanPhase
  timings?: ScanTimings
  performance: CategoryScore
  seo: CategoryScore
  security: CategoryScore
  mobile: CategoryScore
  ai_visibility: CategoryScore
  aiSummary?: string
  topPriorities?: string[]
  aiTechnicalPrompt?: string
  issuePrompts?: Record<string, { technical: string }>
  wowInsights?: ScanResult['wowInsights']
  businessContext?: BusinessContext | null
  scanGoal?: ScanGoal
}): ScanResult {
  const base = {
    url: params.url,
    scannedAt: new Date().toISOString(),
    phase: params.phase,
    timings: params.timings,
    performance: params.performance,
    seo: params.seo,
    security: params.security,
    mobile: params.mobile,
    ai_visibility: params.ai_visibility,
    aiSummary: params.aiSummary,
    topPriorities: params.topPriorities,
    aiTechnicalPrompt: params.aiTechnicalPrompt,
    issuePrompts: params.issuePrompts,
    wowInsights: params.wowInsights,
    businessContext: params.businessContext,
    scanGoal: params.scanGoal,
  }

  const totalScore = weightedTotal(base)
  return {
    ...base,
    totalScore,
    confidenceSummary: countConfidence({
      ...base,
      totalScore,
      confidenceSummary: { verified: 0, likely: 0, heuristic: 0 },
    }),
  }
}
```

Also add the import at the top of `lib/scoring.ts` if `BusinessContext` and `ScanGoal` aren't already imported:

```typescript
import type { BusinessContext, CategoryScore, Issue, IssueCategory, IssueConfidence, ScanGoal, ScanPhase, ScanResult } from '@/types/scan'
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build 2>&1 | grep -E "error|Error" | head -20`

Expected: TypeScript errors about `boltPrompt`, `aiVibePrompt` — these are expected because other files still reference old fields. Note them; they will be fixed in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add types/scan.ts lib/scoring.ts
git commit -m "feat: add BusinessContext and ScanGoal types, remove vibePrompt/boltPrompt from types"
```

---

## Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/010_scan_goal.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 010_scan_goal.sql
-- Adds scan_goal column to scans table for business-context-aware audit recommendations

ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS scan_goal text
    CHECK (scan_goal IN ('sales', 'leads', 'traffic', 'visibility', 'general'))
    DEFAULT NULL;
```

- [ ] **Step 2: Apply migration locally**

Run: `npx supabase db push`

Expected: Migration applied successfully with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/010_scan_goal.sql
git commit -m "feat: add scan_goal column to scans table"
```

---

## Task 3: Create Business Context Analysis Module

**Files:**
- Create: `lib/ai/analyze-business-context.ts`

- [ ] **Step 1: Create the file**

```typescript
import OpenAI from 'openai'
import type { BusinessContext } from '@/types/scan'

const STACK_SIGNATURES: Array<[string, RegExp[]]> = [
  ['Shopify', [/cdn\.shopify\.com/i, /shopify-checkout-api-token/i, /Shopify\.theme/]],
  ['WordPress', [/\/wp-content\//i, /\/wp-includes\//i]],
  ['Next.js', [/__NEXT_DATA__/, /__next\//]],
  ['Webflow', [/assets\.website-files\.com/i, /\.webflow\.com/i]],
  ['Framer', [/framer\.com/i, /framerusercontent\.com/i]],
  ['Wix', [/wixstatic\.com/i, /wix\.com\/corvid/i]],
  ['Squarespace', [/squarespace\.com/i, /sqspcdn\.com/i]],
  ['Tailwind', [/cdn\.tailwindcss\.com/i]],
  ['React', [/react\.production\.min\.js/i, /__reactFiber/]],
]

const VALID_BUSINESS_TYPES = [
  'ecommerce', 'saas', 'local_business', 'portfolio', 'blog', 'agency', 'other',
] as const

function detectTechStack(html: string, headers: Record<string, string>): string[] {
  const detected: string[] = []
  for (const [name, patterns] of STACK_SIGNATURES) {
    if (patterns.some(p => p.test(html))) detected.push(name)
  }
  if (headers['x-vercel-id']) detected.push('Vercel')
  if (headers['x-nf-request-id']) detected.push('Netlify')
  return [...new Set(detected)]
}

function extractMainCTA(html: string): string | null {
  const matches = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)]
  for (const m of matches) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text.length > 1 && text.length < 50) return text
  }
  return null
}

interface PageSignals {
  title: string
  description: string
  headings: string[]
  mainCTA: string | null
  hasCart: boolean
  hasPricing: boolean
  structuredDataTypes: string[]
}

function extractPageSignals(html: string): PageSignals {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/<[^>]+>/g, '').trim() ?? ''

  const description = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i
  )?.[1] ?? ''

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)

  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 5)

  const hasCart = /cart|basket|add[\s-]to[\s-]cart/i.test(html)
  const hasPricing = /href=["'][^"']*\/(pricing|plans|subscribe)[/"']/i.test(html)

  const structuredDataTypes: string[] = []
  for (const block of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const parsed = JSON.parse(block[1])
      const t = parsed['@type']
      if (t) structuredDataTypes.push(Array.isArray(t) ? t[0] : String(t))
    } catch { /* invalid JSON-LD, skip */ }
  }

  return {
    title,
    description,
    headings: [...h1s, ...h2s],
    mainCTA: extractMainCTA(html),
    hasCart,
    hasPricing,
    structuredDataTypes,
  }
}

function inferBusinessTypeFromSignals(
  signals: PageSignals,
  techStack: string[],
): BusinessContext['businessType'] | null {
  if (signals.hasCart || techStack.includes('Shopify') || signals.structuredDataTypes.includes('Product')) {
    return 'ecommerce'
  }
  if (signals.hasPricing) return 'saas'
  return null
}

export async function analyzeBusinessContext(
  html: string,
  headers: Record<string, string> = {},
): Promise<BusinessContext> {
  const techStack = detectTechStack(html, headers)
  const signals = extractPageSignals(html)
  const deterministicType = inferBusinessTypeFromSignals(signals, techStack)

  const client = new OpenAI()

  let parsed: {
    businessType?: string
    detectedService?: string | null
    targetAudience?: string | null
    businessProfile?: string | null
  } = {}

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_SCAN_MODEL || 'gpt-4.1-nano',
      max_tokens: 250,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Analyze this website and return a JSON business profile. Only state what is directly supported by the signals. Return null for any field you cannot confidently determine.

Signals:
- Title: ${signals.title}
- Description: ${signals.description}
- Headings: ${JSON.stringify(signals.headings.slice(0, 8))}
- Primary CTA: ${signals.mainCTA ?? 'not detected'}
- Structured data types: ${signals.structuredDataTypes.join(', ') || 'none'}
- Has cart/shop elements: ${signals.hasCart}
- Has pricing/plans page: ${signals.hasPricing}
- Detected tech stack: ${techStack.join(', ') || 'unknown'}
${deterministicType ? `- Strong heuristic signal: ${deterministicType}` : ''}

Return EXACTLY this JSON:
{
  "businessType": "ecommerce" | "saas" | "local_business" | "portfolio" | "blog" | "agency" | "other",
  "detectedService": "short description of what they sell or offer, or null if not clear",
  "targetAudience": "who this is for, or null if not clearly supported by signals",
  "businessProfile": "1-2 sentence synthesis for use in recommendations, or null"
}

Rules: never invent details not in the signals. If uncertain about businessType use "other". targetAudience must be null unless clearly supported.`,
      }],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    parsed = JSON.parse(raw)
  } catch {
    // AI call failed or returned invalid JSON — use deterministic fallback only
  }

  const businessType = VALID_BUSINESS_TYPES.includes(
    parsed.businessType as typeof VALID_BUSINESS_TYPES[number]
  )
    ? (parsed.businessType as BusinessContext['businessType'])
    : deterministicType ?? 'other'

  return {
    businessType,
    techStack,
    mainCTA: signals.mainCTA,
    detectedService: parsed.detectedService ?? null,
    targetAudience: parsed.targetAudience ?? null,
    businessProfile: parsed.businessProfile ?? null,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build 2>&1 | grep "analyze-business-context" | head -5`

Expected: No errors referencing this file.

- [ ] **Step 3: Commit**

```bash
git add lib/ai/analyze-business-context.ts
git commit -m "feat: add analyzeBusinessContext module with deterministic + AI detection"
```

---

## Task 4: Thread scanGoal Through API

**Files:**
- Modify: `app/api/scan/route.ts`
- Modify: `lib/server/scanner-dispatch.ts`
- Modify: `app/api/run-scan/route.ts`

- [ ] **Step 1: Update `app/api/scan/route.ts` to accept and store scanGoal**

Find the section where the body is parsed (around line 35-37):

```typescript
const body = await request.json()
const raw = body.url as string
```

Replace with:

```typescript
const body = await request.json()
const raw = body.url as string
const scanGoal = (['sales', 'leads', 'traffic', 'visibility', 'general'] as const)
  .includes(body.scanGoal) ? body.scanGoal as string : null
```

Find the Supabase insert (around line 101-109):

```typescript
const { data, error } = await supabase
  .from('scans')
  .insert({
    url,
    status: 'pending',
    ...(userId ? { user_id: userId } : {}),
    ...(ip ? { ip_address: ip } : {}),
  })
  .select('id')
  .single()
```

Replace with:

```typescript
const { data, error } = await supabase
  .from('scans')
  .insert({
    url,
    status: 'pending',
    ...(userId ? { user_id: userId } : {}),
    ...(ip ? { ip_address: ip } : {}),
    ...(scanGoal ? { scan_goal: scanGoal } : {}),
  })
  .select('id')
  .single()
```

Find the Railway dispatch call (around line 119-123):

```typescript
waitUntil(
  dispatchScanToRailway(data.id, url).catch(async (err) => {
```

Replace with:

```typescript
waitUntil(
  dispatchScanToRailway(data.id, url, scanGoal ?? undefined).catch(async (err) => {
```

Find the dev fallback (around line 126-132):

```typescript
const { runAllChecks } = await import('@/lib/checks/index')
await runAllChecks(url, data.id)
```

Replace with:

```typescript
const { runAllChecks } = await import('@/lib/checks/index')
await runAllChecks(url, data.id, scanGoal ?? undefined)
```

- [ ] **Step 2: Update `lib/server/scanner-dispatch.ts`**

Replace the entire file:

```typescript
import 'server-only'
import type { ScanGoal } from '@/types/scan'

export async function dispatchScanToRailway(
  scanId: string,
  url: string,
  scanGoal?: ScanGoal,
): Promise<void> {
  const railwayUrl = process.env.RAILWAY_SCANNER_URL
  const scannerSecret = process.env.SCANNER_SECRET

  if (!railwayUrl || !scannerSecret) {
    throw new Error('Railway scanner is not configured')
  }

  const response = await fetch(`${railwayUrl}/api/run-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${scannerSecret}`,
    },
    body: JSON.stringify({ url, scanId, scanGoal }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Railway scanner error ${response.status}: ${body}`)
  }
}

export async function dispatchLighthouseRetryToRailway(scanId: string): Promise<void> {
  const railwayUrl = process.env.RAILWAY_SCANNER_URL
  const scannerSecret = process.env.SCANNER_SECRET

  if (!railwayUrl || !scannerSecret) {
    throw new Error('Railway scanner is not configured')
  }

  const response = await fetch(`${railwayUrl}/api/run-measurement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${scannerSecret}`,
    },
    body: JSON.stringify({ scanId, measurement: 'lighthouse' }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Railway measurement retry error ${response.status}: ${body}`)
  }
}
```

- [ ] **Step 3: Update `app/api/run-scan/route.ts`**

Replace the entire file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl } from '@/lib/utils'
import type { ScanGoal } from '@/types/scan'

// This endpoint is deployed on Railway only.
// Vercel calls it to offload heavy Lighthouse scans.
export const maxDuration = 300
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_GOALS = ['sales', 'leads', 'traffic', 'visibility', 'general'] as const

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!process.env.SCANNER_SECRET || auth !== `Bearer ${process.env.SCANNER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let url: string, scanId: string, scanGoal: ScanGoal | undefined
  try {
    const body = await request.json()
    url = body.url
    scanId = body.scanId
    scanGoal = VALID_GOALS.includes(body.scanGoal) ? body.scanGoal : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!url || !scanId) {
    return NextResponse.json({ error: 'Missing url or scanId' }, { status: 400 })
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ error: 'Invalid scanId' }, { status: 400 })
  }

  // Respond immediately — Railway is a persistent server so the Promise
  // continues running after the response is sent (unlike Vercel serverless)
  const { runAllChecks } = await import('@/lib/checks/index')
  runAllChecks(url, scanId, scanGoal).catch((e: unknown) => {
    console.error('run-scan background error:', e)
  })

  return NextResponse.json({ ok: true }, { status: 202 })
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | grep -E "error TS" | head -10`

Expected: No errors related to the modified API files.

- [ ] **Step 5: Commit**

```bash
git add app/api/scan/route.ts lib/server/scanner-dispatch.ts app/api/run-scan/route.ts
git commit -m "feat: thread scanGoal through scan API and Railway dispatch"
```

---

## Task 5: Integrate BI Pass Into Scan Flow

**Files:**
- Modify: `lib/checks/index.ts`

- [ ] **Step 1: Add import for analyzeBusinessContext**

At the top of `lib/checks/index.ts`, add after the existing imports:

```typescript
import { analyzeBusinessContext } from '@/lib/ai/analyze-business-context'
import type { BusinessContext, ScanGoal } from '@/types/scan'
```

- [ ] **Step 2: Update `runAllChecks` signature**

Find:
```typescript
export async function runAllChecks(url: string, scanId: string): Promise<void> {
```

Replace with:
```typescript
export async function runAllChecks(url: string, scanId: string, scanGoal?: ScanGoal): Promise<void> {
```

- [ ] **Step 3: Run BI Analysis in parallel with Fast Pass**

Find the parallel Fast Pass block (around line 166-171):

```typescript
const [seoFast, securityFast, mobileFast, aiVisibilityFast] = await Promise.all([
  safeTask(runSEOChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'seo-fast'),
  safeTask(runSecurityChecks(finalUrl, fetchContext.html, fetchContext), 10000, 'security-fast'),
  safeTask(runMobileChecks(fetchContext.html), 4000, 'mobile-fast'),
  safeTask(runAIVisibilityChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'ai-visibility-fast'),
])
```

Replace with:

```typescript
const [seoFast, securityFast, mobileFast, aiVisibilityFast, biAnalysis] = await Promise.all([
  safeTask(runSEOChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'seo-fast'),
  safeTask(runSecurityChecks(finalUrl, fetchContext.html, fetchContext), 10000, 'security-fast'),
  safeTask(runMobileChecks(fetchContext.html), 4000, 'mobile-fast'),
  safeTask(runAIVisibilityChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'ai-visibility-fast'),
  safeTask(
    analyzeBusinessContext(
      fetchContext.html,
      Object.fromEntries(fetchContext.headers.entries()),
    ),
    12000,
    'bi-analysis',
  ),
])

const businessContext: BusinessContext | null = biAnalysis.ok ? biAnalysis.value : null
```

(`fetchContext.headers` is a `Headers` object per `lib/checks/fetch-context.ts` — use `.entries()` to convert to a plain record.)

- [ ] **Step 4: Pass businessContext and scanGoal into fastResult**

Find the `buildScanResult` call for `fastResult` (around line 173):

```typescript
const fastResult = buildScanResult({
  url: finalUrl,
  phase: 'fast',
  timings: {
    ...timings,
    fastPassMs: Date.now() - startedAt,
  },
  ...
```

Add `businessContext` and `scanGoal` to this call:

```typescript
const fastResult = buildScanResult({
  url: finalUrl,
  phase: 'fast',
  timings: {
    ...timings,
    fastPassMs: Date.now() - startedAt,
  },
  performance: buildCategoryScore([], 'performance', {
    measurement: measurement('Lighthouse mobile audit', 'unavailable', 'Deep performance audit still running'),
  }),
  seo: buildCategoryScore(seoFast.ok ? seoFast.value : [], 'seo'),
  security: buildCategoryScore(securityFast.ok ? securityFast.value : [], 'security'),
  mobile: buildCategoryScore(mobileFast.ok ? mobileFast.value : [], 'mobile'),
  ai_visibility: buildCategoryScore(aiVisibilityFast.ok ? aiVisibilityFast.value : [], 'ai_visibility'),
  businessContext,
  scanGoal,
})
```

- [ ] **Step 5: Pass businessContext and scanGoal into deep result and enrichment**

Find the `result = buildScanResult({` call for the deep result (around line 206). Add `businessContext` and `scanGoal` to it:

```typescript
let result = buildScanResult({
  url: finalUrl,
  phase: 'deep',
  timings,
  performance: buildCategoryScore(performanceIssues, 'performance', { ... }),
  seo: buildCategoryScore(seoIssues, 'seo', { ... }),
  security: buildCategoryScore(securityFast.ok ? securityFast.value : [], 'security'),
  mobile: buildCategoryScore(mobileFast.ok ? mobileFast.value : [], 'mobile'),
  ai_visibility: buildCategoryScore(aiVisibilityIssues, 'ai_visibility', { ... }),
  businessContext,
  scanGoal,
})
```

Find the enrichment call (around line 233-234):

```typescript
const enrichment = await safeTask(generateEvidenceEnrichment(result), 35_000, 'ai-enrichment')
```

Replace with:

```typescript
const enrichment = await safeTask(
  generateEvidenceEnrichment(result, businessContext, scanGoal),
  35_000,
  'ai-enrichment',
)
```

Find the `buildScanResult` call after enrichment success (around line 237-248). Add `businessContext` and `scanGoal`:

```typescript
result = buildScanResult({
  ...result,
  phase: 'enriching',
  timings,
  aiSummary: enrichment.value.summary,
  topPriorities: enrichment.value.topPriorities,
  aiTechnicalPrompt: enrichment.value.technicalPrompt,
  issuePrompts: enrichment.value.issuePrompts,
  businessContext,
  scanGoal,
})
```

Also update the per-issue prompt mapping. Find:

```typescript
result[category].issues = result[category].issues.map(issue => {
  const aiPrompt = enrichment.value.issuePrompts?.[issue.id]
  if (!aiPrompt) return issue
  return {
    ...issue,
    cursorPrompt: aiPrompt.technical || issue.cursorPrompt,
    boltPrompt: aiPrompt.vibe || issue.boltPrompt,
  }
})
```

Replace with:

```typescript
result[category].issues = result[category].issues.map(issue => {
  const aiPrompt = enrichment.value.issuePrompts?.[issue.id]
  if (!aiPrompt) return issue
  return {
    ...issue,
    cursorPrompt: aiPrompt.technical || issue.cursorPrompt,
  }
})
```

Find the final `buildScanResult` call and add `businessContext` and `scanGoal`:

```typescript
result = buildScanResult({
  ...result,
  phase: 'final',
  timings: {
    ...timings,
    totalMs: Date.now() - startedAt,
  },
  businessContext,
  scanGoal,
})
```

- [ ] **Step 6: Verify build**

Run: `npm run build 2>&1 | grep -E "error TS" | head -10`

Expected: No errors about `runAllChecks` signature or businessContext.

- [ ] **Step 7: Commit**

```bash
git add lib/checks/index.ts
git commit -m "feat: run BI analysis in parallel with Fast Pass, thread context through scan flow"
```

---

## Task 6: Update AI Enrichment — Remove vibePrompt, Add Business Context

**Files:**
- Modify: `lib/ai/generate-evidence-enrichment.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import OpenAI from 'openai'
import type { BusinessContext, ScanGoal, ScanResult } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

const DEFAULT_ENRICHMENT_MODEL = 'gpt-4.1-nano'
const MAX_AI_ISSUES = 12

export interface EvidenceEnrichment {
  summary: string
  topPriorities: string[]
  technicalPrompt: string
  issuePrompts: Record<string, { technical: string }>
}

function compactIssue(issue: ReturnType<typeof getAllIssues>[number]) {
  return {
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    confidence: issue.confidence,
    title: issue.title,
    value: issue.value,
    evidence: issue.evidence?.slice(0, 3) ?? [],
  }
}

function buildBusinessContextBlock(
  businessContext: BusinessContext | null | undefined,
  scanGoal: ScanGoal | undefined,
): string {
  if (!businessContext && !scanGoal) return ''

  const lines: string[] = ['\nBusiness context (use this to make recommendations specific):']

  if (businessContext) {
    lines.push(`- Site type: ${businessContext.businessType}`)
    if (businessContext.techStack.length > 0) {
      lines.push(`- Tech stack: ${businessContext.techStack.join(', ')}`)
    }
    if (businessContext.detectedService) {
      lines.push(`- Detected service/product: ${businessContext.detectedService}`)
    }
    if (businessContext.targetAudience) {
      lines.push(`- Target audience: ${businessContext.targetAudience}`)
    }
    if (businessContext.mainCTA) {
      lines.push(`- Primary CTA: "${businessContext.mainCTA}"`)
    }
    if (businessContext.businessProfile) {
      lines.push(`- Profile: ${businessContext.businessProfile}`)
    }
  }

  if (scanGoal && scanGoal !== 'general') {
    const goalLabels: Record<string, string> = {
      sales: 'increase sales/conversions',
      leads: 'generate more leads',
      traffic: 'increase organic traffic',
      visibility: 'improve AI search visibility (AEO/GEO)',
    }
    lines.push(`- Owner's goal: ${goalLabels[scanGoal] ?? scanGoal}`)
    lines.push(`- Prioritise issues that most directly block this goal.`)
  }

  return lines.join('\n')
}

export async function generateEvidenceEnrichment(
  result: ScanResult,
  businessContext?: BusinessContext | null,
  scanGoal?: ScanGoal,
): Promise<EvidenceEnrichment> {
  const client = new OpenAI()
  const activeIssues = getAllIssues(result).filter(issue => issue.severity !== 'pass')
  const compactIssues = activeIssues.slice(0, MAX_AI_ISSUES).map(compactIssue)
  const issueIds = compactIssues.map(issue => issue.id)
  const businessContextBlock = buildBusinessContextBlock(businessContext, scanGoal)

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_SCAN_MODEL || DEFAULT_ENRICHMENT_MODEL,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You are helping produce an honest web quality report. You may summarize and prioritize findings, but you may not invent new technical facts or issue IDs.

URL: ${result.url}
Phase: ${result.phase}
Total score: ${result.totalScore ?? 'unavailable'}
Category scores:
- Performance: ${result.performance.score ?? 'unavailable'}
- SEO: ${result.seo.score ?? 'unavailable'}
- Security: ${result.security.score ?? 'unavailable'}
- Mobile: ${result.mobile.score ?? 'unavailable'}
- AI Visibility: ${result.ai_visibility.score ?? 'unavailable'}
${businessContextBlock}

Findings:
${JSON.stringify(compactIssues)}

Return EXACTLY this JSON shape:
{
  "summary": "1-2 sentence summary. Mention if some measurements were unavailable.",
  "topPriorities": ["priority 1", "priority 2", "priority 3"],
  "technicalPrompt": "A precise fix prompt for Cursor, Claude Code, or Windsurf. Reference specific files or config paths for the detected tech stack. Format: goal → concrete fix steps (4-7 bullets) → how to verify each fix on the live site.",
  "issuePrompts": {
    ${issueIds.map(id => `"${id}": { "technical": "..." }`).join(',\n    ')}
  }
}

Rules:
- Never introduce a new issue id
- Never claim a fact not present in findings/evidence
- If confidence is likely or heuristic, avoid overstating certainty
- technicalPrompt must reference the specific tech stack if known (e.g. for Shopify: "open product.liquid", for Next.js: "in next.config.ts", for WordPress: "in functions.php")
- technicalPrompt must name each concrete fix and the exact verification step on the live site
- Never use generic advice like "improve your meta description" — always say what to add/change and where
- For each issue prompt: one strong recommended fix with enough technical detail to act on. No alternatives.
- If business context is available, reference the detected service/audience/CTA when explaining business impact`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw)
    return {
      summary: parsed.summary ?? '',
      topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities : [],
      technicalPrompt: parsed.technicalPrompt ?? '',
      issuePrompts: parsed.issuePrompts ?? {},
    }
  } catch {
    return {
      summary: raw,
      topPriorities: [],
      technicalPrompt: '',
      issuePrompts: {},
    }
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | grep -E "error TS" | head -10`

Expected: No errors related to `generate-evidence-enrichment.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/ai/generate-evidence-enrichment.ts
git commit -m "feat: update enrichment to use business context, remove vibePrompt entirely"
```

---

## Task 7: Update IssueCard — Remove boltPrompt

**Files:**
- Modify: `components/report/IssueCard.tsx`

- [ ] **Step 1: Update prompt logic in IssueCard**

Find lines 39-40:

```typescript
const hasPrompts = !!(issue.cursorPrompt || issue.boltPrompt) && issue.severity !== 'pass'
const currentPrompt = issue.boltPrompt || issue.cursorPrompt || ''
```

Replace with:

```typescript
const hasPrompts = !!issue.cursorPrompt && issue.severity !== 'pass'
const currentPrompt = issue.cursorPrompt || ''
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | grep -E "error TS" | head -10`

Expected: No errors. If there are TypeScript errors about `boltPrompt` in issue templates or other check files, search and remove them:

```bash
grep -rn "boltPrompt" lib/checks/ lib/ai/ --include="*.ts"
```

For each file found, remove the `boltPrompt` field from issue template objects (set it to empty string or delete the property entirely, depending on the template structure).

- [ ] **Step 3: Commit**

```bash
git add components/report/IssueCard.tsx
git commit -m "feat: IssueCard uses cursorPrompt only, remove boltPrompt"
```

---

## Task 8: Update Report Page — Business Profile Block and Fix Prompt

**Files:**
- Modify: `app/report/[id]/page.tsx`

- [ ] **Step 1: Add BusinessProfileBlock component**

After the imports section (around line 14), add this component before the `JumpingDots` function:

```typescript
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ecommerce: 'E-commerce',
  saas: 'SaaS',
  local_business: 'Local Business',
  portfolio: 'Portfolio',
  blog: 'Blog',
  agency: 'Agency',
  other: 'Website',
}

function BusinessProfileBlock({ result }: { result: ScanResult }) {
  const ctx = result.businessContext
  if (!ctx) return null

  const typeLabel = BUSINESS_TYPE_LABELS[ctx.businessType] ?? 'Website'
  const stackLabel = ctx.techStack.length > 0 ? ctx.techStack.join(' + ') : null
  const goalLabels: Record<string, string> = {
    sales: 'More sales',
    leads: 'More leads',
    traffic: 'More traffic',
    visibility: 'AI visibility',
    general: 'General audit',
  }

  return (
    <section className="rounded-xl bg-[#161618] border border-white/6 px-4 py-3 space-y-1.5">
      <p className="text-xs text-[#8B8A85] uppercase tracking-[0.08em]">Site identified as</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
        <span className="text-sm font-medium text-[#F1F0EE]">{typeLabel}</span>
        {stackLabel && (
          <span className="text-xs text-[#8B8A85]">· {stackLabel}</span>
        )}
      </div>
      {ctx.detectedService && (
        <p className="text-xs text-[#8B8A85]">Selling: {ctx.detectedService}</p>
      )}
      {ctx.targetAudience && (
        <p className="text-xs text-[#5A5955]">Audience: {ctx.targetAudience} <span className="text-[#3A3935]">(estimated)</span></p>
      )}
      {result.scanGoal && result.scanGoal !== 'general' && (
        <p className="text-xs text-[#8B8A85]">Your goal: {goalLabels[result.scanGoal] ?? result.scanGoal}</p>
      )}
      <p className="text-xs text-[#5A5955]">Recommendations below are tailored to this context.</p>
    </section>
  )
}
```

- [ ] **Step 2: Fix `aiDone` to not reference `aiVibePrompt`**

Find line 146:

```typescript
const aiDone = Boolean(results.aiSummary || results.aiTechnicalPrompt || results.aiVibePrompt)
```

Replace with:

```typescript
const aiDone = Boolean(results.aiSummary || results.aiTechnicalPrompt)
```

- [ ] **Step 3: Update `fixEverythingPrompt` logic**

Find lines 484-488:

```typescript
const fixEverythingPrompt = isWeakFixPrompt(results.aiVibePrompt, activeIssues, measurementNotes)
  ? isWeakFixPrompt(results.aiTechnicalPrompt, activeIssues, measurementNotes)
    ? deterministicPrompts.vibe
    : results.aiTechnicalPrompt
  : results.aiVibePrompt
```

Replace with:

```typescript
const fixEverythingPrompt = isWeakFixPrompt(results.aiTechnicalPrompt, activeIssues, measurementNotes)
  ? deterministicPrompts.technical
  : results.aiTechnicalPrompt
```

- [ ] **Step 4: Add BusinessProfileBlock to the report JSX**

Find the `ScanProgressPanel` block (around line 726-733):

```typescript
<ScanProgressPanel
  scan={scan}
  results={results}
  processingIssue={processingIssue}
  retryingMeasurement={retryingMeasurement}
  retryError={retryError}
  onRetryLighthouse={handleRetryLighthouse}
/>
```

Add `BusinessProfileBlock` immediately after it, before the Score+Summary section:

```typescript
<ScanProgressPanel
  scan={scan}
  results={results}
  processingIssue={processingIssue}
  retryingMeasurement={retryingMeasurement}
  retryError={retryError}
  onRetryLighthouse={handleRetryLighthouse}
/>

{isFinalReport && results.businessContext && (
  <BusinessProfileBlock result={results} />
)}
```

- [ ] **Step 5: Update Fix section title**

Find around line 828-830:

```typescript
<h2 className="text-sm font-medium text-[#F1F0EE]">{t('fixEverything')}</h2>
```

Replace with:

```typescript
<h2 className="text-sm font-medium text-[#F1F0EE]">Fix prompts for Cursor · Claude Code · Windsurf</h2>
```

(We will update the i18n key in Task 10. For now hardcode to unblock the build.)

- [ ] **Step 6: Verify build**

Run: `npm run build 2>&1 | grep -E "error TS" | head -10`

Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add app/report/[id]/page.tsx
git commit -m "feat: add BusinessProfileBlock to report, clean up fix prompt logic"
```

---

## Task 9: Update ScanForm — Goal Selector

**Files:**
- Modify: `components/landing/ScanForm.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import type { ScanGoal } from '@/types/scan'

const FRIENDLY_ERRORS: Record<string, string> = {
  Forbidden: 'friendlyErrors.forbidden',
  'Failed to create scan': 'friendlyErrors.failedToCreateScan',
  'Invalid URL': 'friendlyErrors.invalidUrl',
  'Rate limit exceeded. Sign in for more scans.': 'friendlyErrors.rateLimitExceeded',
  'Free limit reached': 'friendlyErrors.freeLimitReached',
}

function friendlyMessage(raw: string, t: ReturnType<typeof useTranslations<'ScanForm'>>): string {
  const key = FRIENDLY_ERRORS[raw]
  return key ? t(key) : raw
}

const SCAN_GOALS: Array<{ value: ScanGoal; label: string }> = [
  { value: 'sales', label: 'More sales' },
  { value: 'leads', label: 'More leads' },
  { value: 'traffic', label: 'More traffic' },
  { value: 'visibility', label: 'AI visibility' },
]

export function useScanLauncher() {
  const t = useTranslations('ScanForm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ msg: string; showContact: boolean } | null>(null)
  const loadingRef = useRef(false)
  const router = useRouter()

  async function launchScan(rawUrl: string, scanGoal?: ScanGoal) {
    if (loadingRef.current || !rawUrl.trim()) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl, ...(scanGoal ? { scanGoal } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) {
        const raw = data.error || 'Something went wrong'
        const msg = friendlyMessage(raw, t)
        const showContact = res.status >= 500 || raw === 'Forbidden' || raw === 'Failed to create scan'
        setError({ msg, showContact })
        setLoading(false)
        loadingRef.current = false
        return
      }
      router.push(`/scan/${data.id}`)
    } catch {
      setError({ msg: t('friendlyErrors.network'), showContact: true })
      setLoading(false)
      loadingRef.current = false
    }
  }

  return {
    loading,
    error,
    launchScan,
    clearError: () => setError(null),
  }
}

export function ScanForm({
  initialUrl = '',
  submitLabel,
  compact = false,
  autoFocus = false,
  className = '',
}: {
  initialUrl?: string
  submitLabel?: string
  compact?: boolean
  autoFocus?: boolean
  className?: string
}) {
  const t = useTranslations('ScanForm')
  const [url, setUrl] = useState(initialUrl)
  const [scanGoal, setScanGoal] = useState<ScanGoal | undefined>(undefined)
  const { loading, error, launchScan } = useScanLauncher()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await launchScan(url, scanGoal)
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${compact ? '' : 'max-w-[560px] mx-auto'} ${className}`}>
      <div className={`flex gap-2 ${compact ? 'h-10' : 'h-[52px]'}`}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={t('placeholder')}
          disabled={loading}
          autoFocus={autoFocus}
          className={`flex-1 h-full rounded-lg font-mono bg-[#161618] border border-white/10 text-[#F1F0EE] placeholder:text-[#5A5955] focus:outline-none focus:border-white/20 disabled:opacity-50 transition-colors ${
            compact ? 'px-3 text-sm' : 'px-4 text-base sm:text-sm'
          }`}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={`${compact ? 'px-4' : 'px-6'} h-full rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0`}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('scanning')}</>
          ) : (
            submitLabel ?? t('defaultSubmit')
          )}
        </button>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#5A5955]">Goal:</span>
          {SCAN_GOALS.map(goal => (
            <button
              key={goal.value}
              type="button"
              onClick={() => setScanGoal(prev => prev === goal.value ? undefined : goal.value)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                scanGoal === goal.value
                  ? 'border-[#6E56CF]/60 bg-[#1A1625] text-[#C7BCFF]'
                  : 'border-white/8 bg-[#161618] text-[#5A5955] hover:text-[#8B8A85] hover:border-white/15'
              }`}
            >
              {goal.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-[#FF4444] space-y-0.5">
          <p>{error.msg}</p>
          {error.showContact && (
            <p className="text-[#8B8A85] text-xs">
              {t('contactPrefix')}{' '}
              <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">{t('contactTelegram')}</a>
              {' '}or{' '}
              <a href="mailto:egusakov74@gmail.com" className="text-[#6E56CF] hover:underline">{t('contactEmail')}</a>
            </p>
          )}
        </div>
      )}
    </form>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | grep -E "error TS" | head -10`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/ScanForm.tsx
git commit -m "feat: add scan goal selector to ScanForm"
```

---

## Task 10: Repositioning Copy

**Files:**
- Modify: `messages/en.ts`
- Modify: `messages/en.json`
- Modify: `messages/ru.ts`
- Modify: `messages/ru.json`

- [ ] **Step 1: Update `messages/en.ts`**

Make the following targeted replacements (search for each string and replace):

| Find | Replace |
|------|---------|
| `appDescription: 'Pre-deploy quality gate for vibe-coded apps'` | `appDescription: 'Site audits that understand your client\'s business.'` |
| `layoutTitle: 'ShipReady - Pre-deploy quality gate for vibe-coded apps'` | `layoutTitle: 'ShipReady - Site audits that understand your client\'s business'` |
| `layoutDescription: '35+ automated checks across performance, SEO, security, mobile, and AI visibility. Get evidence-based fix prompts for vibe-coding tools.'` | `layoutDescription: '35+ automated checks across performance, SEO, security, mobile, and AI visibility. Get evidence-based fix prompts for Cursor, Claude Code, and Windsurf.'` |
| `'AI fix prompts for vibe-coding tools'` | `'AI fix prompts for Cursor, Claude Code & Windsurf'` |
| `fixEverything: 'Fix everything'` | `fixEverything: 'Fix prompts for Cursor · Claude Code · Windsurf'` |
| `'Prompt surfaces for code-aware and vibe tools'` | `'Prompt surfaces for Cursor, Claude Code, and Windsurf'` |
| `h1a: 'Your vibe-coded app,'` | `h1a: 'Your client\'s site,'` |
| `sub: 'Paste your URL. Get a full audit across performance, SEO, security, mobile, and AI visibility, with evidence-based fix prompts for vibe-coding tools.'` | `sub: 'Paste a URL. Get a full audit across performance, SEO, security, mobile, and AI visibility — with fix prompts ready for Cursor and Claude Code.'` |
| `{ step: '03', emoji: '3', title: 'Get AI fix prompts', desc: 'Each issue has a plain-English explanation and one ready-to-paste prompt for your vibe-coding tool.' }` | `{ step: '03', emoji: '3', title: 'Get AI fix prompts', desc: 'Each issue has a plain-English explanation and one ready-to-paste technical prompt for Cursor, Claude Code, or Windsurf.' }` |
| `sub: 'Every issue comes with a plain-English explanation and a ready-to-paste prompt. Paste it into your vibe-coding tool and fix the problem directly in the codebase.'` | `sub: 'Every issue comes with a plain-English explanation and a ready-to-paste technical prompt. Paste it into Cursor, Claude Code, or Windsurf and fix the problem directly in the codebase.'` |
| `'Tailored for Next.js, React, and vibe-coded apps'` | `'Tailored to the detected tech stack — Shopify, Next.js, WordPress, and more'` |
| `'Works with Cursor, Windsurf, Bolt, Lovable, v0, Replit, and more'` | `'Works with Cursor, Claude Code, and Windsurf'` |
| `a: 'ShipReady is a pre-deploy quality gate for vibe-coded apps. Submit your URL and get a scan report covering performance, SEO, security, mobile readiness, and AI visibility — with fix prompts ready to paste into your AI coding tool.'` | `a: 'ShipReady audits any URL and understands your business context. Get a report covering performance, SEO, security, mobile readiness, and AI visibility — with fix prompts for Cursor, Claude Code, and Windsurf.'` |
| `q: 'Does ShipReady work with Cursor, Bolt, Lovable, and other AI tools?'` | `q: 'Does ShipReady work with Cursor and Claude Code?'` |
| `a: 'Yes. Every issue in your report includes a ready-to-paste fix prompt tailored for Cursor, Windsurf, Bolt, Lovable, v0, Replit, and other AI coding tools. Just copy and paste to fix.'` | `a: 'Yes. Every issue in your report includes a ready-to-paste technical fix prompt tailored for Cursor, Claude Code, and Windsurf. Just copy and paste to fix.'` |
| `tagline: 'Pre-deploy quality gate for vibe-coded apps.'` | `tagline: 'Site audits that understand your client\'s business.'` |
| `copy: '© 2025 ShipReady · Handcrafted for indie builders and vibe coders'` | `copy: '© 2025 ShipReady · Built for agencies and developers who ship quality'` |

Also update the Pro plan features array. Find:
```typescript
features: ['Unlimited scans', 'AI fix prompts for vibe-coding tools', 'PDF export', 'Weekly monitoring'],
```
Replace with:
```typescript
features: ['Unlimited scans', 'AI fix prompts for Cursor, Claude Code & Windsurf', 'PDF export', 'Weekly monitoring'],
```

- [ ] **Step 2: Update `messages/en.json`**

Find:
```json
"subtitle": "for vibe-coded apps"
```
Replace with:
```json
"subtitle": "Site audits that understand your client's business"
```

- [ ] **Step 3: Update `messages/ru.ts`**

Apply the same concept for Russian strings. Find and replace:

| Find | Replace |
|------|---------|
| `appDescription: 'Проверка качества перед деплоем для vibe-coded приложений'` | `appDescription: 'Аудит сайтов, который понимает бизнес вашего клиента.'` |
| Any occurrence of `vibe` | Remove or replace with `Cursor / Claude Code` equivalent |

- [ ] **Step 4: Update `messages/ru.json`**

Find:
```json
"subtitle": "для vibe-coded приложений"
```
Replace with:
```json
"subtitle": "Аудит сайтов, который понимает бизнес клиента"
```

- [ ] **Step 5: Verify build and lint**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds.

Run: `npm run lint 2>&1 | grep -E "error|Error" | head -10`

Expected: No lint errors.

- [ ] **Step 6: Final check — search for remaining vibe references**

Run:
```bash
grep -rn "vibe\|boltPrompt\|aiVibePrompt\|Bolt\|Lovable\|v0\|Replit" \
  app/ components/ lib/ messages/ types/ \
  --include="*.ts" --include="*.tsx" --include="*.json" \
  | grep -v node_modules | grep -v ".next"
```

For each remaining reference:
- `boltPrompt` in `lib/checks/*.ts` issue templates: remove the `boltPrompt` field (set to `''` or delete — the `Issue` type no longer includes it, so TypeScript will flag remaining usages)
- Any UI references to Bolt/Lovable: replace with Cursor/Claude Code
- Any remaining `aiVibePrompt` references: delete

- [ ] **Step 7: Commit**

```bash
git add messages/en.ts messages/en.json messages/ru.ts messages/ru.json
git commit -m "feat: reposition copy from vibe coders to agencies, update tool references"
```

---

## Task 11: Final Cleanup — Remove boltPrompt from Issue Templates

**Files:**
- Modify: `lib/checks/*.ts` (whichever files have `boltPrompt` in issue objects)

- [ ] **Step 1: Find all boltPrompt references in check files**

Run:
```bash
grep -rn "boltPrompt" lib/ --include="*.ts"
```

- [ ] **Step 2: Remove boltPrompt from each file found**

For each file returned, find every object that has `boltPrompt: '...'` and delete that line. The `Issue` type no longer has this field so TypeScript will enforce the removal.

Example — before:
```typescript
{
  id: 'seo_missing_meta',
  ...
  cursorPrompt: 'Add a descriptive meta description...',
  boltPrompt: 'Add a descriptive meta description...',
}
```

After:
```typescript
{
  id: 'seo_missing_meta',
  ...
  cursorPrompt: 'Add a descriptive meta description...',
}
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `npm run build 2>&1 | grep -E "error TS" | head -20`

Expected: Zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add lib/checks/
git commit -m "chore: remove boltPrompt from all issue templates"
```

---

## Task 12: Final Full Build Verification

- [ ] **Step 1: Full build**

Run: `npm run build`

Expected: Build completes with exit code 0, no TypeScript errors, no lint errors.

- [ ] **Step 2: Search for any remaining old references**

Run:
```bash
grep -rn "aiVibePrompt\|boltPrompt\|vibePrompt\|vibe.cod" \
  app/ components/ lib/ types/ messages/ \
  --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Expected: Zero results.

- [ ] **Step 3: Verify fetch-context headers compatibility**

Run: `grep -n "headers" lib/checks/fetch-context.ts | head -10`

Confirm `fetchContext.headers` shape matches how it's passed to `analyzeBusinessContext` in `lib/checks/index.ts`. Fix if needed.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Business Context Engine — agency repositioning complete

- Auto-detects business type, tech stack, and business profile
- Scan goal selector on scan form (sales/leads/traffic/visibility)
- Business Profile block in report header
- All fix prompts now context-aware and tech-stack specific
- Only technical fix prompt remains; vibePrompt/boltPrompt removed
- Copy repositioned from vibe coders to web/dev agencies"
```
