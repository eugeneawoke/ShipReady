import * as cheerio from 'cheerio'
import type { AIPlatformReadiness, AIPlatformStatus, BusinessContext, Issue, TrustSignals } from '@/types/scan'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'
import { T } from '@/lib/ai/issue-templates'

function parseJsonLdTypes(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    const values = Array.isArray(data) ? data : [data]
    return values
      .map(item => item?.['@type'])
      .flatMap((type) => Array.isArray(type) ? type : [type])
      .filter((type): type is string => typeof type === 'string')
  } catch {
    return []
  }
}

function getReadableBodyText($: cheerio.CheerioAPI) {
  const body = $('body').clone()
  body.find('script, style, noscript, template').remove()
  return body.text().replace(/\s+/g, ' ').trim()
}

function parseRobotsBlock(robotsText: string, bot: string) {
  const lines = robotsText
    .split('\n')
    .map(line => line.replace(/#.*/, '').trim())
    .filter(Boolean)

  const sections: Array<{ agents: string[]; rules: string[] }> = []
  let current: { agents: string[]; rules: string[] } | null = null

  for (const line of lines) {
    const [rawField, ...rest] = line.split(':')
    const field = rawField?.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (!field || !value) continue

    if (field === 'user-agent') {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] }
        sections.push(current)
      }
      current.agents.push(value.toLowerCase())
      continue
    }

    if (!current) continue
    current.rules.push(`${field}:${value.toLowerCase()}`)
  }

  const candidates = sections.filter(section =>
    section.agents.includes(bot.toLowerCase()) || section.agents.includes('*'),
  )

  return candidates.some(section => section.rules.includes('disallow:/'))
}

function buildPlatformReadiness(
  robotsTxt: string | null,
  hasLlmsTxt: boolean,
  hasSchemaOrg: boolean,
): AIPlatformReadiness {
  const bots: Record<keyof AIPlatformReadiness, string[]> = {
    chatgpt: ['GPTBot', 'OAI-SearchBot'],
    claude: ['ClaudeBot', 'anthropic-ai'],
    perplexity: ['PerplexityBot'],
    googleAI: ['Googlebot'],
  }

  function getPlatformStatus(botNames: string[]): AIPlatformStatus {
    if (!robotsTxt) return 'partial'
    const isBlocked = botNames.some(bot => parseRobotsBlock(robotsTxt, bot))
    if (isBlocked) return 'blocked'
    if (hasLlmsTxt && hasSchemaOrg) return 'ready'
    return 'partial'
  }

  return {
    chatgpt: getPlatformStatus(bots.chatgpt),
    claude: getPlatformStatus(bots.claude),
    perplexity: getPlatformStatus(bots.perplexity),
    googleAI: getPlatformStatus(bots.googleAI),
  }
}

async function getDomainAgeDays(hostname: string): Promise<number | null> {
  try {
    const { fetchSafeResource } = await import('@/lib/checks/fetch-context')
    const res = await fetchSafeResource(`https://rdap.org/domain/${hostname}`, {
      signal: AbortSignal.timeout(3500),
    })
    if (!res.ok) return null
    const data = await res.json() as { events?: Array<{ eventAction: string; eventDate: string }> }
    const regEvent = data.events?.find(e => e.eventAction === 'registration')
    if (!regEvent?.eventDate) return null
    const ageMs = Date.now() - new Date(regEvent.eventDate).getTime()
    return Math.floor(ageMs / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

async function getRedditMentionCount(hostname: string): Promise<number | null> {
  try {
    const { fetchSafeResource } = await import('@/lib/checks/fetch-context')
    const encodedQuery = encodeURIComponent(`site:${hostname}`)
    const res = await fetchSafeResource(
      `https://www.reddit.com/search.json?q=${encodedQuery}&limit=5&type=link`,
      {
        headers: { 'User-Agent': 'ShipReady-Audit/1.0 (web audit tool)' },
        signal: AbortSignal.timeout(4000),
      },
    )
    if (!res.ok) return null
    const data = await res.json() as { data?: { dist?: number } }
    return data?.data?.dist ?? 0
  } catch {
    return null
  }
}

async function getGithubRepoCount(hostname: string): Promise<number | null> {
  try {
    const { fetchSafeResource } = await import('@/lib/checks/fetch-context')
    const query = encodeURIComponent(hostname.replace(/^www\./, ''))
    const res = await fetchSafeResource(
      `https://api.github.com/search/repositories?q=${query}&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'ShipReady-Audit/1.0',
        },
        signal: AbortSignal.timeout(4000),
      },
    )
    if (!res.ok) return null
    const data = await res.json() as { total_count?: number }
    return data?.total_count ?? 0
  } catch {
    return null
  }
}

async function searchSerper(query: string): Promise<number> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return 0
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 3 }),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return 0
    const data = await res.json() as { organic?: unknown[] }
    return data?.organic?.length ?? 0
  } catch {
    return 0
  }
}

export async function runAIVisibilityChecks(
  url: string,
  html: string,
  options?: { includeLikely?: boolean; includeHeuristics?: boolean; businessContext?: BusinessContext | null },
): Promise<{ issues: Issue[]; platformReadiness: AIPlatformReadiness; trustSignals: TrustSignals }> {
  const includeLikely = options?.includeLikely ?? true
  const includeHeuristics = options?.includeHeuristics ?? true
  const $ = cheerio.load(html)
  const issues: Issue[] = []
  const origin = new URL(url).origin
  const readableBodyText = getReadableBodyText($)
  const jsonLdScripts = $('script[type="application/ld+json"]').toArray()

  const hasJsonLd = jsonLdScripts.length > 0
  const hasMicrodata =
    $('[itemscope][itemtype*="schema.org" i], [itemtype*="schema.org" i], [vocab*="schema.org" i]').length > 0

  if (!hasJsonLd && !hasMicrodata) {
    issues.push(withIssueMeta({
      id: 'missing-schema-org',
      category: 'ai_visibility',
      severity: 'high',
      title: 'No structured data (Schema.org)',
      description: 'No Schema.org markup found in JSON-LD or microdata form.',
      plainEnglish: 'AI assistants and search engines use structured data to understand what your product is. Without it, they have less reliable context.',
      fixPrompt: 'Add Schema.org markup for your product or organization in app metadata/layout so AI and search engines can identify the page correctly.',
      docsUrl: 'https://schema.org/docs/gs.html',
    }, 'ai-visibility', [evidence('selector', 'Schema.org markup', 'missing')]))
  }

  // Require actual Q&A structure — not just the word "FAQ" appearing anywhere in copy
  const hasFAQSection = $('[id="faq"], [id="faqs"], [id="faq-section"]').length > 0
  const hasAccordion = $('details').length >= 2
  const hasFAQHeading = $('h1,h2,h3,h4,h5,h6').toArray().some(el => {
    const text = $(el).text().toLowerCase().trim()
    return text === 'faq' || text === 'faqs' || text.startsWith('frequently asked')
  })
  const hasFAQContent = hasFAQSection || hasAccordion || hasFAQHeading

  const hasFAQSchema = jsonLdScripts.some((el) => parseJsonLdTypes($(el).html()).includes('FAQPage'))

  // Ghost schema: FAQPage in markup but no real visible Q&A content
  if (hasFAQSchema && !hasFAQContent) {
    issues.push(withIssueMeta({
      id: 'ghost-faq-schema',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'FAQ schema present but no visible FAQ section',
      description: 'FAQPage structured data found in the page, but no matching visible Q&A content was detected.',
      plainEnglish: 'Your page has FAQ structured data but no actual FAQ accordion or Q&A section. Google may penalise this as misleading markup.',
      fixPrompt: 'Either add a real visible FAQ accordion to the page that matches the schema, or remove the FAQPage schema from the head.',
      docsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
    }, 'ai-visibility', [evidence('selector', 'FAQPage schema', 'present without visible Q&A content')]))
  }

  if (includeLikely && hasFAQContent && !hasFAQSchema) {
    issues.push(withIssueMeta({
      id: 'missing-faq-schema',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'FAQ section found but no FAQ schema',
      description: 'A FAQ section was detected but FAQPage structured data was not found.',
      plainEnglish: 'You have a real FAQ section, but it is not marked up for machines. Adding FAQPage schema increases the chance of reuse in search and AI answers.',
      fixPrompt: 'Add FAQPage schema to match the visible questions and answers in your FAQ section.',
      docsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
    }, 'ai-visibility', [evidence('selector', 'FAQ section', 'found without schema')]))
  }

  let prevLevel = 0
  let hierarchyBroken = false
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const tag = $(el).prop('tagName')?.toLowerCase() ?? ''
    const level = Number.parseInt(tag.replace('h', ''), 10)
    if (Number.isNaN(level)) return
    if (prevLevel > 0 && level > prevLevel + 1) {
      hierarchyBroken = true
      return false
    }
    prevLevel = level
  })

  if (includeLikely && hierarchyBroken) {
    issues.push(withIssueMeta({
      id: 'poor-heading-hierarchy',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'Heading hierarchy is broken',
      description: 'Headings skip levels (for example H1 → H3).',
      plainEnglish: 'The page outline skips heading levels. That makes machine parsing and assistive reading less reliable.',
      fixPrompt: 'Fix heading levels so the content outline moves sequentially without skipping levels.',
    }, 'ai-visibility', [evidence('text', 'Heading hierarchy', 'skipped level detected')]))
  }

  const wordCount = readableBodyText.split(/\s+/).filter(Boolean).length
  if (includeHeuristics && wordCount < 300) {
    issues.push(withIssueMeta({
      id: 'thin-content',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'Not enough readable text content',
      description: `Only about ${wordCount} readable words found.`,
      plainEnglish: `This page has only about ${wordCount} readable words after ignoring scripts and styles. That may be too little context for AI systems and search engines.`,
      fixPrompt: 'Add more readable explanatory content for humans: what the product does, who it is for, and how it works.',
      value: `${wordCount} words`,
    }, 'ai-visibility', [evidence('count', 'Readable word count', wordCount)]))
  }

  let llmsTxtBody: string | null = null
  try {
    const { fetchSafeResource } = await import('@/lib/checks/fetch-context')
    const llmsRes = await fetchSafeResource(`${origin}/llms.txt`, { signal: AbortSignal.timeout(2500) })
    if (!llmsRes.ok) {
      issues.push(withIssueMeta({
        id: 'missing-llms-txt',
        category: 'ai_visibility',
        severity: 'medium',
        title: 'No llms.txt file',
        description: 'No llms.txt was found.',
        plainEnglish: 'An llms.txt file can help AI systems understand which product pages and context to prefer.',
        fixPrompt: 'Create a public llms.txt file that lists the core product pages and a short product description.',
        docsUrl: 'https://llmstxt.org',
      }, 'ai-visibility', [evidence('response', 'llms.txt status', llmsRes.status)]))
    } else {
      llmsTxtBody = await llmsRes.text()
    }
  } catch {
    issues.push(withIssueMeta({
      id: 'missing-llms-txt',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'No llms.txt file',
      description: 'No llms.txt was found.',
      plainEnglish: 'An llms.txt file can help AI systems understand which product pages and context to prefer.',
      fixPrompt: 'Create a public llms.txt file that lists the core product pages and a short product description.',
      docsUrl: 'https://llmstxt.org',
    }, 'ai-visibility'))
  }

  if (llmsTxtBody && includeHeuristics) {
    const wordCount = llmsTxtBody.trim().split(/\s+/).length
    if (wordCount < 100) {
      issues.push(withIssueMeta(
        { ...T['thin-llms-txt'], value: `${wordCount} words` },
        'http',
        [evidence('count', 'llms.txt word count', wordCount), evidence('text', 'Recommended minimum', '100 words')],
      ))
    }
  }

  if (llmsTxtBody && includeLikely) {
    const hasDescription = /^>\s+\S/m.test(llmsTxtBody)
    if (!hasDescription) {
      issues.push(withIssueMeta(
        { ...T['llms-txt-no-description'] },
        'http',
        [evidence('text', 'llms.txt', 'no > description line found')],
      ))
    }

    if (includeHeuristics) {
      const hasSections = /^##\s+\S/m.test(llmsTxtBody)
      if (!hasSections) {
        issues.push(withIssueMeta(
          { ...T['llms-txt-no-sections'] },
          'http',
          [evidence('text', 'llms.txt', 'no ## section headings found')],
        ))
      }
    }

    const urlPattern = /\]\((https?:\/\/[^)]+)\)|^-\s+(https?:\/\/\S+)/gm
    const linkedUrls: string[] = []
    let urlMatch: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((urlMatch = urlPattern.exec(llmsTxtBody)) !== null) {
      const found = urlMatch[1] ?? urlMatch[2]
      if (found) linkedUrls.push(found)
    }

    const urlsToCheck = linkedUrls.slice(0, 5)
    const brokenUrls: string[] = []
    for (const linkedUrl of urlsToCheck) {
      try {
        const { fetchSafeResource: fetchCheck } = await import('@/lib/checks/fetch-context')
        const res = await fetchCheck(linkedUrl, { signal: AbortSignal.timeout(2500) })
        if (!res.ok) brokenUrls.push(linkedUrl)
      } catch {
        brokenUrls.push(linkedUrl)
      }
    }

    if (brokenUrls.length > 0) {
      issues.push(withIssueMeta(
        { ...T['llms-txt-broken-links'], value: `${brokenUrls.length} broken` },
        'http',
        [
          evidence('count', 'Broken links in llms.txt', brokenUrls.length),
          evidence('text', 'First broken URL', brokenUrls[0].slice(0, 80)),
        ],
      ))
    }
  }

  let robotsTxt: string | null = null
  try {
    const { fetchSafeResource: fetchSafeResourceRobots } = await import('@/lib/checks/fetch-context')
    const robotsRes = await fetchSafeResourceRobots(`${origin}/robots.txt`, { signal: AbortSignal.timeout(2500) })
    if (robotsRes.ok) {
      robotsTxt = await robotsRes.text()

      const perBotChecks: Array<{ bot: string | string[]; issueId: string; label: string }> = [
        { bot: 'OAI-SearchBot', issueId: 'oai-searchbot-blocked', label: 'OAI-SearchBot' },
        { bot: 'GPTBot', issueId: 'gptbot-blocked', label: 'GPTBot' },
        { bot: ['ClaudeBot', 'anthropic-ai'], issueId: 'claudebot-blocked', label: 'ClaudeBot' },
        { bot: 'PerplexityBot', issueId: 'perplexitybot-blocked', label: 'PerplexityBot' },
        { bot: 'DeepSeekBot', issueId: 'deepseekbot-blocked', label: 'DeepSeekBot' },
      ]

      for (const { bot, issueId, label } of perBotChecks) {
        const bots = Array.isArray(bot) ? bot : [bot]
        const isBlocked = bots.some(b => parseRobotsBlock(robotsTxt!, b))
        if (isBlocked) {
          if (issueId === 'deepseekbot-blocked' && !includeHeuristics) continue
          issues.push(withIssueMeta(
            { ...T[issueId] },
            'ai-visibility',
            [evidence('text', `${label} in robots.txt`, 'Disallow: /')],
          ))
        }
      }
    }
  } catch {
    // ignore robots fetch failures
  }

  const hasSitemapInHead = !!$('link[rel="sitemap"]').attr('href')
  let hasSitemapFile = false
  try {
    const { fetchWithHeadFallback } = await import('@/lib/checks/fetch-context')
    const sitemapResult = await fetchWithHeadFallback(`${origin}/sitemap.xml`, 2500)
    hasSitemapFile = sitemapResult.ok
  } catch {
    hasSitemapFile = false
  }

  if (!hasSitemapInHead && !hasSitemapFile) {
    issues.push(withIssueMeta({
      id: 'missing-sitemap',
      category: 'ai_visibility',
      severity: 'medium',
      title: 'No sitemap.xml found',
      description: 'No sitemap.xml at /sitemap.xml and none referenced in the document.',
      plainEnglish: 'A sitemap helps crawlers discover the pages you want cited and indexed.',
      fixPrompt: 'Expose a sitemap.xml endpoint or static file that covers the important public pages. In Next.js, create app/sitemap.ts and export a default function returning your URLs.\n\nAfter creating sitemap.xml:\n• Submit to Google: Search Console → Sitemaps → Add\n• Submit to Яндекс: Яндекс Вебмастер → Индексирование → Файлы Sitemap',
      docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap',
    }, 'ai-visibility', [evidence('selector', 'sitemap.xml', 'missing')]))
  }

  const hasAboutLink = $('a[href*="/about" i], a[href="/about"], a[href*="/team" i], a[href="/team"]').length > 0
  const hasContactLink = $('a[href*="/contact" i], a[href="/contact"]').length > 0
  const hasOrgSchema = jsonLdScripts.some((el) => {
    const types = parseJsonLdTypes($(el).html())
    return types.some((type) => ['Organization', 'Person', 'Brand'].includes(type))
  })

  if (includeHeuristics && !hasAboutLink && !hasContactLink && !hasOrgSchema) {
    issues.push(withIssueMeta({
      id: 'missing-author-entity',
      category: 'ai_visibility',
      severity: 'low',
      title: 'Weak brand or author entity signals',
      description: 'No About page, contact page, or Organization/Person schema was found.',
      plainEnglish: 'The site does not expose many signals that identify the people or organization behind it.',
      fixPrompt: 'Add stronger organization/person signals such as About, Contact, or Organization schema.',
    }, 'ai-visibility', [evidence('text', 'Entity signals', 'missing about/contact/org schema')]))
  }

  // ── geo-missing-org-sameas ──────────────────────────────
  let hasOrgSchemaBlock = false
  let orgHasSameAs = false

  for (const block of jsonLdScripts) {
    try {
      const raw = $(block).html()
      if (!raw) continue
      const data = JSON.parse(raw)
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item?.['@type'] === 'Organization') {
          hasOrgSchemaBlock = true
          const sameAs = item?.sameAs
          if (Array.isArray(sameAs) && sameAs.length > 0) orgHasSameAs = true
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  if (includeLikely && hasOrgSchemaBlock && !orgHasSameAs) {
    issues.push(withIssueMeta(
      { ...T['geo-missing-org-sameas'] },
      'ai-visibility',
      [evidence('selector', 'Organization @type sameAs', 'missing')],
    ))
  }

  // ── geo-missing-date-signal ─────────────────────────────
  let hasDateInSchema = false
  for (const block of jsonLdScripts) {
    try {
      const raw = $(block).html()
      if (!raw) continue
      const data = JSON.parse(raw)
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item?.datePublished || item?.dateModified) hasDateInSchema = true
      }
    } catch { /* skip */ }
  }

  const hasArticlePublishedTime =
    !!$('meta[property="article:published_time"]').attr('content') ||
    !!$('meta[property="article:modified_time"]').attr('content')

  const hasTimeElement = $('body time[datetime]')
    .toArray()
    .some(el => {
      const dt = $(el).attr('datetime')
      return typeof dt === 'string' && dt.length >= 10
    })

  if (!hasDateInSchema && !hasArticlePublishedTime && !hasTimeElement) {
    issues.push(withIssueMeta(
      { ...T['geo-missing-date-signal'] },
      'dom',
      [evidence('selector', 'datePublished / article:published_time / time[datetime]', 'all absent')],
    ))
  }

  // ── geo-no-question-headings ────────────────────────────
  if (includeHeuristics) {
    const questionPattern = /^(what|how|why|when|who|which|can|is|are|does|do|will|should|where)\b/i
    const subheadings = $('h2, h3').toArray()

    if (subheadings.length > 0) {
      const hasQuestionHeading = subheadings.some(el => {
        const text = $(el).text().trim()
        return questionPattern.test(text) || text.endsWith('?')
      })

      if (!hasQuestionHeading) {
        issues.push(withIssueMeta(
          { ...T['geo-no-question-headings'] },
          'dom',
          [
            evidence('count', 'H2/H3 headings found', subheadings.length),
            evidence('selector', 'Question-format heading', 'none found'),
          ],
        ))
      }
    }
  }

  // ── geo-answer-first-paragraph ──────────────────────────
  if (includeHeuristics) {
    const bodyClone = $('body').clone()
    bodyClone.find('nav, header, footer, aside, script, style, noscript').remove()

    const firstMeaningfulP = bodyClone.find('p').toArray().find(el => {
      const text = $(el).text().trim()
      return text.split(/\s+/).length > 10
    })

    if (!firstMeaningfulP) {
      issues.push(withIssueMeta(
        { ...T['geo-answer-first-paragraph'] },
        'dom',
        [evidence('selector', 'First meaningful paragraph', 'not found')],
      ))
    } else {
      const wordCount = $(firstMeaningfulP).text().trim().split(/\s+/).length
      if (wordCount < 50) {
        issues.push(withIssueMeta(
          { ...T['geo-answer-first-paragraph'], value: `${wordCount} words` },
          'dom',
          [evidence('count', 'First paragraph word count', wordCount)],
        ))
      }
    }
  }

  // ── Semantic HTML / AI readability ──────────────────────────
  if (includeLikely) {
    const hasMain = $('main').length > 0
    const hasArticle = $('article').length > 0
    const hasSection = $('section').length > 0

    if (!hasMain && !hasArticle && !hasSection) {
      issues.push(withIssueMeta(
        { ...T['no-semantic-html'] },
        'dom',
        [evidence('selector', '<main>, <article>, <section>', 'none found')],
      ))
    }

    const rawWordCount = readableBodyText.split(/\s+/).filter(Boolean).length
    const hasReactRoot = $('div#root, div#app, div#__next').length > 0
    if (!hasReactRoot && rawWordCount < 100) {
      issues.push(withIssueMeta(
        { ...T['content-js-only'], value: `${rawWordCount} words in HTML` },
        'dom',
        [evidence('count', 'Readable words in raw HTML', rawWordCount)],
      ))
    }
  }

  // ── Schema required fields validation ───────────────────────
  if (includeLikely && hasJsonLd) {
    const REQUIRED_FIELDS: Record<string, string[]> = {
      Organization: ['name', 'url'],
      Person: ['name'],
      Product: ['name', 'offers'],
      Article: ['headline', 'author', 'datePublished'],
      BlogPosting: ['headline', 'author', 'datePublished'],
      FAQPage: ['mainEntity'],
      SoftwareApplication: ['name', 'applicationCategory'],
      LocalBusiness: ['name', 'address'],
      WebSite: ['name', 'url'],
    }

    for (const block of jsonLdScripts) {
      try {
        const raw = $(block).html()
        if (!raw) continue
        const data = JSON.parse(raw)
        const items = Array.isArray(data) ? data : [data]

        for (const item of items) {
          const schemaType = item?.['@type']
          if (typeof schemaType !== 'string') continue
          const required = REQUIRED_FIELDS[schemaType]
          if (!required) continue

          const missingFields = required.filter(field => !item[field])
          if (missingFields.length > 0) {
            issues.push(withIssueMeta(
              { ...T['schema-missing-required-fields'], value: `${schemaType}: missing ${missingFields.join(', ')}` },
              'dom',
              [
                evidence('text', 'Schema type', schemaType),
                evidence('text', 'Missing required fields', missingFields.join(', ')),
              ],
            ))
            break
          }
        }
      } catch {
        // skip malformed JSON-LD
      }
    }
  }

  const platformReadiness = buildPlatformReadiness(
    robotsTxt,
    llmsTxtBody !== null,
    hasJsonLd || hasMicrodata,
  )

  // ── Trust Signals (external API checks — only in deep/heuristic pass) ───────
  const trustSignals: TrustSignals = {}

  if (includeHeuristics) {
    const hostname = new URL(url).hostname

    // Domain age via RDAP (public, no auth)
    const domainAgeDays = await getDomainAgeDays(hostname)
    trustSignals.domainAgedays = domainAgeDays
    if (domainAgeDays !== null && domainAgeDays < 180) {
      issues.push(withIssueMeta(
        { ...T['young-domain'], value: `${domainAgeDays} days old` },
        'http',
        [evidence('text', 'Domain age via RDAP', `${domainAgeDays} days`)],
      ))
    }

    // Reddit mentions (public JSON API, no auth)
    const redditMentions = await getRedditMentionCount(hostname)
    trustSignals.redditMentions = redditMentions
    if (redditMentions !== null && redditMentions === 0) {
      issues.push(withIssueMeta(
        { ...T['no-reddit-presence'] },
        'http',
        [evidence('count', 'Reddit mentions for domain', 0)],
      ))
    }

    // GitHub presence — only for SaaS/tech products
    const businessType = options?.businessContext?.businessType
    const isTechProduct = businessType === 'saas' || businessType === 'other' || businessType === 'blog'
    if (isTechProduct) {
      const githubRepos = await getGithubRepoCount(hostname)
      trustSignals.githubRepos = githubRepos
      if (githubRepos !== null && githubRepos === 0) {
        issues.push(withIssueMeta(
          { ...T['no-github-presence'] },
          'http',
          [evidence('count', 'GitHub repos matching domain', 0)],
        ))
      }
    }

    // G2 + Product Hunt via Serper (graceful fallback if SERPER_API_KEY absent)
    if (process.env.SERPER_API_KEY && isTechProduct) {
      const domain = hostname.replace(/^www\./, '')

      const g2Count = await searchSerper(`site:g2.com "${domain}"`)
      trustSignals.g2Listed = g2Count > 0
      if (!trustSignals.g2Listed && includeLikely) {
        issues.push(withIssueMeta(
          { ...T['no-g2-listing'] },
          'http',
          [evidence('text', 'G2/Capterra listing', 'not found')],
        ))
      }

      const phCount = await searchSerper(`site:producthunt.com "${domain}"`)
      trustSignals.productHuntListed = phCount > 0
      if (!trustSignals.productHuntListed) {
        issues.push(withIssueMeta(
          { ...T['no-producthunt-listing'] },
          'http',
          [evidence('text', 'Product Hunt listing', 'not found')],
        ))
      }
    }
  }

  return { issues, platformReadiness, trustSignals }
}
