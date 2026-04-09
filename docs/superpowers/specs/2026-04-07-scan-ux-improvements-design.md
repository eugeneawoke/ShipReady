# Scan UX Improvements

**Date:** 2026-04-07
**Status:** Implemented / superseded
**Scope:** `components/report/ReportSkeleton.tsx` + `components/landing/ScanForm.tsx` (read-only reuse)

> Historical design spec. The current `ReportSkeleton` implementation already includes the scan timer, inline retry form, navigation guard, completing state, and stalled scan messaging. Keep this file for history; use live code plus `docs/project-spec.md` for current behavior.

---

## Overview

Three independent UX improvements to the scan waiting screen (`ReportSkeleton`). All changes land in a single file. No new components, no new hooks.

---

## Feature 1 — Real-time scan timer

### What
A live elapsed-time counter displayed prominently in the scan skeleton header, showing how long the current scan has been running.

### Visual placement
Top-right of the header row, inline with "Analyzing your site...":

```
Analyzing your site...                    12.4s
━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Usually takes 20–40 seconds
```

The `12` is large (22px, monospace, `#6E56CF`). The `.4s` suffix is smaller (14px, `#5A5955`).

### Behavior
- Starts at `0.0s` when skeleton mounts (scanning state).
- Updates every 100ms via `setInterval`.
- **On scan complete:** interval clears, timer freezes at the final value and stays visible through the `completing` state.
- **On scan error:** timer freezes and the line reads `Failed after 23.1s` (text color `#FF4444`).
- Does not render in the `completing` state header (already replaced by "✓ Scan complete!").
- Implemented via `useState<number>(0)` + `useEffect` with `setInterval(fn, 100)`.

---

## Feature 2 — Inline URL input on error (reuse ScanForm)

### What
Replace the `← Try another URL` anchor (which redirects to `/`) with the existing `<ScanForm />` component rendered inline. No navigation away from the error page.

### Error state layout
```
Scan failed
Something went wrong while analyzing your site.

[ ScanForm — full input + button + its own error handling ]
```

### Details
- Remove the contact links (`Telegram · Email`) from the `ReportSkeleton` error state — `ScanForm` already shows them conditionally on submit failure.
- The `Back` link in the top-left corner remains unchanged.
- `ScanForm` already handles the full flow: POST `/api/scan` → redirect to `/report/[id]`.
- Import: `import { ScanForm } from '@/components/landing/ScanForm'`.

---

## Feature 3 — Navigation interruption warning

### 3a — Inline warning text (passive)
During scanning, show a single warning line below the steps list:

```
⚠  Closing or going back will interrupt the analysis and count against your monthly limit.
```

- Icon `⚠` color: `#E8A83E`
- Text color: `#5A5955`, font-size `11px`
- Shown only in `pending` / `running` states. Hidden in `completing` and `error`.

### 3b — Custom modal (active, for Back link + browser back button)

Triggered by:
1. Click on the "Back" `<a>` link in the top-left of the skeleton — convert to a `<button>` with `onClick` that opens the modal instead of navigating.
2. Browser back button — intercepted via `window.history.pushState(null, '', window.location.href)` + `popstate` listener on mount. When `popstate` fires, re-push the state and open the modal.

Modal content:
```
Interrupt scan?

This will count as one of your scans for this month,
even if the results aren't ready.

[ Keep scanning ]   [ Leave anyway ]
```

- Overlay: `bg-[#0E0E0F]/85 backdrop-blur-sm`, covers full screen, `z-50`.
- Modal card: `bg-[#161618]`, `border border-white/8`, `rounded-xl`, `max-w-[300px]`, centered.
- "Keep scanning": ghost button (`border border-white/8`, text `#8B8A85`). Closes modal, scan continues.
- "Leave anyway": destructive button (`bg-[#2A1A1A] border border-red-500/20`, text `#FF6B6B`). Calls `router.push('/')` (or `window.history.back()` won't work after pushState trick — use `router.push('/')`).
- Modal state: `useState<boolean>(false)` — `isLeaveModalOpen`.

### 3c — Tab close / page refresh (native browser dialog)
```ts
window.addEventListener('beforeunload', (e) => {
  e.preventDefault()
  e.returnValue = '' // triggers browser's native "Leave site?" dialog
})
```
Note: modern browsers (Chrome, Firefox, Safari) ignore custom text in `returnValue` and show their own generic message. This is a browser limitation — not configurable.

The listener is added in `useEffect` and cleaned up on unmount (when scan is done or component is destroyed).

### Cleanup
All three listeners (`setInterval` timer, `popstate`, `beforeunload`) must be cleaned up in the `useEffect` return function to avoid leaks.

---

## Implementation scope

| File | Change |
|------|--------|
| `components/report/ReportSkeleton.tsx` | All three features |
| `components/landing/ScanForm.tsx` | No changes — imported as-is |

---

## State added to ReportSkeleton

```ts
const [elapsed, setElapsed] = useState(0)        // Feature 1 — counts 100ms ticks; display as (elapsed / 10).toFixed(1) + 's'
const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)  // Feature 3b
```

---

## Non-goals

- No server-side scan cancellation when user leaves — scan runs to completion regardless.
- No changes to the `completing` state UI beyond freezing the timer.
- No changes to the report page itself (`app/report/[id]/page.tsx`).
