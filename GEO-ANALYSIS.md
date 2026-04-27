# GEO / AI Search Readiness Analysis — ship-ready.vercel.app

**Date:** 2026-04-27  
**Previous GEO score (full audit):** 54/100  
**Current GEO score:** **60/100** (+6 points from implemented fixes)

---

## GEO Readiness Score: 60 / 100

| Dimension | Weight | Score | Weighted | Δ vs prior |
|---|---|---|---|---|
| Citability | 25% | 62 | 15.5 | +14 pts ✅ |
| Structural Readability | 20% | 72 | 14.4 | = |
| Multi-Modal Content | 15% | 30 | 4.5 | = |
| Authority & Brand Signals | 20% | 42 | 8.4 | +2 |
| Technical Accessibility | 20% | 85 | 17.0 | +10 pts ✅ |
| **Total** | | | **59.8 ≈ 60** | **+6** |

---

## Platform Breakdown

| Platform | Score | Primary Blocker |
|---|---|---|
| Google AI Overviews | 48/100 | CSR — page content not in static HTML; no Person schema; og.png 404 |
| ChatGPT Browse | 52/100 | llms.txt now comprehensive ✅; CSR still limits passage extraction |
| Perplexity | 58/100 | llms.txt read directly ✅; robots.txt explicit ✅; lacks Reddit presence |
| Bing Copilot | 44/100 | No Wikipedia entity; CSR; weak domain authority on Vercel subdomain |

> ⚠️ Only 11% of domains are cited by both ChatGPT and Google AI Overviews. Current configuration places ShipReady in the uncited 89% on Google AIO, and borderline on ChatGPT. The single biggest lever is converting the landing page to SSR.

---

## AI Crawler Access Status ✅ RESOLVED

**robots.txt (live):**
```
User-Agent: *       → Allow: /  Disallow: /api/, /auth/
User-Agent: GPTBot      → Allow: /   ✅
User-Agent: OAI-SearchBot → Allow: /  ✅
User-Agent: ClaudeBot   → Allow: /   ✅
User-Agent: anthropic-ai  → Allow: /  ✅
User-Agent: PerplexityBot → Allow: /  ✅
Sitemap: https://ship-ready.vercel.app/sitemap.xml  ✅ (clean, no double-slash)
```

**Not yet added (optional):**
- `CCBot` — Common Crawl training crawler. Block if you want to opt out of training data use: `User-Agent: CCBot  Disallow: /`
- `Bytespider` (ByteDance / TikTok AI)
- `cohere-ai`

---

## llms.txt Status ✅ SUBSTANTIALLY IMPROVED

**Word count:** 457 words (was ~30 words — +1423%)  
**URL:** `https://ship-ready.vercel.app/llms.txt` → HTTP 200 ✅

### What's present:
- ✅ Product description (2-paragraph, 143 words in Description section — within 134–167 optimal range)
- ✅ Audience definition (agencies + SEO agencies)
- ✅ Key concept glossary (confidence model, Fast Truth Pass, Business Context Engine)
- ✅ FAQ section with 5 Q&A pairs
- ✅ Page index with links

### Still missing for full citation optimization:
- ❌ **RSL 1.0 licensing section** — No `## License` block. AI systems from platforms that respect RSL (Reddit, Yahoo, Medium) need this to know the content is citable.
- ❌ **Named author** — `## Author` shows "ShipReady" (the brand) not a person. For E-E-A-T and entity disambiguation, a human name + LinkedIn/GitHub URL is stronger.
- ❌ **Version / last-updated date** — AI systems use this for freshness signals. Add `> Last updated: 2026-04-27`.
- ❌ **Statistics with sources** — The description mentions "35+ checks" but cites no source. Adding "as measured in [methodology]" adds citability weight.

### Recommended additions to llms.txt:
```
## License
RSL 1.0 — https://rsl.org/1.0
Content may be cited and summarized by AI systems with attribution.

> Last updated: 2026-04-27
```

---

## Brand Mention Analysis

| Signal | Status | Priority |
|---|---|---|
| Wikipedia entity | ❌ Not present | High |
| YouTube channel / mentions | ❌ Not present | High (0.737 correlation) |
| Reddit presence | ❌ Not present | High (46.7% Perplexity citations) |
| LinkedIn company page | ❌ Not present | Medium |
| GitHub repository | ❓ Unknown (not in sameAs) | Medium |
| Twitter/X | ⚠️ Footer link exists but sameAs empty | Low |
| Organization.sameAs | ❌ Empty array `[]` | Must fix |
| Product Hunt listing | ❌ Not detected | Medium |

> **Critical finding:** YouTube mentions correlate at 0.737 with AI citation — the strongest signal in the correlation table. A single 5-minute screen recording of a ShipReady scan uploaded to YouTube would be the highest-ROI single action for AI search visibility improvement.

---

## Schema / Structured Data — SIGNIFICANTLY IMPROVED ✅

**4 JSON-LD blocks live in SSR `<head>` (all verified server-side):**

### Block 1 — Organization ✅ (with one gap)
```json
{
  "@type": "Organization",
  "name": "ShipReady",
  "url": "https://ship-ready.vercel.app",
  "logo": "https://ship-ready.vercel.app/logo.svg",
  "sameAs": []   ← ❌ EMPTY — must be populated
}
```
**Fix:** Replace `[]` with actual social profile URLs.

### Block 2 — WebApplication ✅ (complete)
```json
{
  "@type": "WebApplication",
  "applicationCategory": "BusinessApplication",   ✅ fixed
  "operatingSystem": "Web",                         ✅ fixed
  "featureList": [7 items],                         ✅ added
  "offers": [Free $0, Pro $14, Agency $39]          ✅ added
}
```
**Status:** Google Software rich result eligible. All required fields present.

### Block 3 — WebSite + SearchAction ✅ (new)
Enables Sitelinks Search Box for branded queries.

### Block 4 — FAQPage ✅ (5 Q&A pairs, server-side)
FAQPage will not produce Google accordion rich results on commercial sites (Google restriction since Aug 2023), but **Perplexity, ChatGPT, and Claude read this directly** for passage extraction.

### Still missing:
- ❌ **Person schema** — No `@type: Person` in any block. This is the #1 EEAT gap.
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Eugene Gusakov",
  "url": "https://ship-ready.vercel.app",
  "sameAs": ["https://github.com/YOURHANDLE", "https://linkedin.com/in/YOURPROFILE"]
}
```

---

## OG Image — CRITICAL REGRESSION ❌

`og.png` is now declared in OpenGraph metadata:
```html
<meta property="og:image" content="https://ship-ready.vercel.app/og.png">
<meta name="twitter:image" content="https://ship-ready.vercel.app/og.png">
```

**But `/og.png` returns HTTP 404.**

This means:
- Twitter/X card shows a broken image
- Facebook/LinkedIn OG preview is broken
- Google Discover image signal is missing
- `twitter:card: summary_large_image` with a broken image is worse than no image

**Two options:**

Option A — Use the existing Next.js dynamic OG route (recommended):
The project has `app/opengraph-image.tsx` which generates OG images via Next.js Image Response. Check if it renders at `https://ship-ready.vercel.app/opengraph-image` — if so, point metadata there:
```ts
openGraph: {
  images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
},
twitter: { images: ['/opengraph-image'] },
```

Option B — Create a static `public/og.png` (1200×630 PNG):
Design a branded card with ShipReady name, tagline, and score visual. Place at `public/og.png`.

---

## Passage-Level Citability Analysis

### What AI crawlers see (without JavaScript execution):

**Server-rendered (always visible to AI):**
- `<title>`: "ShipReady - Site audits that understand your client's business." ✅
- `<meta description>`: "35+ automated checks across performance, SEO, security, mobile, and AI visibility..." ✅
- 4 JSON-LD blocks with full content ✅
- All `<head>` metadata ✅

**Client-rendered (invisible to AI without JS):**
- H1: "Site audits that understand your client's business." ❌ not in static HTML
- All H2s ❌
- FAQ section answers ❌
- Feature descriptions ❌
- Pricing section ❌
- Stats bar ❌

> **The core paradox:** ShipReady's best citable content — the FAQ, the confidence model explanation, the feature descriptions — is generated client-side. An AI crawler receives the product name, meta description, and JSON-LD schemas, but nothing else. The llms.txt file is currently the **only** source of extractable passage content for non-JS crawlers.

### Citable passages identified (from llms.txt + JSON-LD):

**Passage 1 — Product description (143 words) ✅ OPTIMAL**  
From `llms.txt ## Description`. Self-contained, uses named methodology ("verified / likely / heuristic"), explains the two-phase scan architecture. This is the strongest citation anchor currently available.

**Passage 2 — FAQ answer: What does ShipReady check? (~90 words)**  
From FAQPage JSON-LD. Well-structured, specific. Slightly below 134-word optimal but extractable.

**Passage 3 — FAQ answer: What are verified/likely/heuristic findings? (~55 words)**  
Good definition, below optimal length. Expand to 90-100 words for better citability.

### Passages that would exist if page were SSR:
The FAQ section rendered on the landing page has much richer answer text than the JSON-LD. If SSR is implemented, these would become highly citable.

---

## Server-Side Rendering Check

**Status: ⚠️ PARTIAL SSR**

| Content | Rendering | AI Crawlable |
|---|---|---|
| `<head>` metadata (title, description, OG, canonical) | SSR ✅ | ✅ Yes |
| JSON-LD schema blocks (4 blocks) | SSR ✅ | ✅ Yes |
| `<h1>` tag | CSR ❌ | ❌ No |
| All `<h2>` tags | CSR ❌ | ❌ No |
| FAQ section text | CSR ❌ | ❌ No |
| Feature descriptions | CSR ❌ | ❌ No |
| Pricing content | CSR ❌ | ❌ No |
| `llms.txt` | Static file ✅ | ✅ Yes |

**Root cause:** `app/(landing)/page.tsx` is declared `'use client'`.  
**Impact:** All body content is invisible to Google AIO, ChatGPT, and Perplexity crawlers that do not execute JavaScript.  
**Fix required:** Convert to Server Component (see FULL-AUDIT-REPORT.md, Section 5).

---

## Top 5 Highest-Impact Changes

### 1. Fix `og.png` 404 → Use `/opengraph-image` route
**Effort: 30 min | Impact: HIGH**  
A declared-but-broken OG image is actively harmful. Either point to the existing Next.js dynamic OG route or create the static file. Every social share and AI platform preview is currently broken.

```ts
// app/layout.tsx generateMetadata()
openGraph: {
  images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: '...' }],
},
twitter: { card: 'summary_large_image', images: ['/opengraph-image'] },
```

### 2. Add `sameAs` to Organization schema with real URLs
**Effort: 15 min | Impact: HIGH**  
Empty `sameAs: []` gives Google and AI systems no entity graph connections. Add actual profile URLs. Even one Twitter/X link immediately creates a graph edge.

```ts
// app/layout.tsx
sameAs: [
  'https://x.com/YOUR_HANDLE',
  'https://github.com/YOUR_ORG',
]
```

### 3. Add Person schema for Eugene Gusakov
**Effort: 20 min | Impact: HIGH**  
No `@type: Person` exists anywhere. Person schema is the #1 E-E-A-T signal for AI systems evaluating source credibility.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Eugene Gusakov",
  "url": "https://ship-ready.vercel.app",
  "jobTitle": "Founder",
  "sameAs": ["https://github.com/HANDLE", "https://linkedin.com/in/HANDLE"]
}
```

### 4. Add RSL 1.0 license + update date to `llms.txt`
**Effort: 10 min | Impact: MEDIUM**  
Platforms that respect RSL (Reddit, Yahoo, Medium) use this to know the content is citable. Without it, some AI indexers apply conservative "unknown license" treatment.

```
## License
RSL 1.0 — https://rsl.org/1.0

> Last updated: 2026-04-27
```

### 5. Create one YouTube video — even a 5-minute scan demo
**Effort: 2 hours | Impact: VERY HIGH (0.737 citation correlation)**  
YouTube mentions are the single strongest predictor of AI citation presence. A short screen recording of ShipReady scanning a well-known site, uploaded to YouTube with the product name in the title, creates the highest-ROI GEO signal available. No video currently exists anywhere associated with ShipReady.

---

## Content Reformatting Suggestions

### Suggestion 1: Make FAQ answers longer (target 90–134 words each)

Current FAQ answer "What are verified/likely/heuristic findings?" is ~55 words. Expand it:

> "Verified findings are facts extracted directly from HTTP headers or HTML without any inference. Examples: missing HSTS header, absent meta description, broken canonical URL. These always affect the score. Likely findings use AI analysis supported by clear HTML signals — for example, detecting a Shopify store from checkout script patterns. Heuristic findings use AI inference from ambiguous signals, such as estimating target audience from heading and paragraph text. Likely and heuristic findings are shown in the report but are clearly labeled and do not count toward the overall score unless score-eligible."

This is 96 words — closer to the 134 optimal, directly citable, and adds the concrete examples that make AI systems choose this passage.

### Suggestion 2: Add a "What is ShipReady?" definition in first 40 words of homepage (SSR)

Once the page is SSR, the first visible paragraph should follow the "X is..." citation pattern:

> "ShipReady is a site audit tool that scans any URL and returns evidence-backed findings across performance, SEO, security, mobile readiness, and AI visibility — with fix prompts specific to your tech stack."

This is 38 words — within the 40-word direct answer threshold for AI extraction.

### Suggestion 3: Add a statistics block with sourced claims

AI systems weight statistics when they come with source context. Add one block:

> "ShipReady runs 35+ automated checks per scan, combining deterministic HTTP/HTML analysis (response headers, DOM parsing) with Lighthouse mobile audits and OpenAI-powered recommendation generation. The confidence model classifies every finding as verified, likely, or heuristic — so developers can distinguish facts from estimates without manual verification."

---

## Quick Win Checklist

| Action | Effort | Priority | Status |
|---|---|---|---|
| Fix og.png 404 → use /opengraph-image | 30 min | 🔴 Critical | ❌ Open |
| Add sameAs URLs to Organization schema | 15 min | 🔴 Critical | ❌ Open |
| Add Person schema (Eugene Gusakov) | 20 min | 🟠 High | ❌ Open |
| Add RSL 1.0 + last-updated to llms.txt | 10 min | 🟡 Medium | ❌ Open |
| Create YouTube scan demo video | 2 hrs | 🟡 Medium | ❌ Open |
| Convert landing page to SSR | 4-8 hrs | 🔴 Critical | ❌ Open |
| Register on Reddit (r/webdev, r/SideProject) | 1 hr | 🟡 Medium | ❌ Open |
| Named AI crawlers in robots.txt | Done | ✅ | ✅ Done |
| llms.txt comprehensive (457 words + FAQ) | Done | ✅ | ✅ Done |
| WebApplication operatingSystem, featureList, offers | Done | ✅ | ✅ Done |
| WebSite + SearchAction schema | Done | ✅ | ✅ Done |
| FAQPage JSON-LD (5 Q&A) | Done | ✅ | ✅ Done |
| Sitemap clean (no double-slash) | Done | ✅ | ✅ Done |
| Canonical correct | Done | ✅ | ✅ Done |
