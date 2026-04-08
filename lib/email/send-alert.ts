import 'server-only'

import { Resend } from 'resend'
import type { Issue } from '@/types/scan'

interface SendMonitoringAlertInput {
  email: string
  domain: string
  reportUrl: string
  scoreDrop: number
  previousScore: number | null
  currentScore: number | null
  newSeriousIssues: Issue[]
}

function renderIssueList(issues: Issue[]) {
  return issues
    .slice(0, 3)
    .map((issue) => `<li><strong>${issue.title}</strong> — ${issue.plainEnglish}</li>`)
    .join('')
}

export async function sendMonitoringAlert(input: SendMonitoringAlertInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'ShipReady <alerts@shipready.app>'

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(apiKey)
  const subject = input.scoreDrop > 10
    ? `[ShipReady] ${input.domain} score dropped by ${input.scoreDrop} points`
    : `[ShipReady] ${input.domain} has new critical or high issues`

  const intro = input.scoreDrop > 10
    ? `Your weekly monitoring scan found a meaningful regression for ${input.domain}.`
    : `Your weekly monitoring scan found new high-severity issues for ${input.domain}.`

  await resend.emails.send({
    from,
    to: input.email,
    subject,
    text: [
      intro,
      '',
      `Previous score: ${input.previousScore ?? 'n/a'}`,
      `Current score: ${input.currentScore ?? 'n/a'}`,
      input.scoreDrop > 10 ? `Score drop: ${input.scoreDrop}` : '',
      '',
      input.newSeriousIssues.length > 0 ? 'New critical/high issues:' : 'No new critical/high issues, but the score regression exceeded the alert threshold.',
      ...input.newSeriousIssues.slice(0, 3).map((issue) => `- ${issue.title}: ${issue.plainEnglish}`),
      '',
      `Open report: ${input.reportUrl}`,
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">ShipReady monitoring alert</h2>
        <p>${intro}</p>
        <div style="margin: 16px 0; padding: 16px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E5E7EB;">
          <div><strong>Domain:</strong> ${input.domain}</div>
          <div><strong>Previous score:</strong> ${input.previousScore ?? 'n/a'}</div>
          <div><strong>Current score:</strong> ${input.currentScore ?? 'n/a'}</div>
          ${input.scoreDrop > 10 ? `<div><strong>Score drop:</strong> ${input.scoreDrop}</div>` : ''}
        </div>
        ${
          input.newSeriousIssues.length > 0
            ? `<div>
                <p style="margin-bottom: 8px;"><strong>New critical/high issues</strong></p>
                <ul>${renderIssueList(input.newSeriousIssues)}</ul>
              </div>`
            : ''
        }
        <p style="margin-top: 24px;">
          <a href="${input.reportUrl}" style="display: inline-block; background: #6E56CF; color: white; text-decoration: none; padding: 10px 14px; border-radius: 10px;">Open latest report</a>
        </p>
      </div>
    `,
  })
}
