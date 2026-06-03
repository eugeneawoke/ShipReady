import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteBrandLink } from '@/components/SiteHeader'
import { getCategoryStats } from '@/lib/aggregates/category-stats'

export const revalidate = 21600 // 6 hours

const SLUGS = [
  'performance', 'seo', 'security', 'mobile', 'ai-visibility',
  'accessibility', 'lcp', 'csp-headers', 'llms-txt', 'structured-data',
] as const

type Slug = typeof SLUGS[number]

const META: Record<Slug, { title: string; description: string; heading: string; body: string }> = {
  performance: {
    title: 'Website Performance Checker — Core Web Vitals & LCP | Glook',
    description: 'Check your site\'s Core Web Vitals, LCP, CLS, FCP, and TTFB. See how your performance compares to audited sites worldwide.',
    heading: 'Website Performance Audit',
    body: 'Glook measures Core Web Vitals (LCP, CLS, FCP, TTFB), JavaScript payload, render-blocking resources, and image optimization in a single free scan.',
  },
  seo: {
    title: 'Free SEO Checker — Meta Tags, Canonical, Structured Data | Glook',
    description: 'Audit your site\'s SEO fundamentals: meta tags, canonical URLs, structured data, heading hierarchy, and indexability. Free SEO checker.',
    heading: 'SEO Audit Checker',
    body: 'Glook audits title tags, meta descriptions, canonical links, robots directives, Open Graph tags, structured data, and sitemap presence.',
  },
  security: {
    title: 'Website Security Checker — Headers, HTTPS, Exposed Files | Glook',
    description: 'Scan your site for security vulnerabilities: missing HTTP headers, exposed .env files, API keys in HTML, HTTPS issues. Free security check.',
    heading: 'Website Security Check',
    body: 'Glook checks HSTS, CSP, X-Frame-Options, Referrer-Policy, HTTPS enforcement, exposed sensitive files, and API keys leaked in page source.',
  },
  mobile: {
    title: 'Mobile Readiness Checker — Tap Targets, Font Size | Glook',
    description: 'Check if your site is mobile-friendly: tap target sizes, font readability, viewport configuration. Free mobile audit.',
    heading: 'Mobile Readiness Audit',
    body: 'Glook audits viewport meta, tap target sizes, font sizes for readability, and Lighthouse mobile performance scores.',
  },
  'ai-visibility': {
    title: 'AI Visibility Checker — ChatGPT, Claude, Perplexity | Glook',
    description: 'Check if ChatGPT, Claude, and Perplexity can crawl and cite your site. Audit llms.txt, structured data, and AI crawler access.',
    heading: 'AI Visibility Audit',
    body: 'Glook checks llms.txt presence and validity, AI crawler access (GPTBot, ClaudeBot, PerplexityBot), FAQ schema, author entity, and answer-first content structure.',
  },
  accessibility: {
    title: 'Website Accessibility Checker — WCAG & A11y | Glook',
    description: 'Audit your site for common accessibility issues: alt text, ARIA labels, color contrast, form labels. Free accessibility check.',
    heading: 'Accessibility Audit',
    body: 'Glook checks image alt attributes, form label associations, ARIA landmark usage, and basic WCAG 2.1 compliance signals.',
  },
  lcp: {
    title: 'LCP Checker — Largest Contentful Paint | Glook',
    description: 'Check your Largest Contentful Paint score and find exactly what\'s slowing it down. Free LCP audit tool.',
    heading: 'LCP (Largest Contentful Paint) Checker',
    body: 'LCP measures how long it takes for the largest visible element to load. Glook identifies slow LCP and surfaces the exact cause — large images, render-blocking scripts, or slow server response.',
  },
  'csp-headers': {
    title: 'CSP Header Checker — Content Security Policy | Glook',
    description: 'Check if your Content Security Policy is set, enforced, and correct. Free CSP header checker.',
    heading: 'CSP Header Checker',
    body: 'A missing or report-only Content Security Policy leaves your site vulnerable to XSS attacks. Glook checks for CSP presence, mode (enforce vs report-only), and basic directive coverage.',
  },
  'llms-txt': {
    title: 'llms.txt Checker — AI Crawler Instructions | Glook',
    description: 'Check if your site has a valid llms.txt file. Help ChatGPT, Claude, and Perplexity understand your content.',
    heading: 'llms.txt Checker',
    body: 'llms.txt is the emerging standard for telling AI crawlers what your site is about and how to use it. Glook validates presence, format, and content quality.',
  },
  'structured-data': {
    title: 'Structured Data Checker — Schema.org JSON-LD | Glook',
    description: 'Validate your Schema.org structured data: required fields, types, and common errors. Free structured data checker.',
    heading: 'Structured Data Checker',
    body: 'Structured data helps Google and AI assistants understand your content. Glook checks for schema presence, required fields (name, description, url), and common implementation errors.',
  },
}

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return SLUGS.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!SLUGS.includes(slug as Slug)) return { title: 'Not Found — Glook' }
  const meta = META[slug as Slug]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev'
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `${appUrl}/check/${slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${appUrl}/check/${slug}`,
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
  }
}

export default async function CategoryCheckPage({ params }: Props) {
  const { slug } = await params
  if (!SLUGS.includes(slug as Slug)) notFound()

  const meta = META[slug as Slug]
  const stats = await getCategoryStats(slug)

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <header className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <SiteBrandLink />
          <Link
            href="/"
            className="rounded-lg bg-[#6E56CF] px-4 py-2 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
          >
            Audit your site →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F0EE]">{meta.heading}</h1>
          <p className="mt-3 text-base text-[#C9C8C3] leading-relaxed">{meta.body}</p>
        </div>

        {/* Live stats */}
        {stats.totalDomains > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Sites audited" value={String(stats.totalDomains)} />
            {stats.avgScore !== null && (
              <StatCard label="Avg score" value={`${Math.round(stats.avgScore)}/100`} />
            )}
            {stats.passRate !== null && (
              <StatCard label="Pass rate" value={`${Math.round(stats.passRate)}%`} />
            )}
          </div>
        )}

        {/* Common issues */}
        {stats.commonIssueIds.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#F1F0EE] mb-3">Most common issues found</h2>
            <ul className="space-y-2">
              {stats.commonIssueIds.map(id => (
                <li key={id} className="flex items-center gap-2 text-sm text-[#8B8A85]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C42] shrink-0" />
                  <code className="text-[#C9C8C3]">{id}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-white/[0.06] bg-[#161618] p-6 text-center">
          <p className="text-sm font-medium text-[#F1F0EE]">Check your site now — it&apos;s free</p>
          <p className="mt-1 text-xs text-[#8B8A85]">Results in under 60 seconds. No account required.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-[#6E56CF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
          >
            Run a free audit →
          </Link>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#161618] p-4 text-center">
      <p className="text-2xl font-bold text-[#6E56CF]">{value}</p>
      <p className="mt-1 text-xs text-[#8B8A85]">{label}</p>
    </div>
  )
}
