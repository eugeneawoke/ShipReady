import 'server-only'

import { Resend } from 'resend'

interface SendTeamInviteInput {
  invitedEmail: string
  ownerEmail: string
  ownerName?: string
  inviteToken: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export async function sendTeamInvite(input: SendTeamInviteInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Glook <team@glook.dev>'

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(apiKey)
  const displayName = escapeHtml(input.ownerName || input.ownerEmail)
  const subject = "[Glook] You've been invited to join a team"

  await resend.emails.send({
    from,
    to: input.invitedEmail,
    subject,
    text: [
      `${input.ownerName || input.ownerEmail} has invited you to join their Glook team.`,
      '',
      'To accept, call the Glook API with your API key:',
      '',
      `  POST /api/v1/teams/accept`,
      `  Authorization: Bearer <your-api-key>`,
      `  { "token": "${input.inviteToken}" }`,
      '',
      "If you don't have an API key yet, sign in to Glook and generate one in your dashboard.",
      '',
      "If you didn't expect this, ignore this email.",
    ].join('\n'),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Glook team invitation</h2>
        <p>${displayName} has invited you to join their Glook team.</p>
        <div style="margin: 16px 0; padding: 16px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E5E7EB;">
          <div><strong>Invited by:</strong> ${displayName}</div>
        </div>
        <p style="margin-top: 16px;">To accept, call the API with your Glook API key:</p>
        <pre style="background: #111827; color: #F8FAFC; padding: 14px; border-radius: 10px; font-size: 12px; overflow-x: auto;">POST /api/v1/teams/accept
Authorization: Bearer &lt;your-api-key&gt;
Content-Type: application/json

{ "token": "${escapeHtml(input.inviteToken)}" }</pre>
        <p style="margin-top: 12px; font-size: 13px; color: #6B7280;">Don't have an API key yet? Sign in to Glook and generate one in your dashboard.</p>
        <p style="margin-top: 24px; font-size: 13px; color: #6B7280;">If you didn't expect this, ignore this email.</p>
      </div>
    `,
  })
}
