import { createServiceClient } from '@/lib/supabase'
import type { ScanResult } from '@/types/scan'
import { buildScanResult } from '@/lib/scoring'
import { runLighthouse } from '@/lib/checks/lighthouse'
import { runSEOChecks } from '@/lib/checks/seo'
import { runSecurityChecks } from '@/lib/checks/security'
import { runMobileChecks } from '@/lib/checks/mobile'
import { runLinksCheck } from '@/lib/checks/links'
import { runAIVisibilityChecks } from '@/lib/checks/ai-visibility'
import { generateAISummary } from '@/lib/ai/generate-summary'

// Wrap a promise with a timeout — resolves to fallback value on timeout/error
async function safe<T>(promise: Promise<T>, fallback: T, name: string): Promise<T> {
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${name} timed out`)), 60_000)
      ),
    ])
  } catch (e) {
    console.error(`[checks] ${name} failed:`, e)
    return fallback
  }
}

export async function runAllChecks(url: string, scanId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('scans').update({ status: 'running' }).eq('id', scanId)

  try {
    const html = await Promise.race([
      fetch(url, { signal: AbortSignal.timeout(10000) }).then(r => r.text()),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('HTML fetch timed out')), 12_000)
      ),
    ])

    // Run all checks independently — one failure doesn't kill the rest
    const [lh, seoIssues, secIssues, mobIssues, linkIssues, aiVisibilityIssues] = await Promise.all([
      safe(runLighthouse(url), {
        performanceScore: 0, seoScore: 0, a11yScore: 0,
        lcp: 0, cls: 0, inp: 0, fcp: 0,
      }, 'lighthouse'),
      safe(runSEOChecks(url, html), [], 'seo'),
      safe(runSecurityChecks(url, html), [], 'security'),
      safe(runMobileChecks(html), [], 'mobile'),
      safe(runLinksCheck(url, html), [], 'links'),
      safe(runAIVisibilityChecks(url, html), [], 'ai-visibility'),
    ])

    const result = buildScanResult(url, lh, seoIssues, secIssues, mobIssues, linkIssues, aiVisibilityIssues)

    if (process.env.OPENAI_API_KEY) {
      try {
        const ai = await generateAISummary(result)
        result.aiSummary = ai.summary
        result.aiTechnicalPrompt = ai.technicalPrompt
        result.aiVibePrompt = ai.vibePrompt
      } catch (e) {
        console.error('[checks] AI summary failed:', e)
      }
    }

    const { error: dbError } = await supabase
      .from('scans')
      .update({ status: 'done', results: result as ScanResult, updated_at: new Date().toISOString() })
      .eq('id', scanId)

    if (dbError) console.error('[checks] Failed to save scan results:', dbError)
  } catch (e) {
    console.error('[checks] runAllChecks fatal error:', e)
    const { error: dbError } = await supabase
      .from('scans')
      .update({ status: 'error', updated_at: new Date().toISOString() })
      .eq('id', scanId)
    if (dbError) console.error('[checks] Failed to save error status:', dbError)
  }
}
