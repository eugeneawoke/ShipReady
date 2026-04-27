import OpenAI from 'openai'
import type { ScanResult, Issue } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

interface IssuePrompt {
  technical: string
}

interface AIOutput {
  summary: string
  technicalPrompt: string
  issuePrompts: Record<string, IssuePrompt>
}

export async function generateAISummary(result: ScanResult): Promise<AIOutput> {
  const client = new OpenAI()

  const allIssues = getAllIssues(result)
  const activeIssues = allIssues.filter((i: Issue) => i.severity !== 'pass')
  const critical = activeIssues.filter((i: Issue) => i.severity === 'critical').length
  const high = activeIssues.filter((i: Issue) => i.severity === 'high').length

  const issueList = activeIssues
    .slice(0, 20)
    .map((i: Issue) => `- [${i.severity.toUpperCase()}] ${i.id}: ${i.title}${i.value ? ` (${i.value})` : ''}`)
    .join('\n')

  const issueIds = activeIssues.slice(0, 20).map((i: Issue) => i.id)

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 3000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You are a web quality expert helping agencies and developers fix client sites. Analyze this audit and return a JSON object.

URL: ${result.url}
Score: ${result.totalScore}/100
Critical: ${critical}, High: ${high}
Performance: ${result.performance.score} | SEO: ${result.seo.score} | Security: ${result.security.score} | Mobile: ${result.mobile.score} | AI Visibility: ${result.ai_visibility.score}

Issues found:
${issueList || 'No issues — site looks great!'}

Return EXACTLY this JSON (no extra fields):
{
  "summary": "2-3 sentence plain-English summary for an agency or developer. No jargon. Direct, not scary. If score > 70, end with encouragement.",
  "technicalPrompt": "A ready-to-paste prompt for code-aware AI tools (Cursor, Windsurf, Claude Code, Codex). Must reference URL ${result.url}. Include specific file paths (app/layout.tsx, next.config.js, etc), exact HTTP headers to add, meta tags to insert. Step-by-step instructions for an AI that has full codebase access. Cover ALL issues found.",
  "issuePrompts": {
    ${issueIds.map(id => `"${id}": { "technical": "..." }`).join(',\n    ')}
  }
}

For each issuePrompts entry:
- "technical": 2-5 step fix for this SPECIFIC issue for Cursor/Windsurf/Claude Code. Reference exact file paths and code. Be direct and actionable.`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw)
    return {
      summary: parsed.summary ?? '',
      technicalPrompt: parsed.technicalPrompt ?? '',
      issuePrompts: parsed.issuePrompts ?? {},
    }
  } catch {
    return { summary: raw, technicalPrompt: '', issuePrompts: {} }
  }
}
