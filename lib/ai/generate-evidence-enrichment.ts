import OpenAI from 'openai'
import type { BusinessContext, ScanGoal, ScanResult, StrategicRecommendation } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

const DEFAULT_ENRICHMENT_MODEL = 'gpt-4.1-nano'
const MAX_AI_ISSUES = 12

export interface EvidenceEnrichment {
  summary: string
  topPriorities: string[]
  technicalPrompt: string
  issuePrompts: Record<string, { technical: string }>
  strategicRecommendations: StrategicRecommendation[]
}

function compactIssue(issue: ReturnType<typeof getAllIssues>[number]) {
  return {
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    confidence: issue.confidence,
    title: issue.title,
    value: issue.value,
    evidence: issue.evidence?.slice(0, 3) ?? [],
  }
}

function buildBusinessContextBlock(
  businessContext: BusinessContext | null | undefined,
  scanGoal: ScanGoal | undefined,
): string {
  if (!businessContext && !scanGoal) return ''

  const lines: string[] = ['\nBusiness context (use this to make recommendations specific):']

  if (businessContext) {
    lines.push(`- Site type: ${businessContext.businessType}`)
    if (businessContext.techStack.length > 0) {
      lines.push(`- Tech stack: ${businessContext.techStack.join(', ')}`)
    }
    if (businessContext.detectedService) {
      lines.push(`- Detected service/product: ${businessContext.detectedService}`)
    }
    if (businessContext.targetAudience) {
      lines.push(`- Target audience: ${businessContext.targetAudience}`)
    }
    if (businessContext.mainCTA) {
      lines.push(`- Primary CTA: "${businessContext.mainCTA}"`)
    }
    if (businessContext.businessProfile) {
      lines.push(`- Profile: ${businessContext.businessProfile}`)
    }
  }

  if (scanGoal && scanGoal !== 'general') {
    const goalLabels: Record<string, string> = {
      sales: 'increase sales/conversions',
      leads: 'generate more leads',
      traffic: 'increase organic traffic',
      visibility: 'improve AI search visibility (AEO/GEO)',
    }
    lines.push(`- Owner's goal: ${goalLabels[scanGoal] ?? scanGoal}`)
    lines.push(`- Prioritise issues that most directly block this goal.`)
  }

  return lines.join('\n')
}

export async function generateEvidenceEnrichment(
  result: ScanResult,
  businessContext?: BusinessContext | null,
  scanGoal?: ScanGoal,
): Promise<EvidenceEnrichment> {
  const client = new OpenAI()
  const activeIssues = getAllIssues(result).filter(issue => issue.severity !== 'pass')
  const compactIssues = activeIssues.slice(0, MAX_AI_ISSUES).map(compactIssue)
  const issueIds = compactIssues.map(issue => issue.id)
  const businessContextBlock = buildBusinessContextBlock(businessContext, scanGoal)

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_SCAN_MODEL || DEFAULT_ENRICHMENT_MODEL,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You are helping produce an honest web quality report. You may summarize and prioritize findings, but you may not invent new technical facts or issue IDs.

URL: ${result.url}
Phase: ${result.phase}
Total score: ${result.totalScore ?? 'unavailable'}
Category scores:
- Performance: ${result.performance.score ?? 'unavailable'}
- SEO: ${result.seo.score ?? 'unavailable'}
- Security: ${result.security.score ?? 'unavailable'}
- Mobile: ${result.mobile.score ?? 'unavailable'}
- AI Visibility: ${result.ai_visibility.score ?? 'unavailable'}
${businessContextBlock}

Findings:
${JSON.stringify(compactIssues)}

Return EXACTLY this JSON shape:
{
  "summary": "1-2 sentence summary. Mention if some measurements were unavailable.",
  "topPriorities": ["priority 1", "priority 2", "priority 3"],
  "strategicRecommendations": [
    {
      "timeframe": "now" | "next_2_weeks" | "next_month",
      "title": "short recommendation title",
      "body": "business-aware recommendation based only on findings, evidence, business context, and scan goal",
      "evidenceRefs": ["issue-id or business-context field"]
    }
  ],
  "technicalPrompt": "A precise fix prompt for Cursor, Claude Code, or Windsurf. Reference specific files or config paths for the detected tech stack. Format: goal → concrete fix steps (4-7 bullets) → how to verify each fix on the live site.",
  "issuePrompts": {
    ${issueIds.map(id => `"${id}": { "technical": "..." }`).join(',\n    ')}
  }
}

Rules:
- Never introduce a new issue id
- Never claim a fact not present in findings/evidence
- If confidence is likely or heuristic, avoid overstating certainty
- technicalPrompt must reference the specific tech stack if known (e.g. for Shopify: "open product.liquid", for Next.js: "in next.config.ts", for WordPress: "in functions.php")
- technicalPrompt must name each concrete fix and the exact verification step on the live site
- Never use generic advice like "improve your meta description" — always say what to add/change and where
- For each issue prompt: one strong recommended fix with enough technical detail to act on. No alternatives.
- If business context is available, reference the detected service/audience/CTA when explaining business impact`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw)
    return {
      summary: parsed.summary ?? '',
      topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities : [],
      technicalPrompt: parsed.technicalPrompt ?? '',
      issuePrompts: parsed.issuePrompts ?? {},
      strategicRecommendations: Array.isArray(parsed.strategicRecommendations) ? parsed.strategicRecommendations : [],
    }
  } catch {
    return {
      summary: raw,
      topPriorities: [],
      technicalPrompt: '',
      issuePrompts: {},
      strategicRecommendations: [],
    }
  }
}
