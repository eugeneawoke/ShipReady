/**
 * Serves /llms.txt via Next.js serverless function.
 *
 * Why a route handler instead of public/llms.txt?
 * Static files in /public are served by Vercel's CDN edge, which can block
 * requests from cloud/scanner IPs (403). Route handlers run as serverless
 * functions on the application tier, which has no such IP-based restrictions.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CONTENT = `# Glook

> Glook is a free website audit tool that shows you exactly why your site
> isn't showing up in Google, ChatGPT, Claude, or Perplexity — and gives you
> the exact fix for each issue. Scan any URL in 60 seconds. No signup required.

## Description

Glook runs 40+ automated checks across five audit categories and produces a
structured report with evidence-grounded confidence ratings: verified (measured
directly from HTTP/HTML signals), likely (strong heuristic with clear evidence),
and heuristic (AI inference from ambiguous signals). Every finding includes the
specific signal that triggered it — no invented issues.

The scan runs in two phases: a Fast Truth Pass (under 30 seconds) covering SEO
metadata, security headers, robots.txt, and AI visibility signals, followed by a
Deep Pass using real Lighthouse for Core Web Vitals and AI enrichment to generate
fix prompts tailored to the detected tech stack. A Next.js app gets component-level
instructions referencing actual files. A Shopify store gets Liquid file references.

Primary audience: solo founders, indie hackers, and developers who want to know
why their site isn't getting found — and need a ready-to-use fix. Secondary
audience: web and SEO agencies auditing client sites before delivery.

## Author

Glook — https://glook.dev

## Key Concepts

- Verified / likely / heuristic confidence model (only verified issues affect score)
- GEO (Generative Engine Optimization): optimization for ChatGPT, Claude, Perplexity, and Google AI Overview
- AEO (Answer Engine Optimization): structuring content to be cited in AI-generated answers
- Fast Truth Pass (under 30s) + Deep Pass (Lighthouse + AI enrichment)
- Fix prompts tailored to detected tech stack (Next.js, Shopify, WordPress, etc.)

## What Glook Checks

### SEO
Title tags, meta descriptions, canonical URLs, Open Graph tags, Twitter/X cards,
sitemap.xml validity, robots.txt analysis, structured data (JSON-LD), noindex
detection, image alt text, heading hierarchy, OG image dimensions, thin content.

### AI Visibility (GEO / AEO)
- llms.txt presence and validity
- AI crawler access: GPTBot (ChatGPT), ClaudeBot / anthropic-ai (Claude AI), PerplexityBot
- FAQ schema (FAQPage JSON-LD)
- Organization sameAs entity links — connects brand to Knowledge Graph
- Content date freshness signal (datePublished / dateModified / article:published_time)
- Answer-first paragraph structure (first passage length for AI citation)
- Question-format headings (H2/H3 starting with What, How, Why, etc.)
- Author entity signal
- Structured data types and completeness

### Security
HTTPS enforcement, HSTS header, Content-Security-Policy, X-Frame-Options,
X-Content-Type-Options, Referrer-Policy, Permissions-Policy, SSL/TLS certificate
validity, exposed .env file detection, third-party tracker audit.

### Performance (via Lighthouse)
LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), INP (Interaction
to Next Paint), FCP (First Contentful Paint), overall performance score,
accessibility score.

### Mobile
Viewport meta tag, favicon, Apple touch icon, web app manifest.

## FAQ

Q: How do I make my website appear in ChatGPT, Claude, and Perplexity?
A: AI search engines need three things: access (robots.txt must allow GPTBot,
ClaudeBot, and PerplexityBot), structure (FAQ schema, Organization sameAs, and
llms.txt help AI parse your content), and answer-first content (pages should
answer their main question in the first 130-170 words). Glook's AI Visibility
scan checks all of this automatically.

Q: What is GEO and how is it different from SEO?
A: SEO optimizes for clicks from search result pages. GEO (Generative Engine
Optimization) optimizes for citations within AI-generated answers from ChatGPT,
Claude, Perplexity, and Google AI Overview. Both matter in 2026 — AI search
handles over 40% of information queries.

Q: Is Glook free?
A: Yes. 3 scans per month are free, no credit card required. Pro ($14/mo) adds
unlimited scans, full AI fix prompts, PDF export, and weekly monitoring.

Q: How long does a scan take?
A: Initial findings appear in under 30 seconds. The full report with Lighthouse
scores and AI fix prompts takes 1-3 minutes.

Q: What fix prompts does Glook generate?
A: Each issue gets a specific, ready-to-paste prompt with file paths and code
examples for the detected tech stack. Prompts work with any AI assistant —
Claude, ChatGPT, or any tool you paste text into.

## Pages

- https://glook.dev/ — Homepage, run a free scan
- https://glook.dev/seo — SEO audit landing page
- https://glook.dev/security — Security audit landing page
- https://glook.dev/ai-visibility — AI visibility audit landing page
- https://glook.dev/pricing — Pricing plans (Free, Pro, Agency)
- https://glook.dev/roadmap — Product roadmap
- https://glook.dev/docs/api — REST API and MCP documentation
`

export function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
