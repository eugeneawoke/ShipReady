import OpenAI from 'openai'
import type { ScanResult, WowInsight } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

const DEFAULT_WOW_MODEL = 'gpt-4.1-nano'

export async function generateWowInsights(result: ScanResult): Promise<WowInsight[]> {
  const client = new OpenAI()
  const verifiedFindings = getAllIssues(result)
    .filter(issue => issue.confidence === 'verified')
    .slice(0, 10)
    .map(issue => ({
      id: issue.id,
      title: issue.title,
      value: issue.value,
      evidence: issue.evidence?.slice(0, 2) ?? [],
    }))

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_SCAN_WOW_MODEL || process.env.OPENAI_SCAN_MODEL || DEFAULT_WOW_MODEL,
    max_tokens: 700,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You are writing a premium product review on top of existing evidence. Do not add technical issues or claim that something is broken unless it is already in the evidence.

URL: ${result.url}
Verified findings: ${JSON.stringify(verifiedFindings)}

Return JSON:
{
  "wowInsights": [
    { "title": "short title", "body": "1-2 sentence review insight", "evidenceRefs": ["issue-id"] }
  ]
}

Focus on:
- clarity of value proposition
- trust signals
- CTA clarity
- how the site would feel to a first-time visitor

If there is not enough evidence, return an empty array.`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.wowInsights) ? parsed.wowInsights : []
  } catch {
    return []
  }
}
