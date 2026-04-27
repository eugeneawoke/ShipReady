# ShipReady — Full SEO Audit Report

**URL:** https://ship-ready.vercel.app/  
**Date:** 2026-04-27  
**Audited by:** claude-seo v1.9.6 (8 subagents)  
**Business type detected:** SaaS tool — site audit / pre-deploy quality gate for web developers and agencies  
**Platform:** Next.js 16 App Router · Vercel · Supabase

---

## Overall SEO Health Score: **54 / 100**

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 61 | 13.4 |
| Content Quality | 23% | 61 | 14.0 |
| On-Page SEO | 20% | 55 | 11.0 |
| Schema / Structured Data | 10% | 45 | 4.5 |
| Performance (CWV) | 10% | 38 | 3.8 |
| AI Search Readiness | 10% | 54 | 5.4 |
| Images | 5% | 30 | 1.5 |
| **Total** | | | **53.6** |

> ⚠️ **The single biggest lever:** The landing page is declared `'use client'`, making it fully client-side rendered. Converting it to a Server Component would improve LCP by ~2s, unblock AI crawler content extraction, and enable CDN caching — lifting the overall score by an estimated 10–15 points.

---

## Top 5 Critical Issues

1. **Double-slash URL bug** — `NEXT_PUBLIC_APP_URL` has a trailing slash, producing `//sitemap.xml`, `//roadmap`, `//logo.svg` etc. across robots.txt, sitemap, and schema. Googlebot cannot process the sitemap. Fix: remove trailing slash from env var on Vercel. *(5-minute fix)*
2. **Landing page is `'use client'`** — Entire homepage renders client-side. LCP estimated 3.5–5.5s. FAQ content (best citability asset) is invisible to AI crawlers without JS. SSR refactor required.
3. **No CDN caching on landing page** — `Cache-Control: private, no-cache, no-store`. Every request hits a Vercel function cold. Fix: remove `headers()` call from landing layout, enable ISR.
4. **`llms.txt` contradicts current positioning** — Still says "indie hackers, vibe coders, and solo founders." Every AI-generated brand summary describes ShipReady as a vibe-coder tool. Must be updated to agency/developer audience immediately.
5. **Agency pricing tier is "coming soon"** — The highest-value buyer ($39/mo) hits a dead-end CTA. No conversion path, no email capture. Either launch a waitlist or remove the tier until live.

## Top 5 Quick Wins

1. **Remove trailing slash from `NEXT_PUBLIC_APP_URL` on Vercel** — fixes robots.txt, sitemap, canonicals, schema logo URL simultaneously. *(5 min)*
2. **Add OG image** — No `og:image` defined anywhere. Add `/public/og.png` (1200×630) and wire it in layout.tsx. Affects social sharing, Google Discover, AI Overviews. *(30 min)*
3. **Add `noindex` to `/report/:path*` and `/dashboard`** — Scan reports are publicly accessible and could be indexed, creating privacy and duplicate content issues. *(10 min)*
4. **Set `poweredByHeader: false` in `next.config.ts`** — Removes `x-powered-by: Next.js` header. One line. *(2 min)*
5. **Update `llms.txt` audience description** — Change to agency/developer audience, remove Bolt/Lovable/v0/Replit, expand to 134+ words with Q&A. *(1 hour)*

---

## Section 1 — Technical SEO

**Score: 61 / 100**

### Critical

#### C-01 — Double-Slash URL Bug in Sitemap, Robots.txt, and Schema ⚠️
`NEXT_PUBLIC_APP_URL=https://ship-ready.vercel.app/` (trailing slash) is concatenated with leading-slash paths, producing:
- `robots.txt`: `Sitemap: https://ship-ready.vercel.app//sitemap.xml` — invalid, Googlebot cannot parse
- `sitemap.xml`: all secondary URLs have `//roadmap`, `//privacy`, `//terms`
- `Organization.logo`: `https://ship-ready.vercel.app//logo.svg` — malformed, fails Google rich result validation

**Fix:** On Vercel dashboard, change `NEXT_PUBLIC_APP_URL` to `https://ship-ready.vercel.app` (no trailing slash). In code, add `.replace(/\/$/, '')` guard in `app/sitemap.ts` and `app/robots.ts`.

#### C-02 — Canonical / Domain Mismatch
`app/layout.tsx` uses `NEXT_PUBLIC_APP_URL` for `<link rel="canonical">`, OpenGraph URL, and structured data. If the intended production domain is `shipready.app` but the env var points to the Vercel subdomain, every page has a wrong canonical. `public/llms.txt` hard-codes `https://shipready.app/` while the live site is on `ship-ready.vercel.app` — these domains are in conflict.

**Fix:** Decide the canonical domain and set it consistently everywhere. Update `llms.txt` to match.

### High

#### H-01 — No CDN Caching (`Cache-Control: private, no-cache, no-store`)
Every request to the homepage hits a Vercel serverless function. The `headers()` call in `LandingLayout` forces dynamic rendering and bypasses CDN. Static marketing content has no reason to bypass the CDN.

**Fix:** Remove or isolate the `headers()` call (move nonce injection to middleware). Add `export const revalidate = 3600` or enable full static generation for the landing page.

#### H-02 — Landing Page Is a Client Component (`'use client'`)
`app/(landing)/page.tsx` forces the entire page — H1, FAQ, pricing, features — to render client-side. Google WRS handles JS indexing but with a crawl-budget delay. AI crawlers without JS execution (significant subset) receive a near-empty HTML body.

**Fix:** Refactor to Server Component. Keep `'use client'` only on interactive islands: ScanForm, FAQ accordion, language switcher, decorative animations (already `{ ssr: false }`).

#### H-03 — No OG Image / Invalid Twitter Card
`twitter: { card: 'summary_large_image' }` is declared with no `twitter:image`. This is invalid per Twitter/X spec. Facebook, LinkedIn, and Google Discover show nothing or a random page image.

**Fix:** Add `/public/og.png` (1200×630). Register in `app/layout.tsx` under both `openGraph.images` and `twitter.images`.

#### H-04 — `/pricing` Redirects to `/#pricing` Hash Anchor
`app/pricing/page.tsx` issues a 307 redirect to the homepage anchor. Hash fragments are not crawled. `/pricing` will never be indexed. No standalone pricing page exists to capture commercial-intent queries ("site audit tool pricing").

**Fix:** Build `/pricing` as a proper SSR page with its own `<title>` and `<meta description>`. The `PricingSection` component already exists.

### Medium

| ID | Issue | File | Fix |
|---|---|---|---|
| M-01 | `x-powered-by: Next.js` header | `next.config.ts` | `poweredByHeader: false` |
| M-02 | CSP `connect-src` uses wildcard Supabase subdomains | `app/layout.tsx` CSP | Tighten to exact project URL |
| M-03 | Report/dashboard pages have no noindex | `app/report/[id]/page.tsx`, `app/dashboard/page.tsx` | Add `robots: { index: false }` metadata |
| M-04 | `llms.txt` domain points to `shipready.app`, not live domain | `public/llms.txt` | Update or generate dynamically |
| M-05 | FAQ schema English-only despite RU locale support | `app/(landing)/layout.tsx` | Build schema from i18n messages per locale |
| M-06 | COOP/CORP headers missing | `next.config.ts` | Add `Cross-Origin-Opener-Policy: same-origin` |

### Low

| ID | Issue | Fix |
|---|---|---|
| L-01 | No IndexNow key | Register at bing.com/indexnow, add `/public/{key}.txt` |
| L-02 | `changeFrequency: 'weekly'` on static roadmap page | Change to `'monthly'` |
| L-03 | No Person entity in schema | Add `Person` node as `creator` on WebApplication schema |
| L-04 | Privacy/Terms "last updated" hardcoded to April 5, 2025 | Update to current date |

### Security Header Assessment

| Header | Status | Notes |
|---|---|---|
| `Strict-Transport-Security` | ✅ Pass | 2-year with preload |
| `Content-Security-Policy` | ✅ Pass | Nonce-based, `strict-dynamic` |
| `X-Content-Type-Options` | ✅ Pass | nosniff |
| `X-Frame-Options` | ✅ Pass | DENY |
| `Referrer-Policy` | ✅ Pass | strict-origin-when-cross-origin |
| `Permissions-Policy` | ✅ Pass | camera, mic, geo, payment blocked |
| `x-powered-by: Next.js` | ❌ Fail | Remove with `poweredByHeader: false` |
| `Cross-Origin-Opener-Policy` | ⚠️ Missing | Add `same-origin` |
| `Cross-Origin-Resource-Policy` | ⚠️ Missing | Add `same-origin` |

---

## Section 2 — Content Quality

**Score: 61 / 100**

### E-E-A-T Summary

| Factor | Score | Key Gap |
|---|---|---|
| Experience | 45/100 | No testimonials, no real scan screenshots, stats bar shows "0+ checks" |
| Expertise | 62/100 | Correct technical terminology, named confidence model. No author page. |
| Authoritativeness | 52/100 | No press mentions, no third-party endorsements. Private beta. |
| Trustworthiness | 78/100 | HTTPS, privacy policy, named operator. CSP present. |

### AI Citation Readiness: 68 / 100

**Strengths:** `llms.txt` present, FAQPage schema implemented, Organization + WebApplication JSON-LD in SSR head, named methodology ("verified / likely / heuristic").  
**Gaps:** `llms.txt` still references vibe-coder audience; no `author` entity; FAQ answers are JS-gated (invisible to non-JS crawlers); no self-contained 134+ word citable passage.

### Critical

#### C-1 — `llms.txt` audience contradicts landing page positioning
`public/llms.txt` describes audience as "indie hackers, vibe coders, and solo founders." The landing page now says "agency/developer." Every AI-generated brand summary will describe ShipReady incorrectly until this is updated. Also still lists Bolt, Lovable, v0, Replit as prompt tools.  
**File:** `public/llms.txt`  
**Fix:** Update immediately. See recommended expanded `llms.txt` in Action Plan.

#### C-2 — `/pricing` is not an indexable page
No standalone pricing page exists. All pricing-intent organic traffic ("site audit tool pricing") must land on the homepage with no dedicated page to rank.

### High

| ID | Issue | Fix |
|---|---|---|
| H-1 | Homepage body text ~800-900 words — thin for a page covering 5 service categories | Expand each feature card to 2-3 sentences |
| H-2 | No author attribution on landing page or in schema | Add "Built by [name]" + `Person` schema node |
| H-3 | Report pages (`/report/[id]`) inherit generic metadata | Add `generateMetadata` or hybrid SSR to report page |
| H-4 | "0+ automated checks" stat shows zero | Fix data binding or replace with hardcoded verified count |

### Medium

| ID | Issue | Fix |
|---|---|---|
| M-1 | FAQ schema English-only | Build from i18n messages per locale |
| M-2 | Stats bar: "Fast" and "AI" are not numeric | Replace with "< 60s scan time" and real count |
| M-3 | Roadmap H1 is "Where we're going" not "Roadmap" | Make "ShipReady Roadmap" the `<h1>` |
| M-4 | Internal linking is shallow | Add inline link to roadmap, add real example report link |
| M-5 | Privacy/Terms last-updated date stale (April 2025) | Update to current date |

### Low

| ID | Issue | Fix |
|---|---|---|
| L-1 | No `hreflang` alternate tags for EN/RU | Add to `generateMetadata` |
| L-2 | Copyright reads "© 2025" | Change to dynamic `new Date().getFullYear()` |
| L-3 | `/dashboard` has no noindex | Add `robots: { index: false }` |
| L-4 | `<meta name="keywords">` tag present (ignored by all engines since 2009) | Remove |

---

## Section 3 — On-Page SEO

**Score: 55 / 100**

### Meta Description
**Status: MISSING on most pages.** The root layout `appDescription` ("Site audits that understand your client's business.") is only 49 characters — too short for OG and not a meta description. No `<meta name="description">` is set for the homepage. Google will auto-generate, producing uncontrolled SERP snippets.

**Recommended meta description:**
> "ShipReady runs 35+ automated checks — performance, SEO, security, mobile, and AI visibility — and generates fix prompts for Cursor, Claude Code, and Windsurf. No signup required." *(178 chars)*

### Title Tags
- Homepage: "ShipReady - Site audits that understand your client's business." — 61 chars. **Acceptable but not keyword-optimized.** Does not include "site audit tool", "SEO audit", or "pre-launch check."
- `/pricing`: redirects — no independent title
- `/roadmap`: correct

### Heading Structure
- Homepage H1: "Site audits that understand your client's business." ✅ One H1, clear.
- H2s cover main sections ✅
- Roadmap H1: "Where we're going" — should be "ShipReady Roadmap" for keyword relevance ❌

### Internal Linking
Shallow. Only 3 nav links from homepage. No text-body links to secondary pages. No real example report linked. `footer.exampleReport` referenced in messages but resolves to no live URL.

---

## Section 4 — Schema / Structured Data

**Score: 45 / 100**

### Schemas Detected

| Block | Type | Status |
|---|---|---|
| 1 | `Organization` | Present — **logo URL has double-slash bug** |
| 2 | `WebApplication` | Present — **missing `operatingSystem` (required for Google rich results)** |
| 3 | `FAQPage` | Present — valid, but Google no longer shows FAQ rich results for commercial sites |

### Critical Validations Failed

| Issue | Severity | File |
|---|---|---|
| `Organization.logo` has double-slash URL | High | `app/layout.tsx` line 63 |
| `WebApplication` missing `operatingSystem: "Web"` (required by Google) | High | `app/layout.tsx` |
| `WebApplication.applicationCategory: "DeveloperApplication"` non-canonical | Medium | `app/layout.tsx` |

### Missing Schema Opportunities

| Schema | Priority | Benefit |
|---|---|---|
| `WebApplication.operatingSystem` | High | Required for Google Software rich results |
| `WebSite` + `SearchAction` | Medium | Enables Sitelinks Search Box |
| `Organization.sameAs` | Medium | Social profile links for entity disambiguation |
| All three `Offer` tiers in `WebApplication` | Low | Richer product data for knowledge graph |

### Recommended Fixes (see JSON-LD in Action Plan)

1. Fix `Organization.logo` double-slash — strip trailing slash in env var handling
2. Add `operatingSystem: "Web"` and change `applicationCategory` to `"BusinessApplication"` on `WebApplication`
3. Add `WebSite` + `SearchAction` block
4. Add `sameAs` to Organization with real social profile URLs
5. Expand `offers` array to include Pro ($14/mo) and Agency ($39/mo)

---

## Section 5 — Performance (Core Web Vitals)

**Score: 38 / 100**  
*(PSI API quota exhausted — all estimates derived from source architecture analysis)*

### Estimated CWV (Mobile, 75th percentile)

| Metric | Estimated | Target | Status |
|---|---|---|---|
| LCP | 3.5–5.5s | < 2.5s | ❌ Poor |
| INP | 150–300ms | < 200ms | ⚠️ Borderline |
| CLS | 0.05–0.15 | < 0.1 | ⚠️ Risk |

### Root Cause Analysis

| Priority | Finding | Impact | Effort |
|---|---|---|---|
| 1 | Landing page is `'use client'` — LCP element (H1) blocked by JS execution | LCP -2.0–2.5s | High |
| 2 | `Cache-Control: no-store` — no CDN, every load is cold server function | TTFB -200–350ms | Low |
| 3 | `Particles` mousemove fires `setState` on every mouse event | INP -50–150ms | Low |
| 4 | 3 custom fonts, 12 weights, no `adjustFontFallback` | CLS risk, LCP -100–300ms | Low |
| 5 | WebGL shader (HeroNoise) compiles on main thread at first hydration | LCP -100–200ms | Medium |
| 6 | GSAP + Framer Motion both loaded (~75KB gzipped) — GSAP in main bundle | Parse time | Low |
| 7 | FlickeringGrid / Meteors canvas loops run off-screen without IntersectionObserver | Background CPU | Low |

### Quick Performance Wins (before SSR refactor)
1. Add `adjustFontFallback: true` to all three `next/font/google` definitions → eliminates CLS risk
2. Reduce font weights loaded (only 2-3 per family needed)
3. Throttle Particles mousemove: wrap `setState` in `requestAnimationFrame`
4. Dynamically import `CinematicFooter` with `next/dynamic` → removes GSAP from main bundle
5. Add `<link rel="preconnect" href="[SUPABASE_URL]">` in layout head

---

## Section 6 — AI Search Readiness (GEO)

**Score: 54 / 100**

| Dimension | Score | Key Gap |
|---|---|---|
| Citability | 48/100 | CSR hides all content from non-JS crawlers; no 134+ word citable passage |
| Structural Readability | 72/100 | Clear H1/H2, but FAQ answers are JS-gated |
| Multi-Modal Content | 30/100 | No video, no demo, no YouTube presence |
| Authority & Brand Signals | 40/100 | No Wikipedia entity, no YouTube, no `sameAs` in schema |
| Technical Accessibility | 75/100 | llms.txt present, robots.txt allows AI crawlers, schemas in SSR head |

### Platform Estimates

| Platform | Score | Primary Blocker |
|---|---|---|
| Google AI Overviews | 35/100 | CSR rendering, no E-E-A-T author signals |
| ChatGPT Browse | 40/100 | CSR reduces passage extraction; llms.txt too thin |
| Perplexity | 45/100 | llms.txt present but sparse |
| Bing Copilot | 38/100 | No Wikipedia entity, weak domain authority |

### Critical Finding: Site Fails Its Own AI Visibility Checks
ShipReady audits AI visibility for client sites. The live ShipReady site fails on:
- ❌ `llms.txt` is thin and contradicts current positioning
- ❌ AI crawlers not explicitly named in robots.txt (implicit allow only)
- ❌ No `FAQPage` that is accessible without JavaScript
- ❌ No author entity in schema
- ❌ Stats bar shows "0+ automated checks" — active trust destruction

### Key Recommendations
1. **Convert landing to SSR** — makes all FAQ content accessible to AI crawlers without JS
2. **Expand `llms.txt`** to 134+ words with description, author, FAQ section, key concepts
3. **Name AI crawlers explicitly in `robots.ts`**: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot
4. **Fix double-slash in robots.txt sitemap URL** (same env var fix as C-01)
5. **Add `sameAs` to Organization schema** with real social profiles
6. **Publish one authoritative content piece** — e.g., "How ShipReady measures AI visibility" on DEV.to or a /blog page

---

## Section 7 — Search Experience Optimization (SXO)

**Score: 48 / 100**

### Persona Scores

| Persona | Score | Primary Blocker |
|---|---|---|
| Dev Agency Owner (primary ICP) | 3.5/10 | Agency tier "coming soon"; no conversion path; no client workflow framing |
| Freelance Developer | 6.25/10 | Value prop clear; lacks testimonials; "0+ checks" undermines trust |
| SEO/Marketing Agency | 3.75/10 | AI Visibility is a real differentiator but buried in tech jargon |

### SERP Analysis
Target queries: "site audit tool for agencies", "SEO audit tool client sites", "pre-launch site checklist tool"

**Dominant SERP pattern:** Tool landing pages with explicit agency workflow messaging — white-label, client delivery, multi-domain management. ShipReady's homepage speaks to individual developers (Cursor/Claude Code framing), not agency workflow.

**Closest competitor:** Roast My Web — nearly identical ICP (AI-powered, agency/freelancer, PDF reports). Direct competitive threat.

**Unique differentiator not fully exploited:** "Fix prompts for Cursor and Claude Code" — no competitor offers this. Currently buried in subheadline and not re-emphasized.

### Key Gaps
| Gap | Impact | Fix |
|---|---|---|
| "Before launch", "pre-launch", "client delivery" — 0 occurrences in page copy | Search visibility for transactional queries | Add to meta description, one H2, how-it-works section |
| No meta description | Google controls SERP snippet | Write 155-char description (see above) |
| Agency tier "coming soon" dead-end | Highest-value buyer cannot convert | Launch waitlist or remove tier |
| Zero testimonials / social proof | Trust score 1/10 vs competitors | Add one real beta user quote |
| `ship-ready.vercel.app` domain signals prototype | CTR penalty vs custom domain | Migrate to `shipready.io` or similar |
| No sample/demo report linked above fold | Evaluation buyers leave | Hard-link a real demo scan result |

---

## Section 8 — Sitemap Analysis

### Issues Found
1. **Critical:** All secondary sitemap URLs have double-slash (`//roadmap`, `//privacy`, `//terms`) — same root cause as C-01
2. **High:** `/pricing` is absent from the sitemap (correct given the redirect, but indicates missing indexable pricing page)
3. **Medium:** Sitemap only has 4 URLs — very thin for a public SaaS
4. **Low:** `changeFrequency: 'weekly'` on static roadmap page

### Corrected `sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ship-ready.vercel.app/</loc>
    <lastmod>2026-04-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ship-ready.vercel.app/pricing</loc>
    <lastmod>2026-04-27</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ship-ready.vercel.app/roadmap</loc>
    <lastmod>2026-04-27</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://ship-ready.vercel.app/privacy</loc>
    <lastmod>2026-04-27</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>https://ship-ready.vercel.app/terms</loc>
    <lastmod>2026-04-27</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
</urlset>
```

---

## Section 9 — Backlinks

**Score: Insufficient data (Common Crawl tier only)**  
No Moz, Bing, or DataForSEO credentials configured.

### Structural Findings

| Issue | Severity |
|---|---|
| Site is on Vercel subdomain (`ship-ready.vercel.app`) — any links earned accumulate equity on `vercel.app`, not a controlled domain. Migration to custom domain severs all historical link equity unless 301 redirects are maintained. | Critical |
| Near-zero organic backlinks expected at private beta stage. No PH launch, no HN post, no directory presence. | High (expected) |
| No toxic link risk at current stage | Low |

### Link Building Opportunities (pre-launch)

**Tier A — Highest Impact**
- Hacker News "Show HN" post at launch
- Product Hunt launch (Developer Tools / Site Quality categories)
- DEV.to article: "How I built a verified/likely/heuristic confidence model for SEO audits"
- IndieHackers milestone post

**Tier B — Directories**
- Uneed.be, Saasworthy, Toolify.ai, There's An AI For That (TAAFT), AlternativeTo (list as alternative to Lighthouse / GTmetrix / Screaming Frog)

**Tier C — Editorial**
- "Best site audit tools" roundups on agency blogs
- Agency resource pages after acquiring agency customers
- Developer newsletter spotlights (bytes.dev, TLDR, Console.dev)

---

## Section 10 — Images

**Score: 30 / 100**

| Issue | Severity |
|---|---|
| No `og:image` defined — `twitter:card: summary_large_image` declared but no image URL | High |
| No report-level OG images — shared report URLs show generic title only | High |
| Demo report preview visible on page but no full sample report linked | Medium |
| `public/logo.svg` URL malformed in schema due to double-slash bug | High (fixed by C-01) |

---

## Appendix: Files to Change

| File | Changes Needed |
|---|---|
| `app/sitemap.ts` | Strip trailing slash from base URL; add `/pricing`; fix changeFrequency |
| `app/robots.ts` | Strip trailing slash; add named AI crawler `Allow` entries |
| `app/layout.tsx` | Fix logo URL double-slash; add `operatingSystem` to WebApplication schema; add `sameAs` to Organization; add `WebSite` block; add OG image; add Supabase preconnect |
| `app/(landing)/layout.tsx` | Make FAQ schema locale-aware |
| `app/(landing)/page.tsx` | Convert from `'use client'` to Server Component (major refactor) |
| `next.config.ts` | `poweredByHeader: false`; add COOP/CORP headers; add noindex headers for `/report/:path*` and `/dashboard` |
| `public/llms.txt` | Update audience, remove vibe-coder tools, expand to 200+ words with FAQ section |
| `app/pricing/page.tsx` | Build as real SSR page instead of redirect to `/#pricing` |
| `app/roadmap/page.tsx` | Fix H1 to "ShipReady Roadmap" |
| `messages/en.ts` | Copyright year 2025→2026; write meta description |
| `app/privacy/page.tsx` | Update `UPDATED` date |
| `app/terms/page.tsx` | Update `UPDATED` date |
| `app/dashboard/page.tsx` | Add `export const metadata` with `robots: { index: false }` |
| `components/ui/particles.tsx` | Throttle mousemove with requestAnimationFrame |
| `components/ui/hero-noise.tsx` | Defer shader compilation, add IntersectionObserver |
| `app/(landing)/page.tsx` `CinematicFooter` import | Change to `next/dynamic` with `{ ssr: false }` |
