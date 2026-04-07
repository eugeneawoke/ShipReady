import * as cheerio from 'cheerio'
import type { Issue } from '@/types/scan'

export async function runAIVisibilityChecks(url: string, html: string): Promise<Issue[]> {
  const $ = cheerio.load(html)
  const issues: Issue[] = []
  const origin = new URL(url).origin

  // ─── AEO: Answer Engine Optimization ────────────────────────────────────────

  // 1. Schema.org JSON-LD
  const hasSchema = $('script[type="application/ld+json"]').length > 0
  if (!hasSchema) {
    issues.push({
      id: 'missing-schema-org',
      category: 'ai_visibility',
      severity: 'high',
      title: 'No structured data (Schema.org)',
      description: 'No JSON-LD schema markup found.',
      plainEnglish:
        'AI assistants like ChatGPT and Perplexity extract page info using structured data. Without it, they struggle to understand what your product does and are less likely to mention it.',
      cursorPrompt: `Add JSON-LD schema to your Next.js layout:
\`\`\`tsx
// app/layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Your Product Name",
    "description": "What your product does in one sentence",
    "url": "https://yoursite.com",
    "applicationCategory": "WebApplication",
    "offers": { "@type": "Offer", "price": "0" }
  }
  return (
    <html>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
\`\`\``,
      boltPrompt: `Add this inside your HTML <head>:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "YOUR SITE NAME",
  "url": "https://YOURDOMAIN.com",
  "description": "What your site does"
}
</script>`,
      docsUrl: 'https://schema.org/docs/gs.html',
    })
  }

  // 2. FAQ schema when FAQ content exists but no FAQPage schema
  const bodyText = $('body').text().toLowerCase()
  const hasFAQContent =
    bodyText.includes('frequently asked') ||
    bodyText.includes('faq') ||
    $('[id*="faq" i], [class*="faq" i]').length > 0

  if (hasFAQContent) {
    const hasFAQSchema =
      $('script[type="application/ld+json"]').filter((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? '{}')
          const types = Array.isArray(data) ? data.map((d) => d['@type']) : [data['@type']]
          return types.includes('FAQPage')
        } catch {
          return false
        }
      }).length > 0

    if (!hasFAQSchema) {
      issues.push({
        id: 'missing-faq-schema',
        category: 'ai_visibility',
        severity: 'medium',
        title: 'FAQ content without FAQ schema',
        description: 'FAQ section detected but no FAQPage schema markup.',
        plainEnglish:
          "You have FAQ content but haven't marked it up for AI engines. Google and AI assistants use FAQ schema to show your Q&As directly in search results and AI-generated answers.",
        cursorPrompt: `Add FAQPage schema to your page:
\`\`\`ts
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [Your Product]?",
      "acceptedAnswer": { "@type": "Answer", "text": "Your answer here" }
    }
    // add more Q&A pairs
  ]
}
// Add <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
\`\`\``,
        boltPrompt: `Add this inside <head> for your FAQ section:
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"YOUR QUESTION","acceptedAnswer":{"@type":"Answer","text":"YOUR ANSWER"}}]}
</script>`,
        docsUrl:
          'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
      })
    }
  }

  // 3. Heading hierarchy
  let prevLevel = 0
  let hierarchyBroken = false
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const level = parseInt((el as unknown as { tagName: string }).tagName[1])
    if (prevLevel > 0 && level > prevLevel + 1) {
      hierarchyBroken = true
      return false
    }
    prevLevel = level
    return true
  })
  if (hierarchyBroken) {
    issues.push({
      id: 'poor-heading-hierarchy',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'Heading hierarchy is broken',
      description: 'Headings skip levels (e.g. H1 → H3 without H2).',
      plainEnglish:
        'Your headings jump levels (e.g. H1 → H3). AI models use heading structure to understand your content outline — broken hierarchy makes your content harder to parse and cite.',
      cursorPrompt: `Fix heading hierarchy — headings must not skip levels:
- H1 → H2 ✓  |  H1 → H3 ✗ (skipped H2)
Search your components for h3/h4 that appear without a parent h2/h3.
If you styled an h3 to look bigger, use an h2 with a className instead — never skip levels for visual reasons.`,
      boltPrompt: `Check all heading tags on your page:
- One H1 for the page title
- H2s for main sections
- H3s only inside H2 sections
- Never jump from H1 directly to H3`,
    })
  }

  // 4. Thin content
  const wordCount = $('body')
    .text()
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  if (wordCount < 300) {
    issues.push({
      id: 'thin-content',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'Not enough text content',
      description: `Only ~${wordCount} words of text found.`,
      plainEnglish: `Your page has only ~${wordCount} words. AI assistants need text to understand and cite your product. Pages with fewer than 300 words rarely appear in AI-generated answers.`,
      cursorPrompt: `Add more descriptive text to your landing page:
- Expand the hero with a 2–3 sentence product description
- Add a "How it works" section with step-by-step text
- Add customer benefits in paragraph form, not just icon + label
- Consider a short use-case or testimonial section
Target: 300–800 words minimum for AI indexability`,
      boltPrompt: `Your page needs more text. Add:
1. A clear paragraph describing what your product does
2. A "How it works" section with 3–4 steps in text form
3. A benefits section with written descriptions (not just icons)`,
      value: `${wordCount} words`,
    })
  }

  // ─── GEO: Generative Engine Optimization ────────────────────────────────────

  // 5. /llms.txt
  try {
    const r = await fetch(`${origin}/llms.txt`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
    })
    if (r.status !== 200) throw new Error('not found')
  } catch {
    issues.push({
      id: 'missing-llms-txt',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'No llms.txt file',
      description: 'No /llms.txt found — emerging standard for LLM crawlers.',
      plainEnglish:
        'llms.txt is a new standard (like robots.txt but for AI) that tells ChatGPT, Claude, and Perplexity what your product is and what content to use. Early adopters get an edge in AI-generated answers.',
      cursorPrompt: `Create public/llms.txt in your Next.js project:
\`\`\`
# YOUR PRODUCT NAME

> One-line description of what your product does

## Product
- Main URL: https://yoursite.com
- What it does: [core value proposition]
- Target audience: [who it's for]

## Key Pages
- [Home](https://yoursite.com)
- [Pricing](https://yoursite.com/pricing)
- [About](https://yoursite.com/about)
\`\`\``,
      boltPrompt: `Create a file called llms.txt in your website's public folder:
# YOUR SITE NAME
> Short description of what you do

## Main sections
- Homepage: https://yoursite.com
- What we do: [brief explanation]`,
      docsUrl: 'https://llmstxt.org',
    })
  }

  // 6. AI crawlers blocked in robots.txt
  const aiCrawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'anthropic-ai']
  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(4000),
    })
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text()
      const lines = robotsText.split('\n').map((l) => l.trim())
      const blocked: string[] = []

      for (const bot of aiCrawlers) {
        let inBotSection = false
        for (const line of lines) {
          if (line.toLowerCase().startsWith('user-agent:')) {
            inBotSection = line.toLowerCase().includes(bot.toLowerCase())
          }
          if (inBotSection && line.toLowerCase().startsWith('disallow: /')) {
            blocked.push(bot)
            break
          }
        }
      }

      if (blocked.length > 0) {
        issues.push({
          id: 'ai-crawlers-blocked',
          category: 'ai_visibility',
          severity: 'high',
          title: 'AI crawlers blocked in robots.txt',
          description: `Blocked: ${blocked.join(', ')}`,
          plainEnglish: `Your robots.txt blocks ${blocked.join(', ')}. These are the crawlers used by ChatGPT, Claude, and Perplexity. Blocking them means your site won't appear in AI-generated answers.`,
          cursorPrompt: `Update your public/robots.txt to allow AI crawlers:
\`\`\`
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /
\`\`\`
Remove any existing Disallow: / lines for these bots.`,
          boltPrompt: `In your robots.txt, remove Disallow: / lines under these User-agents (or add Allow: /):
- GPTBot (ChatGPT)
- ClaudeBot (Claude/Anthropic)
- PerplexityBot
- CCBot`,
          value: blocked.join(', '),
        })
      }
    }
  } catch {}

  // 7. sitemap.xml
  const hasSitemapInHead = !!$('link[rel="sitemap"]').attr('href')
  let hasSitemapFile = false
  try {
    const r = await fetch(`${origin}/sitemap.xml`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
    })
    hasSitemapFile = r.status === 200
  } catch {}

  if (!hasSitemapInHead && !hasSitemapFile) {
    issues.push({
      id: 'missing-sitemap',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'No sitemap.xml found',
      description: 'No sitemap.xml at /sitemap.xml and none referenced in <head>.',
      plainEnglish:
        'AI crawlers use your sitemap to discover all your pages. Without one, they may miss blog posts, case studies, or feature pages that would make them cite you more often.',
      cursorPrompt: `Add a dynamic sitemap to your Next.js app:
\`\`\`ts
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://yoursite.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://yoursite.com/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]
}
\`\`\``,
      boltPrompt: `Create sitemap.xml in your public folder:
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://YOURDOMAIN.com/</loc><priority>1.0</priority></url>
  <url><loc>https://YOURDOMAIN.com/pricing</loc><priority>0.8</priority></url>
</urlset>`,
      docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap',
    })
  }

  // 8. Author/brand entity
  const hasAboutLink = $('a[href*="about" i], a[href*="team" i]').length > 0
  const hasContactLink = $('a[href*="contact" i]').length > 0
  const hasOrgSchema =
    $('script[type="application/ld+json"]').filter((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '{}')
        const types = Array.isArray(data) ? data.map((d) => d['@type']) : [data['@type']]
        return types.some((t) => ['Organization', 'Person', 'Brand'].includes(t))
      } catch {
        return false
      }
    }).length > 0

  if (!hasAboutLink && !hasContactLink && !hasOrgSchema) {
    issues.push({
      id: 'missing-author-entity',
      category: 'ai_visibility',
      severity: 'low',
      title: 'No brand/author entity signals',
      description: 'No About page, contact link, or Organization schema found.',
      plainEnglish:
        'AI systems prefer citing sources they can identify as real, trustworthy entities. An About page, contact info, or Organization schema tells AI "this is a real product by real people."',
      cursorPrompt: `Add Organization schema to establish brand entity:
\`\`\`ts
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "hello@yoursite.com",
    "contactType": "customer support"
  }
}
\`\`\`
Also add an /about page with your name, background, and why you built this.`,
      boltPrompt: `Add to your HTML <head>:
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"YOUR NAME","url":"https://YOURDOMAIN.com","email":"YOUR@EMAIL.com"}
</script>
Also add an "About" link in your navigation.`,
    })
  }

  return issues
}
