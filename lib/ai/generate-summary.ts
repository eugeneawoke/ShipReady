import OpenAI from 'openai'
import type { ScanResult, Issue } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

interface AIOutput {
  summary: string
  technicalPrompt: string
  vibePrompt: string
}

export async function generateAISummary(result: ScanResult): Promise<AIOutput> {
  const client = new OpenAI()

  const allIssues = getAllIssues(result)
  const activeIssues = allIssues.filter((i: Issue) => i.severity !== 'pass')
  const critical = activeIssues.filter((i: Issue) => i.severity === 'critical').length
  const high = activeIssues.filter((i: Issue) => i.severity === 'high').length

  const issueList = activeIssues
    .slice(0, 15)
    .map((i: Issue) => `- [${i.severity.toUpperCase()}] ${i.title}${i.value ? ` (${i.value})` : ''}`)
    .join('\n')

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You are a web quality expert. Analyze this site audit and return a JSON object.

URL: ${result.url}
Score: ${result.totalScore}/100
Critical: ${critical}, High: ${high}
Performance: ${result.performance.score} | SEO: ${result.seo.score} | Security: ${result.security.score} | Mobile: ${result.mobile.score} | AI Visibility: ${result.ai_visibility.score}

Issues found:
${issueList || 'No issues found — great job!'}

Return this exact JSON:
{
  "summary": "2-3 sentence plain-English summary for a non-technical indie hacker. No jargon. Direct, not scary. Impact first. If score > 70, end with encouragement.",
  "technicalPrompt": "A single ready-to-paste prompt for code-aware AI tools (Cursor, Windsurf, Claude Code). Reference the actual URL ${result.url}. Be specific: mention exact file paths (e.g. app/layout.tsx, next.config.js), HTTP response headers to add, meta tags to insert. Write as step-by-step instructions to an AI coding assistant that has full codebase access.",
  "vibePrompt": "A single ready-to-paste prompt for no-code/vibe AI builders (Bolt, Lovable, v0, Replit). Reference the actual URL ${result.url}. High-level and UI-focused: describe what to add or change without mentioning file paths. Use plain language a non-developer understands. Focus on outcomes (e.g. 'add a security header', 'make the site mobile-friendly') not implementation details."
}`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw)
    return {
      summary: parsed.summary ?? '',
      technicalPrompt: parsed.technicalPrompt ?? '',
      vibePrompt: parsed.vibePrompt ?? '',
    }
  } catch {
    return { summary: raw, technicalPrompt: '', vibePrompt: '' }
  }
}
