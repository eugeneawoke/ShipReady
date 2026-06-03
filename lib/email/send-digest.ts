import 'server-only'

import { Resend } from 'resend'
import type { ScanResult } from '@/types/scan'

interface DigestDiff {
  scoreDelta: Record<string, number>   // category → delta
  totalDelta: number
  newIssueIds: string[]
  resolvedIssueIds: string[]
}

function buildDiff(latest: ScanResult, baseline: ScanResult): DigestDiff {
  const categories = ['performance', 'seo', 'security', 'mobile', 'ai_visibility', 'accessibility'] as const
  const scoreDelta: Record<string, number> = {}

  for (const cat of categories) {
    const latestScore = latest[cat]?.score ?? null
    const baselineScore = baseline[cat]?.score ?? null
    if (latestScore !== null && baselineScore !== null) {
      scoreDelta[cat] = Math.round(latestScore - baselineScore)
    }
  }

  const baselineIds = new Set(
    categories.flatMap(cat => (baseline[cat]?.issues ?? []).map(i => i.id))
  )
  const latestIds = new Set(
    categories.flatMap(cat => (latest[cat]?.issues ?? []).map(i => i.id))
  )

  const newIssueIds = [...latestIds].filter(id => !baselineIds.has(id)).slice(0, 5)
  const resolvedIssueIds = [...baselineIds].filter(id => !latestIds.has(id)).slice(0, 5)
  const totalDelta = Math.round((latest.totalScore ?? 0) - (baseline.totalScore ?? 0))

  return { scoreDelta, totalDelta, newIssueIds, resolvedIssueIds }
}

const CAT_LABELS: Record<string, string> = {
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI Visibility',
  accessibility: 'Accessibility',
}

function deltaColor(delta: number): string {
  if (delta > 0) return '#3DDC84'
  if (delta < 0) return '#FF4444'
  return '#8B8A85'
}

function deltaSign(delta: number): string {
  if (delta > 0) return `+${delta}`
  return String(delta)
}

export interface SendWeeklyDigestInput {
  email: string
  domain: string
  reportUrl: string
  latestScan: ScanResult
  baselineScan: ScanResult
}

export async function sendWeeklyDigest(input: SendWeeklyDigestInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Glook <alerts@glook.dev>'

  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  const diff = buildDiff(input.latestScan, input.baselineScan)
  const resend = new Resend(apiKey)

  const subject = diff.totalDelta > 0
    ? `[Glook] ${input.domain} improved by ${diff.totalDelta} pts this week`
    : diff.totalDelta < 0
    ? `[Glook] ${input.domain} dropped by ${Math.abs(diff.totalDelta)} pts — action needed`
    : `[Glook] Weekly digest for ${input.domain}`

  const scoreRows = Object.entries(diff.scoreDelta)
    .filter(([, delta]) => delta !== 0)
    .map(([cat, delta]) =>
      `<tr>
        <td style="padding:4px 0;color:#6B7280;">${CAT_LABELS[cat] ?? cat}</td>
        <td style="padding:4px 0 4px 16px;font-weight:600;color:${deltaColor(delta)};">${deltaSign(delta)}</td>
      </tr>`
    ).join('')

  await resend.emails.send({
    from,
    to: input.email,
    subject,
    text: [
      `Weekly digest for ${input.domain}`,
      '',
      `Overall score change: ${deltaSign(diff.totalDelta)}`,
      diff.newIssueIds.length > 0 ? `New issues: ${diff.newIssueIds.join(', ')}` : '',
      diff.resolvedIssueIds.length > 0 ? `Resolved: ${diff.resolvedIssueIds.join(', ')}` : '',
      '',
      `Open full report: ${input.reportUrl}`,
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6;max-width:480px;">
        <h2 style="margin-bottom:4px;">Glook weekly digest</h2>
        <p style="margin-top:0;color:#6B7280;">${input.domain}</p>

        <div style="margin:20px 0;padding:16px;border-radius:12px;background:#F8FAFC;border:1px solid #E5E7EB;">
          <div style="font-size:28px;font-weight:700;color:${deltaColor(diff.totalDelta)};">
            ${deltaSign(diff.totalDelta)} pts overall
          </div>
          ${scoreRows ? `<table style="margin-top:12px;width:100%;">${scoreRows}</table>` : '<p style="color:#6B7280;font-size:14px;">No score changes this week.</p>'}
        </div>

        ${diff.newIssueIds.length > 0 ? `
          <div style="margin-bottom:16px;">
            <p style="font-weight:600;margin-bottom:6px;">New issues detected</p>
            <ul style="margin:0;padding-left:18px;color:#6B7280;font-size:14px;">
              ${diff.newIssueIds.map(id => `<li><code>${id}</code></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${diff.resolvedIssueIds.length > 0 ? `
          <div style="margin-bottom:16px;">
            <p style="font-weight:600;margin-bottom:6px;">Resolved this week</p>
            <ul style="margin:0;padding-left:18px;color:#3DDC84;font-size:14px;">
              ${diff.resolvedIssueIds.map(id => `<li><code>${id}</code></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <p style="margin-top:24px;">
          <a href="${input.reportUrl}" style="display:inline-block;background:#6E56CF;color:white;text-decoration:none;padding:10px 14px;border-radius:10px;">Open latest report</a>
        </p>
      </div>
    `,
  })
}
