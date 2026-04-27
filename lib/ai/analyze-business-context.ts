import OpenAI from 'openai'
import type { BusinessContext } from '@/types/scan'

const STACK_SIGNATURES: Array<[string, RegExp[]]> = [
  ['Shopify', [/cdn\.shopify\.com/i, /shopify-checkout-api-token/i, /Shopify\.theme/]],
  ['WordPress', [/\/wp-content\//i, /\/wp-includes\//i]],
  ['Next.js', [/__NEXT_DATA__/, /__next\//]],
  ['Webflow', [/assets\.website-files\.com/i, /\.webflow\.com/i]],
  ['Framer', [/framer\.com/i, /framerusercontent\.com/i]],
  ['Wix', [/wixstatic\.com/i, /wix\.com\/corvid/i]],
  ['Squarespace', [/squarespace\.com/i, /sqspcdn\.com/i]],
  ['Tailwind', [/cdn\.tailwindcss\.com/i]],
  ['React', [/react\.production\.min\.js/i, /__reactFiber/]],
]

const VALID_BUSINESS_TYPES = [
  'ecommerce', 'saas', 'local_business', 'portfolio', 'blog', 'agency', 'other',
] as const

function detectTechStack(html: string, headers: Record<string, string>): string[] {
  const detected: string[] = []
  for (const [name, patterns] of STACK_SIGNATURES) {
    if (patterns.some(p => p.test(html))) detected.push(name)
  }
  if (headers['x-vercel-id']) detected.push('Vercel')
  if (headers['x-nf-request-id']) detected.push('Netlify')
  return [...new Set(detected)]
}

function extractMainCTA(html: string): string | null {
  const matches = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)]
  for (const m of matches) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text.length > 1 && text.length < 50) return text
  }
  return null
}

interface PageSignals {
  title: string
  description: string
  headings: string[]
  mainCTA: string | null
  hasCart: boolean
  hasPricing: boolean
  structuredDataTypes: string[]
}

function extractPageSignals(html: string): PageSignals {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/<[^>]+>/g, '').trim() ?? ''

  const description = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i
  )?.[1] ?? ''

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)

  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 5)

  const hasCart = /cart|basket|add[\s-]to[\s-]cart/i.test(html)
  const hasPricing = /href=["'][^"']*\/(pricing|plans|subscribe)[/"']/i.test(html)

  const structuredDataTypes: string[] = []
  for (const block of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const parsed = JSON.parse(block[1])
      const t = parsed['@type']
      if (t) structuredDataTypes.push(Array.isArray(t) ? t[0] : String(t))
    } catch { /* invalid JSON-LD, skip */ }
  }

  return {
    title,
    description,
    headings: [...h1s, ...h2s],
    mainCTA: extractMainCTA(html),
    hasCart,
    hasPricing,
    structuredDataTypes,
  }
}

function inferBusinessTypeFromSignals(
  signals: PageSignals,
  techStack: string[],
): BusinessContext['businessType'] | null {
  if (signals.hasCart || techStack.includes('Shopify') || signals.structuredDataTypes.includes('Product')) {
    return 'ecommerce'
  }
  if (signals.hasPricing) return 'saas'
  return null
}

export async function analyzeBusinessContext(
  html: string,
  headers: Record<string, string> = {},
): Promise<BusinessContext> {
  const techStack = detectTechStack(html, headers)
  const signals = extractPageSignals(html)
  const deterministicType = inferBusinessTypeFromSignals(signals, techStack)

  const client = new OpenAI()

  let parsed: {
    businessType?: string
    detectedService?: string | null
    targetAudience?: string | null
    businessProfile?: string | null
  } = {}

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_SCAN_MODEL || 'gpt-4.1-nano',
      max_tokens: 250,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Analyze this website and return a JSON business profile. Only state what is directly supported by the signals. Return null for any field you cannot confidently determine.

Signals:
- Title: ${signals.title}
- Description: ${signals.description}
- Headings: ${JSON.stringify(signals.headings.slice(0, 8))}
- Primary CTA: ${signals.mainCTA ?? 'not detected'}
- Structured data types: ${signals.structuredDataTypes.join(', ') || 'none'}
- Has cart/shop elements: ${signals.hasCart}
- Has pricing/plans page: ${signals.hasPricing}
- Detected tech stack: ${techStack.join(', ') || 'unknown'}
${deterministicType ? `- Strong heuristic signal: ${deterministicType}` : ''}

Return EXACTLY this JSON:
{
  "businessType": "ecommerce" | "saas" | "local_business" | "portfolio" | "blog" | "agency" | "other",
  "detectedService": "short description of what they sell or offer, or null if not clear",
  "targetAudience": "who this is for, or null if not clearly supported by signals",
  "businessProfile": "1-2 sentence synthesis for use in recommendations, or null"
}

Rules: never invent details not in the signals. If uncertain about businessType use "other". targetAudience must be null unless clearly supported.`,
      }],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    parsed = JSON.parse(raw)
  } catch {
    // AI call failed or returned invalid JSON — use deterministic fallback only
  }

  const businessType = VALID_BUSINESS_TYPES.includes(
    parsed.businessType as typeof VALID_BUSINESS_TYPES[number]
  )
    ? (parsed.businessType as BusinessContext['businessType'])
    : deterministicType ?? 'other'

  return {
    businessType,
    techStack,
    mainCTA: signals.mainCTA,
    detectedService: parsed.detectedService ?? null,
    targetAudience: parsed.targetAudience ?? null,
    businessProfile: parsed.businessProfile ?? null,
  }
}
