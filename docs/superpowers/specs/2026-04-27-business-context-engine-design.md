# Business Context Engine & Agency Repositioning — Design Spec

Date: 2026-04-27
Status: approved
Phase: post-private-beta

---

## Problem

ShipReady currently generates generic audit recommendations that do not account for what kind of business is being audited. A Shopify jewelry store and a B2B SaaS landing page receive nearly identical wording on identical issues. Fix prompts reference vibe-coding tools (Bolt, Lovable, v0) that the actual target audience does not use.

The current positioning ("pre-deploy quality gate for vibe-coded apps") targets a segment that does not pay for tools like this. The product is technically stronger than its positioning suggests.

---

## Goals

1. Make every recommendation aware of the business context of the site being audited.
2. Produce fix prompts that are specific, actionable, and ready to paste into Cursor / Claude Code / Windsurf.
3. Reposition from vibe coders to small web/dev agencies and freelance developers building for clients.
4. Remove all vibe-coder-specific language and tooling references from the product.

---

## Non-Goals

- Agency white-label PDF (post-v1, Approach 3)
- Executive view vs Technical view split report (post-v1)
- Team seats and multi-user agency workflows (post-v1)
- Multi-page crawl (out of scope per DECISIONS.md)

---

## Target Audience

**Primary ICP — Small web/dev agencies (1–15 people)**
Build sites for clients. Need a fast pre-handoff audit, a client-facing report, and actionable fix prompts for their AI coding tools. No Semrush budget, no dedicated QA process. Pain: discovering issues after client handoff is embarrassing and expensive.

**Secondary ICP — SEO/marketing agencies**
Handle SEO for clients. Increasingly asked "why aren't we in ChatGPT?" AI Visibility is their specific gap — no existing tool at their price point integrates it into a holistic site score.

---

## Design

### Approach: Business Profile Module (Approach 2)

A new Business Intelligence (BI) Analysis pass runs in parallel with the Fast Truth Pass. It produces a `BusinessContext` object that flows into the AI enrichment call, making all recommendations context-aware.

Iterative rollout:
- **Now (this spec):** Business Profile Module + goal input + context-aware prompts + repositioning
- **Next iteration:** Agency Report Mode (executive summary vs technical view, white-label PDF)

---

## Architecture

### Scan Flow Change

```
fetchPrimaryContext → HTML available

[Fast Truth Pass]  +  [BI Analysis] ← NEW, runs in parallel
         ↓
    save fast result (running_deep)

[Deep Pass: Lighthouse + SEO deep + AI visibility deep]
         ↓
    save deep result (enriching)

[AI Enrichment] ← receives BusinessContext + scanGoal
         ↓
    save done result
```

BI Analysis runs in parallel with the Fast Truth Pass because it only needs HTML + headers, which are available immediately after `fetchPrimaryContext`. It adds zero wall-clock time to the scan.

### New Files

| File | Purpose |
|------|---------|
| `lib/ai/analyze-business-context.ts` | BI Analysis module |

### Modified Files

| File | Change |
|------|--------|
| `lib/checks/index.ts` | Integrate BI pass; pass `businessContext` + `scanGoal` to enrichment |
| `lib/ai/generate-evidence-enrichment.ts` | Accept and use `businessContext` + `scanGoal`; remove `vibePrompt` output |
| `types/scan.ts` | Add `businessContext`, `scanGoal` fields; remove `aiVibePrompt`, `boltPrompt` |
| `components/landing/ScanForm.tsx` | Add scan goal selector |
| `app/report/[id]/page.tsx` | Show Business Profile block; update Fix prompt block |
| `app/api/scan/route.ts` | Accept and store `scanGoal` |
| `app/api/run-scan/route.ts` | Accept and forward `scanGoal` to scanner |

---

## Business Intelligence Module

### Two-layer detection: deterministic first, AI second

**Layer 1 — Deterministic (no AI, from HTML signatures)**

These are facts extracted from the HTML and HTTP headers. They are always `verified`.

```typescript
techStack: string[]
// Detected from known signatures:
// Shopify   → <meta name="shopify-checkout-api-token"> or /cdn.shopify.com/
// Next.js   → <script id="__NEXT_DATA__">
// WordPress → /wp-content/ in asset paths
// React     → <div id="root"> or react-related script patterns
// Tailwind  → class patterns or tailwind CDN
// Vercel    → x-vercel-id response header
// Netlify   → x-nf-request-id response header

mainCTA: string
// Primary button text (largest/most prominent interactive element)

// Intermediate signals — used to determine businessType, NOT stored in BusinessContext:
hasCartElements: boolean     // /cart|basket|add.to/i patterns in HTML
hasPricingPage: boolean      // /pricing|/plans in discovered links
hasStructuredData: boolean   // Presence of <script type="application/ld+json">
```

**Layer 2 — AI inference (from compact extracted signals, not full HTML)**

AI receives only these extracted elements — not the full HTML. This limits hallucination surface.

```
Input to AI:
- title tag text
- meta description content
- all h1 and h2 text
- primary CTA text
- structured data types present (e.g. Product, Organization, FAQ)
- detected signals from Layer 1 (techStack, hasCart, hasPricing)

Output from AI:
- businessType: 'ecommerce' | 'saas' | 'local_business' | 'portfolio' | 'blog' | 'agency' | 'other'
- detectedService: string | null
- targetAudience: string | null
- businessProfile: string | null  (free-form synthesis)
```

**AI grounding rule (in prompt):**
> "Only state what is directly supported by the provided signals. If you are not confident about target audience or detected service, return null for that field. Never invent details not present in the input."

### Confidence model

Mirrors the existing `verified / likely / heuristic` model:

| Field | Confidence | Reason |
|-------|-----------|--------|
| `techStack` | verified | HTML signature match |
| `mainCTA` | verified | DOM extraction |
| `hasCartElements` | verified | Pattern match |
| `businessType` | likely or verified | verified if multiple strong signals align; likely if AI-only |
| `detectedService` | likely | AI from title/h1/description |
| `targetAudience` | heuristic | AI inference |
| `businessProfile` | likely | AI synthesis |

### Null handling

If AI returns null for a field, the system uses safe fallbacks:
- `businessType` null → `'other'`
- `businessProfile` null → enrichment proceeds without business context (existing behavior)
- `targetAudience` null → omitted from enrichment prompt

### TypeScript type

```typescript
// types/scan.ts
export interface BusinessContext {
  businessType: 'ecommerce' | 'saas' | 'local_business' | 'portfolio' | 'blog' | 'agency' | 'other'
  techStack: string[]
  mainCTA: string | null
  detectedService: string | null
  targetAudience: string | null
  businessProfile: string | null
}

export type ScanGoal = 'sales' | 'leads' | 'traffic' | 'visibility' | 'general'
```

---

## Scan Form

One optional field added below the URL input. Does not block scanning if skipped.

```
[ https://yoursite.com                    ]

What's your main goal? (optional)
○ More sales   ○ More leads   ○ More traffic   ○ AI visibility   ○ General
```

`scanGoal` is passed as a POST body field to `/api/scan`, stored in the `scans` table, forwarded to the Railway scanner, and passed into the enrichment call.

**Goal influence on enrichment:**
- `sales` → prioritize conversion, performance, structured data issues
- `leads` → prioritize trust signals, form accessibility, contact info
- `traffic` → prioritize SEO and AI visibility issues
- `visibility` → prioritize AI visibility (AEO/GEO) issues most heavily
- `general` → no reweighting (current behavior)

---

## AI Enrichment Changes

### vibePrompt removed

`vibePrompt`, `aiVibePrompt`, and `boltPrompt` are removed entirely from:
- `generate-evidence-enrichment.ts` output schema
- `types/scan.ts`
- Report UI
- Per-issue `IssueCard`

Only `technicalPrompt` / `aiTechnicalPrompt` / `cursorPrompt` remain.

### Enrichment prompt receives business context

The enrichment prompt is extended with:

```
Business context:
- Type: ecommerce
- Tech stack: Shopify, custom theme
- Detected service: handmade silver jewelry
- Target audience: gift buyers (heuristic)
- Main CTA: "Add to Cart"
- Scan goal: sales

Use this context to make every recommendation specific to this business.
Reference the tech stack when naming files or configuration paths.
Reference the detected service and audience when explaining business impact.
```

### technicalPrompt quality bar

The enrichment prompt sets an explicit quality bar for the technical prompt:

```
technicalPrompt rules:
- Reference specific files or config locations for the detected tech stack
- Name the concrete issue, the exact fix, and the verification step
- Format: goal → concrete fix steps (4-7 bullets) → how to verify
- Do not use generic advice like "improve your meta description"
- Example of good: "In Shopify, open product.liquid. Add JSON-LD 
  Product schema block with name, image, price, availability. 
  Verify with Google Rich Results Test."
- Example of bad: "Add product schema to improve search visibility."
```

---

## Report UI

### Business Profile block

New block at the top of the report, before the score ring.

**High confidence state:**
```
┌─────────────────────────────────────────────────────┐
│  Site identified as                                  │
│                                                      │
│  E-commerce  ·  Shopify + custom theme              │
│  Selling: handmade silver jewelry                   │
│  Audience: gift buyers                              │
│  Your goal: More sales                              │
│                                                      │
│  Recommendations below are tailored to this context. │
└─────────────────────────────────────────────────────┘
```

**Low confidence / null state:**
```
┌─────────────────────────────────────────────────────┐
│  Site type could not be determined confidently.      │
│  Recommendations are general.                        │
└─────────────────────────────────────────────────────┘
```

Heuristic fields (targetAudience) are shown with "estimated" label.

### Fix prompt block

Renamed from "Fix everything" to "Fix prompts for Cursor · Claude Code · Windsurf". Shows only `aiTechnicalPrompt`. No tool selector, no vibe variant.

---

## Repositioning

### Copy changes

| Location | Before | After |
|----------|--------|-------|
| Hero tagline | "Pre-deploy quality gate for vibe-coded apps" | "Site audits that understand your client's business." |
| Hero subtext | References vibe coding tools | "Scan any URL in minutes. Evidence-backed performance, SEO, security, and AI visibility — with fix prompts for Cursor and Claude Code." |
| Pricing — Agency tier | "For agencies" | "For teams auditing client sites" |
| Fix prompt label | "Fix everything" | "Fix prompts for Cursor · Claude Code · Windsurf" |
| Report prompt tools | "Bolt, Lovable, v0, Replit, Cursor" | "Cursor · Claude Code · Windsurf" |

### Removed language

- "vibe coders", "vibe-coded apps" — removed from all UI text, landing, and pricing
- Bolt / Lovable / v0 / Replit — removed from all prompt text and UI labels
- `vibePrompt` / `boltPrompt` field names — removed from types and code

### Pricing tier descriptions

| Tier | Description |
|------|-------------|
| Free | 3 scans/month — try it on any site |
| Pro | Unlimited scans + PDF reports + weekly monitoring — for freelancers and solo devs |
| Agency | Team seats + bulk scanning — for agencies auditing client sites (white-label PDF planned next iteration) |

PDF reports available from Pro. Agency white-label PDF branding is planned for the next iteration (Agency Report Mode).

---

## Data Model

### `scans` table

Add column: `scan_goal text` (nullable, values: `sales | leads | traffic | visibility | general`)

New migration: `010_scan_goal.sql`

### `ScanResult` type changes

```typescript
// Added
businessContext: BusinessContext | null
scanGoal: ScanGoal

// Removed
aiVibePrompt: string     // → deleted
issuePrompts per-issue boltPrompt field  // → deleted
```

---

## Quality Contract

- `techStack` and `mainCTA` are always `verified` — extracted deterministically, not inferred.
- `businessType` is `verified` when multiple strong HTML signals align; `likely` when AI-only.
- AI fields (`detectedService`, `targetAudience`, `businessProfile`) are `likely` or `heuristic`.
- If AI returns null for any field, safe fallbacks are used — never invent context.
- Enrichment prompt instructions explicitly forbid generic advice when business context is available.
- Removing vibePrompt is permanent — do not reintroduce.

---

## Out of Scope (Next Iteration)

- Executive view vs Technical view (Agency Report Mode — Approach 3)
- White-label PDF branding (Agency tier feature)
- Team seats and multi-user workflows
- User-editable business profile ("Is this correct?" flow)
- Persisted domain profiles (business context stored per domain across scans)
