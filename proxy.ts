import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { localeCookieName, resolveLocale, normalizeLocale } from '@/lib/i18n'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days inactivity

// style-src keeps 'unsafe-inline' — React and framer-motion use inline style attributes.
// script-src uses nonce + strict-dynamic — no unsafe-inline in script context.
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co'}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

/**
 * Handles three concerns per request:
 * 1. Persist the locale cookie on first visit.
 * 2. Generate a CSP nonce and set Content-Security-Policy header.
 * 3. Refresh the Supabase session cookie (7-day maxAge, prevents infinite sessions).
 *
 * Locale priority (same as i18n/request.ts):
 *   1. Existing cookie (user's explicit choice)
 *   2. Accept-Language header (browser/OS default)
 *   3. 'en' (fallback)
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  // Forward nonce to server components via request header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const existingCookie = request.cookies.get(localeCookieName)?.value

  const response = normalizeLocale(existingCookie)
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : (() => {
        const locale = resolveLocale({
          acceptLanguage: request.headers.get('accept-language'),
        })
        const r = NextResponse.next({ request: { headers: requestHeaders } })
        r.cookies.set(localeCookieName, locale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
          httpOnly: false,
        })
        return r
      })()

  response.headers.set('Content-Security-Policy', csp)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip session refresh on auth callback — middleware interference destroys the PKCE code_verifier cookie
  // before exchangeCodeForSession can read it, causing "PKCE code verifier not found in storage"
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')

  if (supabaseUrl && supabaseAnonKey && !isAuthCallback) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              maxAge: SESSION_MAX_AGE,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          )
        },
      },
    })
    await supabase.auth.getUser()
  }

  return response
}

export const config = {
  // Run on all page routes; skip API routes, Next.js internals, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)',],
}
