import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { Resend } from 'resend'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { email, name } = body as { email?: string; name?: string }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('waitlist_emails')
    .insert({ email: email.toLowerCase().trim(), name: name?.trim() || null })

  if (error) {
    if (error.code === '23505') {
      // unique violation — already registered
      return NextResponse.json({ error: 'already_registered' }, { status: 409 })
    }
    console.error('[waitlist] insert error', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  // Notify owner
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Glook <noreply@glook.dev>'

  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      const displayName = name?.trim() ? `${name.trim()} <${email}>` : email
      await resend.emails.send({
        from,
        to: 'egusakov74@gmail.com',
        subject: '[Glook] New waitlist signup',
        text: `New waitlist signup:\n\n${displayName}\n\nSigned up at ${new Date().toISOString()}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.6">
            <h2 style="margin-bottom:8px">New Glook waitlist signup</h2>
            <div style="padding:16px;border-radius:12px;background:#F8FAFC;border:1px solid #E5E7EB">
              <div><strong>Email:</strong> ${email}</div>
              ${name?.trim() ? `<div><strong>Name:</strong> ${name.trim()}</div>` : ''}
              <div style="margin-top:8px;color:#6B7280;font-size:13px">${new Date().toISOString()}</div>
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      // Non-fatal — signup already saved
      console.error('[waitlist] resend error', emailErr)
    }
  }

  return NextResponse.json({ ok: true })
}
