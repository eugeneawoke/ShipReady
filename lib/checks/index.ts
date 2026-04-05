import { createServiceClient } from '@/lib/supabase'
import { buildScanResult } from '@/lib/scoring'

export async function runAllChecks(url: string, scanId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('scans').update({ status: 'running' }).eq('id', scanId)

  try {
    // Phase 2: real checks — stubs for now
    const html = await fetch(url, { signal: AbortSignal.timeout(10000) }).then(r => r.text())

    // Suppress unused variable warning until Phase 2 wires this in
    void html

    // TODO Phase 2: replace with real lighthouse
    const lh = { performanceScore: 0, seoScore: 0, a11yScore: 0, lcp: 0, cls: 0, inp: 0, fcp: 0 }
    const seoIssues: never[] = []
    const secIssues: never[] = []
    const mobIssues: never[] = []
    const linkIssues: never[] = []

    const result = buildScanResult(url, lh, seoIssues, secIssues, mobIssues, linkIssues)

    await supabase
      .from('scans')
      .update({ status: 'done', results: result, updated_at: new Date().toISOString() })
      .eq('id', scanId)
  } catch (e) {
    console.error('runAllChecks error:', e)
    await supabase.from('scans').update({ status: 'error' }).eq('id', scanId)
  }
}
