# ShipReady — SEO Action Plan

**Based on:** Full SEO Audit 2026-04-27  
**Current score:** 54/100  
**Target score:** 75/100 (after all High priority items)

---

## 🔴 Critical — Fix Immediately (total effort: ~2 hours)

### 1. Remove trailing slash from `NEXT_PUBLIC_APP_URL` on Vercel (5 min)
**Impact:** Fixes robots.txt, sitemap, canonical tags, schema logo URL, llms.txt — simultaneously.

**Step 1:** In Vercel dashboard → Settings → Environment Variables:  
Change `NEXT_PUBLIC_APP_URL` from `https://ship-ready.vercel.app/` to `https://ship-ready.vercel.app`

**Step 2:** Add guard in code (belt-and-suspenders):
```ts
// app/sitemap.ts and app/robots.ts — top of file
const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')
```

**Step 3:** Same fix for schema logo in `app/layout.tsx`:
```ts
// line ~63
logo: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')}/logo.svg`,
```

---

### 2. Update `llms.txt` to agency/developer audience (1 hour)
**Impact:** Every AI-generated ShipReady brand summary currently says "vibe coders." This is the primary AI-brand-perception fix.

**File:** `public/llms.txt`

**Recommended replacement:**
```
# ShipReady

> ShipReady is a pre-deploy site audit tool for web agencies and developers.
> Scan any URL to get evidence-backed findings across performance, SEO, security,
> mobile readiness, and AI visibility — with actionable fix prompts for Cursor,
> Claude Code, and Windsurf.

## Description

ShipReady runs 35+ automated checks across five audit categories and produces
a structured report with evidence-grounded confidence ratings: verified
(deterministic from HTTP/HTML signals), likely (AI inference from clear signals),
and heuristic (AI inference from ambiguous signals). Every finding includes the
specific signal that triggered it, eliminating guesswork.

The scan runs in two phases: a Fast Truth Pass (< 30 seconds) covering security
headers, meta tags, robots.txt, and sitemap validity, followed by a Deep Pass
using Lighthouse and AI enrichment to generate business-context-aware
recommendations. Fix prompts are specific to the detected tech stack — a
Shopify store gets Liquid file references; a Next.js app gets component-level
instructions.

Primary audience: small web/dev agencies (1–15 people) who audit client sites
before delivery. Secondary audience: SEO and marketing agencies adding AI
visibility audits to their service offering.

## Author

Eugene Gusakov — https://ship-ready.vercel.app

## Key concepts

- Verified / likely / heuristic confidence model
- Fast Truth Pass (< 30s) + Deep Pass (Lighthouse + AI)
- Business Context Engine — auto-detects stack, business type, CTA
- Evidence-backed findings (no invented issues)
- Fix prompts scoped to detected tech stack

## FAQ

Q: What does ShipReady check?
A: Performance (Lighthouse LCP/CLS/INP/FCP), SEO (titles, meta, canonicals,
sitemap, robots.txt), security (HTTP headers: HSTS, CSP, X-Frame-Options),
mobile readiness (viewport, tap targets, font sizes), and AI visibility
(llms.txt, AI crawler access, FAQ schema, author entity, structured data).

Q: How long does a scan take?
A: Initial findings appear in under 30 seconds (Fast Truth Pass). The full
report with Lighthouse scores and AI fix prompts takes 1–3 minutes.

Q: What are "verified", "likely", and "heuristic" findings?
A: Verified findings are extracted directly from HTTP responses or HTML
without inference. Likely findings use AI with clear supporting signals.
Heuristic findings are AI inference from ambiguous signals. Only verified
findings affect the score.

Q: Who is this for?
A: Web/dev agencies auditing client sites before delivery, freelance developers
doing pre-launch quality checks, and SEO agencies adding AI visibility to their
offering.

Q: What AI tools are the fix prompts designed for?
A: Cursor, Claude Code, and Windsurf. Prompts reference specific files and
configuration paths for the detected tech stack.

## Pages

- https://ship-ready.vercel.app/ — Homepage, run a scan
- https://ship-ready.vercel.app/pricing — Pricing plans
- https://ship-ready.vercel.app/roadmap — Product roadmap
```

---

### 3. Add noindex to report and dashboard pages (10 min)
**File:** `app/report/[id]/page.tsx`
```ts
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

**File:** `app/dashboard/page.tsx`
```ts
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

**File:** `next.config.ts` — add response headers:
```ts
async headers() {
  return [
    {
      source: '/report/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
    {
      source: '/dashboard/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ]
},
```

---

## 🟠 High Priority — Fix This Week (total effort: ~1 day)

### 4. Add OG image (30 min)
Create `public/og.png` at 1200×630px with ShipReady branding and score preview.

**File:** `app/layout.tsx`
```ts
openGraph: {
  // ... existing fields
  images: [{ url: '/og.png', width: 1200, height: 630, alt: 'ShipReady — Site audits that understand your client\'s business' }],
},
twitter: {
  card: 'summary_large_image',
  images: ['/og.png'],
},
```

---

### 5. Write meta description for homepage (10 min)
**File:** `app/layout.tsx` — ensure `description` is set:
```ts
description: 'ShipReady runs 35+ automated checks — performance, SEO, security, mobile, and AI visibility — and generates fix prompts for Cursor, Claude Code, and Windsurf. No signup required.',
```
Add to `metadataBase`-derived pages. Also add to `messages/en.ts` and `messages/ru.ts`.

---

### 6. Fix WebApplication schema (30 min)
**File:** `app/layout.tsx`

Replace the `WebApplication` JSON-LD block with:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ShipReady",
  "url": "https://ship-ready.vercel.app",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Site audits that understand your client's business. 35+ automated checks across performance, SEO, security, mobile, and AI visibility.",
  "featureList": [
    "Lighthouse performance audit",
    "SEO metadata and structured data check",
    "HTTP security header scan",
    "Mobile readiness audit",
    "AI visibility check (llms.txt, FAQ schema, author entity)",
    "Evidence-based verified/likely/heuristic confidence model",
    "AI fix prompts for Cursor, Claude Code, Windsurf"
  ],
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "USD",
      "description": "3 scans per month. All category scores and issue descriptions."
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "14",
      "priceCurrency": "USD",
      "description": "Unlimited scans, AI fix prompts, PDF export, weekly monitoring."
    },
    {
      "@type": "Offer",
      "name": "Agency",
      "price": "39",
      "priceCurrency": "USD",
      "description": "10 domains, white-label PDF, all Pro features, priority support."
    }
  ]
}
```

Also add `sameAs` to the Organization block:
```json
"sameAs": [
  "https://twitter.com/REPLACE_WITH_HANDLE",
  "https://github.com/REPLACE_WITH_REPO"
]
```

---

### 7. Disable `x-powered-by` header (2 min)
**File:** `next.config.ts`
```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // ...
}
```

---

### 8. Add named AI crawler entries to `robots.ts` (20 min)
**File:** `app/robots.ts`
```ts
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/'],
      },
      // Explicitly allow AI crawlers
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Googlebot-Extended', allow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
```

---

### 9. Fix sitemap double-slash and add `/pricing` (20 min)
**File:** `app/sitemap.ts`
```ts
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')
  return [
    { url: `${base}/`, lastModified: new Date('2026-04-27'), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified: new Date('2026-04-27'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/roadmap`, lastModified: new Date('2026-04-27'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacy`, lastModified: new Date('2026-04-01'), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, lastModified: new Date('2026-04-01'), changeFrequency: 'yearly', priority: 0.2 },
  ]
}
```

---

### 10. Fix `/pricing` — build as standalone SSR page (2 hours)
**File:** `app/pricing/page.tsx`

Remove the `redirect('/#pricing')` and render the `PricingSection` component directly with proper metadata:
```ts
import type { Metadata } from 'next'
import { PricingSection } from '@/components/landing/PricingSection'

export const metadata: Metadata = {
  title: 'ShipReady Pricing — Plans for Freelancers and Agencies',
  description: 'Free plan with 3 scans/month. Pro at $14/mo for unlimited scans and PDF reports. Agency at $39/mo for teams auditing client sites.',
}

export default function PricingPage() {
  return <main><PricingSection /></main>
}
```

---

### 11. Add author attribution (30 min)
**File:** `app/layout.tsx` — add `Person` node to JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Eugene Gusakov",
  "url": "https://ship-ready.vercel.app"
}
```

Also add one-line attribution in footer: "Built by [Eugene Gusakov](https://your-profile.com)"

---

## 🟡 Medium Priority — Fix This Month (total effort: ~1 week)

### 12. Convert landing page to Server Component
**File:** `app/(landing)/page.tsx`

This is the highest-impact single change for both SEO and performance. Full rewrite — keep `'use client'` only on:
- `ScanForm` (has state)
- `FAQSection` (has accordion state)
- `Nav` (has auth subscription + language switcher)
- `HeroNoise`, `Particles`, `FlickeringGrid`, `Meteors` (already `{ ssr: false }`)

Convert hero, stats bar, how-it-works, features, AI prompts section, pricing section to Server Components using `getLocale()` / `getMessages()` (same pattern as `/roadmap` and `/privacy` pages).

Expected impact: LCP -2s, enables CDN caching, FAQ content crawlable by AI without JS.

---

### 13. Remove CDN cache-blocking `headers()` call from landing layout
**File:** `app/(landing)/layout.tsx`

The `await headers()` call opts the route into dynamic rendering and bypasses Vercel CDN. Move nonce injection to `middleware.ts` and pass via a response header. Once removed, add:
```ts
// app/(landing)/layout.tsx
export const revalidate = 3600  // or export const dynamic = 'force-static'
```

---

### 14. Performance quick wins (no SSR refactor needed)

**Throttle Particles mousemove** — `components/ui/particles.tsx`:
```ts
const rafPending = useRef(false)
const handleMouseMove = (e: MouseEvent) => {
  if (rafPending.current) return
  rafPending.current = true
  requestAnimationFrame(() => {
    setMousePosition({ x: e.clientX, y: e.clientY })
    rafPending.current = false
  })
}
```

**Add `adjustFontFallback`** — `app/layout.tsx` font definitions:
```ts
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700'],  // reduced from 5 weights
  display: 'swap',
  adjustFontFallback: true,       // ← add this
})
// Same for Space Grotesk and JetBrains Mono
```

**Dynamically import CinematicFooter** — `app/(landing)/page.tsx`:
```ts
const CinematicFooter = dynamic(() => import('@/components/ui/motion-footer'), { ssr: false })
```

**Add preconnect to Supabase** — `app/layout.tsx`:
```tsx
<link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
```

---

### 15. Make FAQ schema locale-aware
**File:** `app/(landing)/layout.tsx`

```ts
export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations('FAQ')
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqKeys.map(key => ({
      '@type': 'Question',
      name: t(`${key}.q`),
      acceptedAnswer: { '@type': 'Answer', text: t(`${key}.a`) },
    })),
  }
  // inject via script tag
}
```

---

### 16. Add report-level OG metadata
**File:** `app/report/[id]/page.tsx`

Add a hybrid server shell that fetches scan URL and score for OG:
```ts
// At the top of the file — server-side data fetch for metadata only
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await supabase.from('scans').select('url, results').eq('id', params.id).single()
  const score = data?.results?.score ?? null
  const url = data?.url ?? 'a website'
  return {
    title: score ? `${url} — ${score}/100 on ShipReady` : `Scan report — ShipReady`,
    description: `Full audit report for ${url}: performance, SEO, security, mobile, and AI visibility.`,
    robots: { index: false },
  }
}
```

---

### 17. Copy and UX fixes

| Fix | File | Detail |
|---|---|---|
| Fix "0+ automated checks" stat | Landing page stats bar | Use hardcoded verified count or hide until real data |
| Add "before launch" / "pre-deploy" language | Landing page H2 or feature section | These are high-intent search query phrases with zero current coverage |
| Fix roadmap H1 | `app/roadmap/page.tsx` | Change H1 to "ShipReady Roadmap" for keyword signal |
| Update copyright year | `messages/en.ts` line 595 | `© ${new Date().getFullYear()} ShipReady` |
| Update Privacy/Terms dates | `app/privacy/page.tsx`, `app/terms/page.tsx` | Current date or last real review date |
| Add sample report link | Landing page hero or features section | Hard-link to a real scan of a known site |
| Add `WebSite` + `SearchAction` schema | `app/layout.tsx` | Enables Sitelinks Search Box for branded queries |

---

## 🟢 Low Priority — Backlog

| Item | Effort | Benefit |
|---|---|---|
| Custom domain (`shipready.io` or similar) | Medium | Critical before any link building; Vercel subdomain dilutes equity |
| Product Hunt + HN Show HN launch plan | Low prep | Seed initial backlinks and brand awareness |
| One DEV.to article on confidence model | Medium | First editorial backlink + AI citability anchor |
| `hreflang` alternate tags for EN/RU | Low | RU organic traffic signal |
| IndexNow key setup | Low | Faster Bing indexing on content updates |
| Agency workflow section on homepage | Medium | "Used by agencies to audit client sites before delivery" |
| `noindex` → COOP/CORP headers in `next.config.ts` | Low | Security hygiene |
| Add IntersectionObserver to HeroNoise, FlickeringGrid, Meteors | Low | Background CPU reduction |

---

## Score Projection

| Phase | Actions | Est. Score |
|---|---|---|
| Current | — | 54 / 100 |
| After Critical (this sprint) | Fix env var, update llms.txt, add noindex | ~60 / 100 |
| After High (this week) | OG image, meta desc, schema fixes, AI crawler rules | ~67 / 100 |
| After Medium (this month) | SSR refactor, performance fixes, copy updates | ~76 / 100 |
| After Low (next quarter) | Custom domain, content, backlinks | ~82+ / 100 |
