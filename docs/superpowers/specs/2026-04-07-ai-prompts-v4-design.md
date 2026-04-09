# AI Prompts V4 + UX Improvements — Design Spec

**Date:** 2026-04-07
**Status:** Superseded by current evidence-grounded AI enrichment

> Historical design spec. Do not implement this document as written.
> Current implementation uses `lib/ai/generate-evidence-enrichment.ts` and `lib/checks/index.ts`, not the older `lib/ai/generate-summary.ts` flow described below.

---

## Problem

1. Per-issue "Fix with AI" prompts are static templates — too generic, not tailored to the scanned site
2. "Fix everything" block has 8 tool buttons — confusing, no clear hierarchy
3. Scan-to-report transition is abrupt (instant swap, no continuity)

---

## Solution Overview

### 1. AI-generated per-issue prompts (one expanded GPT call)

**Where:** `lib/ai/generate-summary.ts`

Expand the existing single GPT call to also return per-issue prompts. No extra API calls.

**New JSON shape:**
```json
{
  "summary": "2-3 sentence plain-English summary",
  "technicalPrompt": "Comprehensive fix prompt for Cursor/Windsurf/Claude Code/Codex",
  "vibePrompt": "Comprehensive fix prompt for Bolt/Lovable/v0/Replit/ChatGPT",
  "issuePrompts": {
    "<issue-id>": {
      "technical": "Specific fix for this issue — file paths, exact code, step-by-step",
      "vibe": "Plain-language fix for this issue — outcome-focused, no jargon"
    }
  }
}
```

GPT receives: site URL, all active issue IDs + titles + severities. It generates per-issue prompts only for issues that were found (not all 41 possible checks).

**In orchestrator (`lib/checks/index.ts`):** after receiving AI output, iterate all category issues and replace static `cursorPrompt` / `boltPrompt` with AI-generated values when available. Fallback to static template if AI didn't return a prompt for that issue.

**Type change:** `ScanResult` gets new optional field `issuePrompts?: Record<string, { technical: string; vibe: string }>` — stored in DB JSONB. `Issue.cursorPrompt` and `Issue.boltPrompt` remain as fallback.

**Cost:** ~$0.003–0.006/scan (single call, larger JSON output). Acceptable at any scale.

---

### 2. "Fix everything" — 2 tabs instead of 8 tool buttons

**Where:** `app/report/[id]/page.tsx` → `FixPromptSection` component

Replace the 8-button tool selector with two large tabs:

| Tab | Label | Tools mentioned |
|-----|-------|----------------|
| Technical | ⚡ Technical | Cursor · Windsurf · Claude Code · Codex |
| Vibe | 🎨 Vibe | Bolt · Lovable · v0 · Replit · ChatGPT |

- Active tab shows its prompt (from `aiTechnicalPrompt` or `aiVibePrompt`)
- Copy button stays
- Pro/Free paywall logic unchanged

---

### 3. Scan → Report transition (smooth completion state)

**Where:** `app/report/[id]/page.tsx` + `components/report/ReportSkeleton.tsx`

**New state:** when `scan.status === 'done'` is detected, instead of immediately rendering the report:

1. Set internal state `completing = true`
2. Pass `status="completing"` to `ReportSkeleton`
3. Skeleton shows: all 5 steps with green checkmarks, bar at 100%, text "Ready! Loading your report…"
4. After 1200ms: fade out skeleton, fade in report (`opacity-0 → opacity-100`, 400ms)

**Implementation:**
- Add `const [completing, setCompleting] = useState(false)` in report page
- In `poll()`: when `data.status === 'done'`, set `completing = true`, wait 1200ms, then stop hiding skeleton
- ReportSkeleton: add `'completing'` status case — all steps green, bar 100%, no spinner
- Report wrapper div: `transition-opacity duration-400`, starts at opacity 0, animates to 1

---

## Files Changed

| File | Change |
|------|--------|
| `lib/ai/generate-summary.ts` | Expand GPT prompt + JSON schema to include `issuePrompts` |
| `types/scan.ts` | Add `issuePrompts?` to `ScanResult` |
| `lib/checks/index.ts` | Apply AI issue prompts to each issue after generation |
| `app/report/[id]/page.tsx` | Rewrite `FixPromptSection` (2 tabs), add completion delay logic |
| `components/report/ReportSkeleton.tsx` | Add `completing` status case |

---

## Out of Scope

- Email alerts (separate session)
- PDF improvements
- Per-category AI prompts (future v2)
