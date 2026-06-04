import { NextRequest, NextResponse } from 'next/server'
import { localeCookieName, normalizeLocale } from '@/lib/i18n'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json()
    const validated = normalizeLocale(locale)
    if (!validated) {
      return NextResponse.json({ error: 'invalid locale' }, { status: 400 })
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.set(localeCookieName, validated, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
