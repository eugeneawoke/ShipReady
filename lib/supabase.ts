import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days inactivity

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function hasSupabaseServiceConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    && process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function createClient() {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase public env vars are not configured')
  }

  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: SESSION_MAX_AGE,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              }))
          } catch {}
        },
      },
    }
  )
}

export function createServiceClient() {
  if (!hasSupabaseServiceConfig()) {
    throw new Error('Supabase service env vars are not configured')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
