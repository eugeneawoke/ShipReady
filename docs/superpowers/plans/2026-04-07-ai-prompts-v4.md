# AI Prompts V4 + UX Improvements Implementation Plan

> **Status: obsolete.** This plan has been superseded by the current evidence-grounded AI enrichment flow in `lib/ai/generate-evidence-enrichment.ts` and `lib/checks/index.ts`. Do not implement this plan as written: it references an older Next.js version and an older `generate-summary.ts` path that is no longer the active scan-time GPT integration.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static per-issue prompts with AI-generated ones (single GPT call), simplify "Fix everything" to 2 tabs, and add a smooth completion transition between scan and report.

**Architecture:** One expanded GPT call generates summary + 2 global prompts + per-issue prompts keyed by issue ID. The orchestrator merges AI prompts back into each Issue object. The report page detects scan completion and shows a 1.2s "completing" state before rendering the report.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · OpenAI gpt-4o-mini · Tailwind CSS

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `types/scan.ts` | Modify | Add `issuePrompts?` field to `ScanResult` |
| `lib/ai/generate-summary.ts` | Modify | Expand GPT prompt + return `issuePrompts` |
| `lib/checks/index.ts` | Modify | Apply AI issue prompts back to each Issue |
| `app/report/[id]/page.tsx` | Modify | Rewrite `FixPromptSection` (2 tabs) + completing state |
| `components/report/ReportSkeleton.tsx` | Modify | Add `completing` status case |

---

## Task 1: Add `issuePrompts` to ScanResult type

**Files:**
- Modify: `types/scan.ts`

- [ ] **Step 1: Add the field**

Open `types/scan.ts` and add `issuePrompts` to `ScanResult`:

```typescript
export interface ScanResult {
  url: string;
  scannedAt: string;
  totalScore: number;
  performance: CategoryScore;
  seo: CategoryScore;
  security: CategoryScore;
  mobile: CategoryScore;
  ai_visibility: CategoryScore;
  aiSummary?: string;
  aiTechnicalPrompt?: string;
  aiVibePrompt?: string;
  issuePrompts?: Record<string, { technical: string; vibe: string }>;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/scan.ts
git commit -m "feat(types): add issuePrompts to ScanResult"
```

---

## Task 2: Expand generateAISummary to return per-issue prompts

**Files:**
- Modify: `lib/ai/generate-summary.ts`

- [ ] **Step 1: Update the AIOutput interface and function**

Replace the entire `lib/ai/generate-summary.ts` with:

```typescript
import OpenAI from 'openai'
import type { ScanResult, Issue } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

interface IssuePrompt {
  technical: string
  vibe: string
}

interface AIOutput {
  summary: string
  technicalPrompt: string
  vibePrompt: string
  issuePrompts: Record<string, IssuePrompt>
}

export async function generateAISummary(result: ScanResult): Promise<AIOutput> {
  const client = new OpenAI()

  const allIssues = getAllIssues(result)
  const activeIssues = allIssues.filter((i: Issue) => i.severity !== 'pass')
  const critical = activeIssues.filter((i: Issue) => i.severity === 'critical').length
  const high = activeIssues.filter((i: Issue) => i.severity === 'high').length

  const issueList = activeIssues
    .slice(0, 20)
    .map((i: Issue) => `- [${i.severity.toUpperCase()}] ${i.id}: ${i.title}${i.value ? ` (${i.value})` : ''}`)
    .join('\n')

  const issueIds = activeIssues.slice(0, 20).map((i: Issue) => i.id)

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 3000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You are a web quality expert helping indie hackers fix their sites. Analyze this audit and return a JSON object.

URL: ${result.url}
Score: ${result.totalScore}/100
Critical: ${critical}, High: ${high}
Performance: ${result.performance.score} | SEO: ${result.seo.score} | Security: ${result.security.score} | Mobile: ${result.mobile.score} | AI Visibility: ${result.ai_visibility.score}

Issues found:
${issueList || 'No issues — site looks great!'}

Return EXACTLY this JSON (no extra fields):
{
  "summary": "2-3 sentence plain-English summary for a non-technical indie hacker. No jargon. Direct, not scary. If score > 70, end with encouragement.",
  "technicalPrompt": "A ready-to-paste prompt for code-aware AI tools (Cursor, Windsurf, Claude Code, Codex). Must reference URL ${result.url}. Include specific file paths (app/layout.tsx, next.config.js, etc), exact HTTP headers to add, meta tags to insert. Step-by-step instructions for an AI that has full codebase access. Cover ALL issues found.",
  "vibePrompt": "A ready-to-paste prompt for no-code AI builders (Bolt, Lovable, v0, Replit, ChatGPT). Must reference URL ${result.url}. High-level and outcome-focused. No file paths. Plain language. Cover ALL issues found.",
  "issuePrompts": {
    ${issueIds.map(id => `"${id}": { "technical": "...", "vibe": "..." }`).join(',\n    ')}
  }
}

For each issuePrompts entry:
- "technical": 2-5 step fix for this SPECIFIC issue for Cursor/Windsurf/Claude Code/Codex. Reference exact file paths and code. Be direct and actionable.
- "vibe": 1-3 sentence plain-language fix for this SPECIFIC issue for Bolt/Lovable/v0. No file paths. Focus on what to add/change and why.`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw)
    return {
      summary: parsed.summary ?? '',
      technicalPrompt: parsed.technicalPrompt ?? '',
      vibePrompt: parsed.vibePrompt ?? '',
      issuePrompts: parsed.issuePrompts ?? {},
    }
  } catch {
    return { summary: raw, technicalPrompt: '', vibePrompt: '', issuePrompts: {} }
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/ai/generate-summary.ts
git commit -m "feat(ai): expand GPT call to return per-issue prompts in one request"
```

---

## Task 3: Apply AI issue prompts in orchestrator

**Files:**
- Modify: `lib/checks/index.ts`

- [ ] **Step 1: Merge AI prompts into each Issue after generation**

In `lib/checks/index.ts`, find the block:

```typescript
if (process.env.OPENAI_API_KEY) {
  try {
    const ai = await generateAISummary(result)
    result.aiSummary = ai.summary
    result.aiTechnicalPrompt = ai.technicalPrompt
    result.aiVibePrompt = ai.vibePrompt
  } catch (e) {
    console.error('[checks] AI summary failed:', e)
  }
}
```

Replace it with:

```typescript
if (process.env.OPENAI_API_KEY) {
  try {
    const ai = await generateAISummary(result)
    result.aiSummary = ai.summary
    result.aiTechnicalPrompt = ai.technicalPrompt
    result.aiVibePrompt = ai.vibePrompt
    result.issuePrompts = ai.issuePrompts

    // Upgrade static per-issue prompts with AI-generated ones
    const categories = ['performance', 'seo', 'security', 'mobile', 'ai_visibility'] as const
    for (const cat of categories) {
      result[cat].issues = result[cat].issues.map(issue => {
        const aiPrompt = ai.issuePrompts?.[issue.id]
        if (!aiPrompt) return issue
        return {
          ...issue,
          cursorPrompt: aiPrompt.technical || issue.cursorPrompt,
          boltPrompt: aiPrompt.vibe || issue.boltPrompt,
        }
      })
    }
  } catch (e) {
    console.error('[checks] AI summary failed:', e)
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/checks/index.ts
git commit -m "feat(checks): apply AI per-issue prompts to Issue objects after generation"
```

---

## Task 4: Rewrite FixPromptSection — 2 tabs

**Files:**
- Modify: `app/report/[id]/page.tsx` (the `FixPromptSection` component defined inline)

- [ ] **Step 1: Replace FixPromptSection and the AI_TOOLS constant**

Find and replace the `AI_TOOLS` array and the entire `FixPromptSection` function in `app/report/[id]/page.tsx`:

Remove:
```typescript
const AI_TOOLS = [
  { id: 'cursor',   label: 'Cursor',   type: 'technical' as const },
  { id: 'windsurf', label: 'Windsurf', type: 'technical' as const },
  { id: 'claude',   label: 'Claude',   type: 'technical' as const },
  { id: 'bolt',     label: 'Bolt',     type: 'vibe' as const },
  { id: 'lovable',  label: 'Lovable',  type: 'vibe' as const },
  { id: 'v0',       label: 'v0',       type: 'vibe' as const },
  { id: 'replit',   label: 'Replit',   type: 'vibe' as const },
  { id: 'openai',   label: 'ChatGPT',  type: 'vibe' as const },
]
```

Replace with:

```typescript
const FIX_TABS = [
  {
    id: 'technical' as const,
    label: 'Technical',
    subtitle: 'Cursor · Windsurf · Claude Code · Codex',
  },
  {
    id: 'vibe' as const,
    label: 'Vibe',
    subtitle: 'Bolt · Lovable · v0 · Replit · ChatGPT',
  },
]
```

Then replace the entire `FixPromptSection` function with:

```typescript
function FixPromptSection({ technicalPrompt, vibePrompt, isPro }: {
  technicalPrompt?: string
  vibePrompt?: string
  isPro: boolean
}) {
  const [activeTab, setActiveTab] = useState<'technical' | 'vibe'>('technical')
  const [copied, setCopied] = useState(false)

  const prompt = activeTab === 'technical'
    ? (technicalPrompt ?? vibePrompt ?? '')
    : (vibePrompt ?? technicalPrompt ?? '')

  const hasPrompt = !!(technicalPrompt || vibePrompt)

  function copy() {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-[#161618] border border-white/6 overflow-hidden">
      {/* 2 big tabs */}
      <div className="grid grid-cols-2 border-b border-white/6">
        {FIX_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-left transition-colors cursor-pointer relative ${
              activeTab === tab.id ? 'bg-[#1A1625]' : 'hover:bg-white/[0.02]'
            }`}
          >
            <span className={`text-sm font-medium block ${
              activeTab === tab.id ? 'text-[#F1F0EE]' : 'text-[#5A5955]'
            }`}>
              {tab.label}
            </span>
            <span className="text-[11px] text-[#5A5955] mt-0.5 block">{tab.subtitle}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6E56CF]" />
            )}
          </button>
        ))}
      </div>

      {/* Prompt content */}
      <div className="p-4">
        {!hasPrompt ? (
          <div className="text-xs text-[#5A5955] bg-[#1E1E21] rounded-lg p-3 text-center">
            AI prompt not available for this scan
          </div>
        ) : isPro ? (
          <>
            <pre className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-56">
              {prompt}
            </pre>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors mt-2 cursor-pointer"
            >
              {copied
                ? <><Check className="w-3 h-3 text-[#3DDC84]" /><span className="text-[#3DDC84]">Copied</span></>
                : <><Copy className="w-3 h-3" />Copy prompt</>
              }
            </button>
          </>
        ) : (
          <div className="relative">
            <pre
              className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-56 select-none"
              style={{ filter: 'blur(5px)', userSelect: 'none' }}
            >
              {prompt}
            </pre>
            <div className="absolute inset-0 flex items-center justify-center bg-[#0E0E0F]/60 rounded-lg backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-2">
                <Lock className="w-4 h-4 text-[#8B8A85]" />
                <a
                  href="/pricing"
                  className="text-xs text-white bg-[#6E56CF] hover:bg-[#7C68D4] px-3 py-1.5 rounded-md transition-colors"
                >
                  Upgrade to Pro →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/report/[id]/page.tsx'
git commit -m "feat(report): replace 8-tool selector with 2-tab FixPromptSection (Technical/Vibe)"
```

---

## Task 5: Smooth scan → report transition

**Files:**
- Modify: `app/report/[id]/page.tsx`
- Modify: `components/report/ReportSkeleton.tsx`

- [ ] **Step 1: Add `completing` state to report page**

In `app/report/[id]/page.tsx`, add state after existing state declarations:

```typescript
const [completing, setCompleting] = useState(false)
const [reportVisible, setReportVisible] = useState(false)
```

- [ ] **Step 2: Update the poll function to trigger completion state**

Inside the `poll()` function, find:

```typescript
if (data.status === 'done' || data.status === 'error') {
  clearInterval(interval)
  clearTimeout(timeout)
}
```

Replace with:

```typescript
if (data.status === 'done' || data.status === 'error') {
  clearInterval(interval)
  clearTimeout(timeout)
  if (data.status === 'done') {
    setCompleting(true)
    setTimeout(() => {
      setCompleting(false)
      // Small delay then fade in the report
      setTimeout(() => setReportVisible(true), 50)
    }, 1200)
  } else {
    setReportVisible(true)
  }
}
```

- [ ] **Step 3: Update skeleton render condition**

Find:

```typescript
if (!scan || scan.status === 'pending' || scan.status === 'running') {
  return <ReportSkeleton status={scan?.status ?? 'pending'} />
}
```

Replace with:

```typescript
if (!scan || scan.status === 'pending' || scan.status === 'running' || completing) {
  return <ReportSkeleton status={completing ? 'completing' : (scan?.status ?? 'pending')} />
}
```

- [ ] **Step 4: Wrap report in fade-in div**

Find the report's outermost div:

```typescript
return (
  <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
```

Replace with:

```typescript
return (
  <div
    className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] transition-opacity duration-500"
    style={{ opacity: reportVisible ? 1 : 0 }}
  >
```

- [ ] **Step 5: Add `completing` status to ReportSkeleton**

In `components/report/ReportSkeleton.tsx`, find the render condition for error state at the top of the non-error JSX branch. Currently the component renders the animated skeleton for any non-error status. Add a `completing` case BEFORE the `return` for the animated skeleton:

```typescript
export function ReportSkeleton({ status }: { status: string }) {
  // ... existing state ...

  // Completing state — all done, bar at 100%, brief moment before report
  if (status === 'completing') {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center transition-opacity duration-500">
        <div className="max-w-sm w-full px-6">
          <div className="mb-8">
            <p className="text-sm text-[#3DDC84] mb-3">✓ Scan complete!</p>
            <div className="h-[3px] bg-[#1E1E21] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #6E56CF, #4A9EFF)',
                  transition: 'width 0.4s ease-out',
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[#5A5955]">Loading your report…</p>
          </div>
          <div className="space-y-2">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                style={{
                  background: '#161618',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3DDC84]" />
                <span className="text-sm text-[#5A5955]">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ... rest of existing component (error state + animated skeleton) ...
```

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add 'app/report/[id]/page.tsx' components/report/ReportSkeleton.tsx
git commit -m "feat(scan): smooth completing transition — 1.2s all-done state before report fade-in"
```

---

## Self-Review

**Spec coverage:**
- ✅ AI per-issue prompts in one GPT call (Tasks 2, 3)
- ✅ `issuePrompts` type field (Task 1)
- ✅ Static prompts upgraded with AI output, fallback preserved (Task 3)
- ✅ Fix everything → 2 tabs: Technical (Cursor/Windsurf/Claude Code/Codex) / Vibe (Bolt/Lovable/v0/Replit/ChatGPT) (Task 4)
- ✅ Completion transition 1.2s + fade-in (Task 5)

**Placeholder scan:** No TBD/TODO. All code blocks are complete.

**Type consistency:**
- `FIX_TABS` defined in Task 4, used in same Task ✅
- `IssuePrompt` / `AIOutput` defined in Task 2, consumed in Task 3 ✅
- `completing` / `reportVisible` defined in Task 5 Step 1, used in Steps 2-4 ✅
- `'completing'` string literal passed from report page (Task 5 Step 3), handled in ReportSkeleton (Task 5 Step 5) ✅
