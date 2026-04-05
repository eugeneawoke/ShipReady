import Anthropic from '@anthropic-ai/sdk'
import type { ScanResult } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

export async function generateAISummary(result: ScanResult): Promise<string> {
  const client = new Anthropic()
  const critical = getAllIssues(result).filter(i => i.severity === 'critical').length
  const high     = getAllIssues(result).filter(i => i.severity === 'high').length
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content:
      `Web quality expert. Write 2–3 sentence plain-English summary for a non-technical indie hacker.
URL: ${result.url} | Score: ${result.totalScore}/100
Critical: ${critical}, High: ${high}
Performance: ${result.performance.score} | Security: ${result.security.score} | SEO: ${result.seo.score}
Rules: no jargon without explanation · direct not scary · impact first · if score>70 end with encouragement` }],
  })
  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}
