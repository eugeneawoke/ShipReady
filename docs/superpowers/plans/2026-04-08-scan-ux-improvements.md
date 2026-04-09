# Scan UX Improvements Implementation Plan

> **Status: implemented / superseded.** The core UX changes from this plan are already present in `components/report/ReportSkeleton.tsx`: elapsed timer, inline retry form, navigation interruption guard, completing state, and stalled-scan messaging. Keep this file for history only; do not implement it task-by-task as written because it references older React/Next.js assumptions.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time elapsed timer, inline URL recovery on error, and a navigation interruption guard to the scan waiting screen.

**Architecture:** All changes land in `components/report/ReportSkeleton.tsx`. Two new state variables (`elapsed`, `isLeaveModalOpen`), two new `useEffect` hooks (timer, navigation guard), and adjusted JSX for each render branch. `ScanForm` is imported as-is from `components/landing/ScanForm.tsx` — no changes to that file.

**Original Tech Stack Assumption:** React 18, Next.js 14 App Router (`useRouter`), Tailwind CSS inline styles. Current app uses React 19 and Next.js 16; use live code as source of truth.

---

## File Map

| File | Action |
|------|--------|
| `components/report/ReportSkeleton.tsx` | Modify — all three features |
| `components/landing/ScanForm.tsx` | Read-only — import as-is |

---

## Task 1 — Real-time elapsed timer (state + interval)

**Files:**
- Modify: `components/report/ReportSkeleton.tsx`

- [ ] **Step 1: Add `elapsed` state and timer `useEffect`**

Open `components/report/ReportSkeleton.tsx`. After the existing state declarations (after `const [barWidth, setBarWidth] = useState(3)`), add:

```tsx
const [elapsed, setElapsed] = useState(0) // counts 100ms ticks
```

Then add a new `useEffect` directly after the existing one:

```tsx
useEffect(() => {
  // Only tick during active scanning states
  if (status === 'error' || status === 'completing') return

  const timerInterval = setInterval(() => {
    setElapsed(prev => prev + 1)
  }, 100)

  return () => clearInterval(timerInterval)
}, [status])
```

When `status` changes to `'completing'` or `'error'`, the effect re-runs, skips creating a new interval, and `elapsed` stays frozen at its last value.

- [ ] **Step 2: Add timer display to the scanning state header**

Find the scanning state header block — currently:
```tsx
<div className="mb-8">
  <p className="text-sm text-[#8B8A85] mb-3">Analyzing your site...</p>
  <div className="h-[3px] bg-[#1E1E21] ...">
```

Replace the `<p>` line with a flex row that puts "Analyzing your site..." on the left and the live timer on the right:

```tsx
<div className="mb-8">
  <div className="flex items-baseline justify-between mb-3">
    <p className="text-sm text-[#8B8A85]">Analyzing your site...</p>
    <p className="font-mono leading-none">
      <span style={{ fontSize: 22, color: '#6E56CF', fontWeight: 600 }}>
        {Math.floor(elapsed / 10)}
      </span>
      <span style={{ fontSize: 14, color: '#5A5955' }}>
        .{elapsed % 10}s
      </span>
    </p>
  </div>
  <div className="h-[3px] bg-[#1E1E21] ...">
```

- [ ] **Step 3: Show frozen timer in the error state**

Find the error state JSX block (the `if (status === 'error')` branch). After:
```tsx
<p className="text-sm font-medium text-[#FF4444]">Scan failed</p>
```

Add:
```tsx
{elapsed > 0 && (
  <p className="text-xs font-mono" style={{ color: '#FF4444' }}>
    Failed after {Math.floor(elapsed / 10)}.{elapsed % 10}s
  </p>
)}
```

- [ ] **Step 4: Verify in dev server**

```bash
npm run dev
```

Open `http://localhost:3000` and scan any URL. Confirm:
- Timer starts at `0.0s` and ticks up in 0.1s increments
- Large purple number, small grey `.Xs` suffix
- Timer freezes when scan completes
- Timer freezes and shows "Failed after X.Xs" in red if scan errors

- [ ] **Step 5: Commit**

```bash
git add components/report/ReportSkeleton.tsx
git commit -m "feat: add real-time elapsed timer to scan skeleton"
```

---

## Task 2 — Inline ScanForm on error (replace redirect link)

**Files:**
- Modify: `components/report/ReportSkeleton.tsx`

- [ ] **Step 1: Add the ScanForm import**

At the top of `components/report/ReportSkeleton.tsx`, after the existing imports, add:

```tsx
import { ScanForm } from '@/components/landing/ScanForm'
```

- [ ] **Step 2: Replace error state bottom section**

In the error state JSX, find and remove these two elements:
```tsx
<p className="text-xs text-[#5A5955]">
  Try again or contact me:{' '}
  <a href="https://t.me/eugenegusakov" ...>Telegram</a>
  {' '}·{' '}
  <a href="mailto:egusakov74@gmail.com" ...>Email</a>
</p>
<a href="/" className="inline-block mt-2 text-xs px-4 py-2 rounded-lg bg-[#161618] border border-white/6 text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">
  ← Try another URL
</a>
```

Replace with:
```tsx
<div className="mt-4 w-full max-w-md mx-auto">
  <ScanForm />
</div>
```

`ScanForm` internally handles its own error messages and contact links when a submit fails, so there's no duplication.

- [ ] **Step 3: Verify in dev server**

Trigger an error state — easiest way: in `page.tsx` temporarily pass `status="error"` to `<ReportSkeleton>`, OR wait for a real scan failure. Confirm:
- The error screen shows "Scan failed" + "Something went wrong..." + the full ScanForm (input + button)
- Submitting a URL from the error screen starts a new scan and navigates to the new report
- No "Try another URL" redirect link exists

- [ ] **Step 4: Commit**

```bash
git add components/report/ReportSkeleton.tsx
git commit -m "feat: inline ScanForm on error state, remove redirect to homepage"
```

---

## Task 3 — Navigation warning text (passive, Feature 3a)

**Files:**
- Modify: `components/report/ReportSkeleton.tsx`

- [ ] **Step 1: Add warning text below the steps list in the scanning state**

In the scanning state JSX, find the steps `<div className="space-y-2">` block. After its closing `</div>`, add:

```tsx
<p className="mt-6 text-[11px] text-[#5A5955] flex items-start gap-1.5">
  <span style={{ color: '#E8A83E', fontSize: 13, lineHeight: 1.4 }}>⚠</span>
  Closing or going back will interrupt the analysis and count against your monthly limit.
</p>
```

This is shown only in the scanning state render branch (`pending`/`running`), so it's automatically hidden in `completing` and `error`.

- [ ] **Step 2: Verify in dev server**

Start a scan. Confirm the warning line appears below the step list during scanning. Confirm it's absent in the "✓ Scan complete!" screen and error screen.

- [ ] **Step 3: Commit**

```bash
git add components/report/ReportSkeleton.tsx
git commit -m "feat: show interruption warning text during scan"
```

---

## Task 4 — Navigation guard: modal + Back button + browser back + beforeunload (Feature 3b+c)

**Files:**
- Modify: `components/report/ReportSkeleton.tsx`

- [ ] **Step 1: Add `useRouter` import and `isLeaveModalOpen` state**

At the top of the file, add `useRouter` to the next/navigation import (or add the import if missing):

```tsx
import { useRouter } from 'next/navigation'
```

Inside the component, after `const [elapsed, setElapsed] = useState(0)`, add:

```tsx
const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
const router = useRouter()
```

- [ ] **Step 2: Add navigation guard `useEffect`**

Add a new `useEffect` after the timer effect. This installs `popstate` and `beforeunload` guards only during active scanning, and cleans them up when done:

```tsx
useEffect(() => {
  // Only guard during active scanning states
  if (status === 'error' || status === 'completing') return

  // Push a dummy history entry so the back button fires popstate
  // instead of navigating away immediately
  window.history.pushState(null, '', window.location.href)

  function handlePopState() {
    // Re-push so repeated back presses keep showing the modal
    window.history.pushState(null, '', window.location.href)
    setIsLeaveModalOpen(true)
  }

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    e.preventDefault()
    e.returnValue = '' // triggers browser's native "Leave site?" dialog
    // Note: modern browsers ignore the custom text and show their own message
  }

  window.addEventListener('popstate', handlePopState)
  window.addEventListener('beforeunload', handleBeforeUnload)

  return () => {
    window.removeEventListener('popstate', handlePopState)
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}, [status])
```

- [ ] **Step 3: Convert the "Back" `<a>` to a `<button>` in the scanning state**

In the scanning state render, find the top-left Back link:
```tsx
<a
  href="/"
  className="fixed top-4 left-4 text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors flex items-center gap-1.5"
>
  <svg .../>
  Back
</a>
```

Replace with a `<button>` that opens the modal:
```tsx
<button
  onClick={() => setIsLeaveModalOpen(true)}
  className="fixed top-4 left-4 text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
  Back
</button>
```

- [ ] **Step 4: Add the modal overlay JSX**

Inside the scanning state's top-level `<div>`, after the main content `<div className="max-w-sm ...">`, add the modal. It renders conditionally over the entire screen:

```tsx
{isLeaveModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ background: 'rgba(14,14,15,0.85)', backdropFilter: 'blur(4px)' }}
  >
    <div
      className="w-full max-w-[300px] mx-4 rounded-xl p-6 text-center"
      style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-sm font-medium text-[#F1F0EE] mb-2">Interrupt scan?</p>
      <p className="text-xs text-[#8B8A85] leading-relaxed mb-6">
        This will count as one of your scans for this month, even if the results aren't ready.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setIsLeaveModalOpen(false)}
          className="flex-1 py-2 rounded-lg text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors cursor-pointer"
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Keep scanning
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex-1 py-2 rounded-lg text-xs cursor-pointer transition-colors"
          style={{
            background: '#2A1A1A',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#FF6B6B',
          }}
        >
          Leave anyway
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify in dev server**

Start a scan and test all four scenarios:

1. **Back button (our UI):** Click the "Back" button top-left → modal appears → "Keep scanning" dismisses it → scan continues. Click "Leave anyway" → navigates to `/`.
2. **Browser back:** Press the browser's ← back button → modal appears (not a browser redirect). Same modal behaviour.
3. **Tab close / refresh:** Press Cmd+W or F5 → browser shows native "Leave site?" dialog (Chrome/Firefox default text — custom text not supported by browsers).
4. **Scan completes normally:** All guards removed, no modal on subsequent navigation.

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors. If `BeforeUnloadEvent` is not found, the project already has `lib.dom` in `tsconfig.json` — it's always available in browser TypeScript.

- [ ] **Step 7: Commit**

```bash
git add components/report/ReportSkeleton.tsx
git commit -m "feat: navigation guard with custom modal and beforeunload during scan"
```

---

## Task 5 — Final check

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors. Common ones to watch for: `react-hooks/exhaustive-deps` warning on the navigation guard effect (if ESLint flags `status` as a missing dep — it's already in the deps array so this should be clean).

- [ ] **Step 2: Full end-to-end smoke test**

Run `npm run dev` and perform a full scan of a real URL. Verify all three features work together:
- [ ] Timer ticks from `0.0s`, freezes on complete, shows "Failed after X.Xs" in red on error
- [ ] Error state shows `<ScanForm />` inline — submitting starts a new scan
- [ ] Warning text visible below steps during scan, absent in completing/error
- [ ] Back button (our UI) → modal → keep or leave
- [ ] Browser back → modal → keep or leave
- [ ] Cmd+W / F5 → browser native dialog

- [ ] **Step 3: Final commit**

```bash
git add components/report/ReportSkeleton.tsx
git commit -m "chore: scan UX improvements complete — timer, inline error form, nav guard"
```
