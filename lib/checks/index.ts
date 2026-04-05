import { createServiceClient } from '@/lib/supabase'
import { buildScanResult } from '@/lib/scoring'
import { runLighthouse } from '@/lib/checks/lighthouse'
import { runSEOChecks } from '@/lib/checks/seo'
import { runSecurityChecks } from '@/lib/checks/security'
import { runMobileChecks } from '@/lib/checks/mobile'
import { runLinksCheck } from '@/lib/checks/links'
import { generateAISummary } from '@/lib/ai/generate-summary'

export async function runAllChecks(url: string, scanId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('scans').update({ status: 'running' }).eq('id', scanId)

  try {
    const html = await fetch(url, { signal: AbortSignal.timeout(10000) }).then(r => r.text())

    const [lh, seoIssues, secIssues, mobIssues, linkIssues] = await Promise.all([
      runLighthouse(url),
      runSEOChecks(url, html),
      runSecurityChecks(url, html),
      runMobileChecks(html),
      runLinksCheck(url, html),
    ])

    const result = buildScanResult(url, lh, seoIssues, secIssues, mobIssues, linkIssues)

    if (process.env.ANTHROPIC_API_KEY) {
      try { result.aiSummary = await generateAISummary(result) } catch {}
    }

    await supabase
      .from('scans')
      .update({ status: 'done', results: result as any, updated_at: new Date().toISOString() })
      .eq('id', scanId)
  } catch (e) {
    console.error('runAllChecks error:', e)
    await supabase.from('scans').update({ status: 'error' }).eq('id', scanId)
  }
}
