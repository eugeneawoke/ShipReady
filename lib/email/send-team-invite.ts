import 'server-only'

import { Resend } from 'resend'

interface SendTeamInviteInput {
  invitedEmail: string
  ownerEmail: string
  ownerName?: string
  acceptUrl: string
}

export async function sendTeamInvite(input: SendTeamInviteInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'ShipReady <team@shipready.app>'

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(apiKey)
  const displayName = input.ownerName || input.ownerEmail
  const subject = '[ShipReady] You\'ve been invited to join a team'

  await resend.emails.send({
    from,
    to: input.invitedEmail,
    subject,
    text: [
      `${displayName} has invited you to join their ShipReady team.`,
      '',
      `Accept the invitation: ${input.acceptUrl}`,
      '',
      'If you didn\'t expect this, ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">ShipReady team invitation</h2>
        <p>${displayName} has invited you to join their ShipReady team.</p>
        <div style="margin: 16px 0; padding: 16px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E5E7EB;">
          <div><strong>Invited by:</strong> ${displayName}</div>
        </div>
        <p style="margin-top: 24px;">
          <a href="${input.acceptUrl}" style="display: inline-block; background: #6E56CF; color: white; text-decoration: none; padding: 10px 14px; border-radius: 10px;">Accept invitation</a>
        </p>
        <p style="margin-top: 24px; font-size: 13px; color: #6B7280;">If you didn't expect this, ignore this email.</p>
      </div>
    `,
  })
}
