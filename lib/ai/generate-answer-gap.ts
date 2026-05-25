import type { BusinessContext, ScanResult } from '@/types/scan'
import OpenAI from 'openai'

export async function generateAnswerGap(
  result: ScanResult,
  businessContext: BusinessContext,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const client = new OpenAI({ apiKey })

  const prompt = `You are an AI content strategist. Analyze this website and identify content gaps that reduce its chance of being cited by AI assistants (ChatGPT, Claude, Perplexity).

Site: ${result.url}
Business type: ${businessContext.businessType}
Business profile: ${businessContext.businessProfile ?? 'not provided'}

Current AI visibility issues: ${result.ai_visibility?.issues?.map(i => i.title).join(', ') || 'none found'}

Identify 3 specific content gaps — topics or page types this site is likely missing that AI assistants commonly cite for this type of product. Be specific and actionable. Format as a bulleted list. Max 150 words.`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.4,
    })
    return response.choices[0]?.message?.content ?? null
  } catch {
    return null
  }
}
