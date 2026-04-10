import { NextRequest, NextResponse } from 'next/server'
import { localeCookieName, resolveLocale, normalizeLocale } from '@/lib/i18n'

/**
 * Persist the locale cookie on first visit so it survives
 * all subsequent navigations without re-detecting Accept-Language.
 *
 * Priority (same as i18n/request.ts):
 *   1. Existing cookie (user's explicit choice)
 *   2. Accept-Language header (browser/OS default)
 *   3. 'en' (fallback)
 */
export function proxy(request: NextRequest) {
  const existingCookie = request.cookies.get(localeCookieName)?.value

  // Valid cookie present — nothing to do
  if (normalizeLocale(existingCookie)) {
    return NextResponse.next()
  }

  // No cookie yet: resolve from Accept-Language and set it
  const locale = resolveLocale({
    acceptLanguage: request.headers.get('accept-language'),
  })

  const response = NextResponse.next()
  response.cookies.set(localeCookieName, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: false, // client JS must be able to read/update it via document.cookie
  })
  return response
}

export const config = {
  // Run on all page routes; skip API routes, Next.js internals, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)',],
}
