import OpenAI from 'openai'
import type { Issue, ScanResult } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

const DEFAULT_ENRICHMENT_MODEL = 'gpt-4.1-nano'
const MAX_AI_ISSUES = 12

interface IssuePrompt {
  technical: string
  vibe: string
}

export interface EvidenceEnrichment {
  summary: string
  topPriorities: string[]
  technicalPrompt: string
  vibePrompt: string
  issuePrompts: Record<string, IssuePrompt>
}

function compactIssue(issue: Issue) {
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

export async function generateEvidenceEnrichment(result: ScanResult): Promise<EvidenceEnrichment> {
  const client = new OpenAI()
  const activeIssues = getAllIssues(result).filter(issue => issue.severity !== 'pass')
  const compactIssues = activeIssues.slice(0, MAX_AI_ISSUES).map(compactIssue)
  const issueIds = compactIssues.map(issue => issue.id)

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_SCAN_MODEL || DEFAULT_ENRICHMENT_MODEL,
    max_tokens: 1400,
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

Findings:
${JSON.stringify(compactIssues)}

Return EXACTLY this JSON shape:
{
  "summary": "1-2 sentence summary. Mention if some measurements were unavailable.",
  "topPriorities": ["priority 1", "priority 2", "priority 3"],
  "technicalPrompt": "One concise prompt for code-aware tools. Use only existing findings.",
  "vibePrompt": "One concise prompt for no-code builders. Use only existing findings.",
  "issuePrompts": {
    ${issueIds.map(id => `"${id}": { "technical": "...", "vibe": "..." }`).join(',\n    ')}
  }
}

Rules:
- Never introduce a new issue id
- Never claim a fact that is not present in the findings/evidence
- If confidence is likely or heuristic, avoid overstating certainty
- Keep prompts actionable and concise
- For each prompt, prefer 4-7 short bullets over long prose`,
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
      vibePrompt: parsed.vibePrompt ?? '',
      issuePrompts: parsed.issuePrompts ?? {},
    }
  } catch {
    return {
      summary: raw,
      topPriorities: [],
      technicalPrompt: '',
      vibePrompt: '',
      issuePrompts: {},
    }
  }
}
