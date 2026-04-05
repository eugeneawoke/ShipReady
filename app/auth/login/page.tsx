'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex flex-col">
      <nav className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="font-semibold tracking-tight hover:text-[#8B8A85] transition-colors">
            ← ShipReady
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-10 h-10 rounded-2xl bg-[#6E56CF]/10 border border-[#6E56CF]/25 items-center justify-center mb-4">
              <span className="text-[#6E56CF] text-lg font-semibold">S</span>
            </div>
            <h1 className="text-xl font-medium tracking-tight">Sign in to ShipReady</h1>
            <p className="text-sm text-[#5A5955] mt-1.5">Continue to your scans and reports</p>
          </div>

          {sent ? (
            <div className="p-6 rounded-2xl bg-[#161618] border border-white/[0.06] text-center">
              <div className="text-2xl mb-3">✉️</div>
              <p className="font-medium mb-2">Check your email</p>
              <p className="text-sm text-[#8B8A85]">
                We sent a magic link to <span className="text-[#F1F0EE]">{email}</span>.
                Click it to sign in — no password needed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Google */}
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#161618] border border-white/[0.08] text-sm font-medium hover:bg-[#1E1E21] hover:border-white/[0.14] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-[#5A5955] font-mono">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* magic link */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#161618] border border-white/[0.08] text-sm text-[#F1F0EE] placeholder-[#5A5955] focus:outline-none focus:border-[#6E56CF]/60 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 px-4 rounded-xl bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Continue with email'}
                </button>
              </form>

              {error && (
                <p className="text-xs text-[#FF4444] text-center">{error}</p>
              )}

              <p className="text-[11px] text-[#5A5955] text-center leading-relaxed">
                By signing in you agree to our{' '}
                <Link href="/terms" className="hover:text-[#8B8A85] transition-colors">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="hover:text-[#8B8A85] transition-colors">Privacy Policy</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
