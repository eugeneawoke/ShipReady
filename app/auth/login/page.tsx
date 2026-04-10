'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BackButton } from '@/components/BackButton'
import { SiteHeader } from '@/components/SiteHeader'

// Lazy singleton — only created on first user action, not at module load time
let _supabase: ReturnType<typeof createBrowserClient> | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _supabase
}

type Mode = 'signin' | 'signup' | 'reset'

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('Auth')
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'signin'
    const candidate = new URLSearchParams(window.location.search).get('mode')
    return candidate === 'signup' || candidate === 'signin' || candidate === 'reset'
      ? candidate
      : 'signin'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setDone(false)
    setShowPassword(false)
  }

  function switchMode(next: Mode) {
    resetForm()
    setMode(next)
  }

  async function handleGoogle() {
    setError(null)
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) setError(error.message)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signup') {
      if (password.length < 8) {
        setError(t('errors.passwordTooShort'))
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError(t('errors.passwordMismatch'))
        setLoading(false)
        return
      }
      const { error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      setDone(true)

    } else if (mode === 'signin') {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) { setError(t('errors.incorrectCredentials')); return }
      router.push('/dashboard')

    } else if (mode === 'reset') {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      setDone(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex flex-col">
      <SiteHeader
        right={(
          <div className="text-[11px] text-[#5A5955] font-mono">
            {mode === 'signin' ? (
              <span>{t('switcher.noAccount')} <button onClick={() => switchMode('signup')} className="text-[#6E56CF] hover:underline">{t('switcher.signUp')}</button></span>
            ) : mode === 'signup' ? (
              <span>{t('switcher.haveAccount')} <button onClick={() => switchMode('signin')} className="text-[#6E56CF] hover:underline">{t('switcher.signIn')}</button></span>
            ) : (
              <button onClick={() => switchMode('signin')} className="text-[#6E56CF] hover:underline">{t('switcher.backToSignIn')}</button>
            )}
          </div>
        )}
      />

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <BackButton className="text-sm text-[#8B8A85] hover:text-[#F1F0EE]" />
          </div>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-[#6E56CF]/10 border border-[#6E56CF]/25 items-center justify-center mb-5 p-2">
              <Image src="/logo.svg" alt={t('altBrand')} width={32} height={32} className="w-full h-full" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight mb-1.5">{t(`modes.${mode}.title`)}</h1>
            <p className="text-sm text-[#5A5955]">{t(`modes.${mode}.subtitle`)}</p>
          </div>

          {/* Done state */}
          {done ? (
            <div className="p-6 rounded-2xl bg-[#161618] border border-white/[0.06] text-center space-y-3">
              <div className="flex justify-center text-[#3DDC84]">
                <IconCheck />
              </div>
              {mode === 'signup' ? (
                <>
                  <p className="font-medium">{t('done.checkEmail')}</p>
                  <p className="text-sm text-[#8B8A85]">
                    {t.rich('done.signupBody', { email: () => <span className="text-[#F1F0EE]">{email}</span> })}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">{t('done.resetTitle')}</p>
                  <p className="text-sm text-[#8B8A85]">
                    {t.rich('done.resetBody', { email: () => <span className="text-[#F1F0EE]">{email}</span> })}
                  </p>
                </>
              )}
              <button
                onClick={() => switchMode('signin')}
                className="text-xs text-[#5A5955] hover:text-[#8B8A85] transition-colors"
              >
                {t('done.backToSignIn')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Google — only on sign in / sign up */}
              {mode !== 'reset' && (
                <>
                  <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#161618] border border-white/[0.08] text-sm font-medium hover:bg-[#1E1E21] hover:border-white/[0.14] transition-colors cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {t('google')}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/[0.06]"/>
                    <span className="text-[11px] text-[#5A5955] font-mono">{t('or')}</span>
                    <div className="flex-1 h-px bg-white/[0.06]"/>
                  </div>
                </>
              )}

              {/* Email / password form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email */}
                <input
                  type="email"
                  required
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#161618] border border-white/[0.08] text-base sm:text-sm text-[#F1F0EE] placeholder-[#5A5955] focus:outline-none focus:border-[#6E56CF]/60 transition-colors"
                />

                {/* Password */}
                {mode !== 'reset' && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={mode === 'signup' ? t('signupPasswordPlaceholder') : t('passwordPlaceholder')}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-[#161618] border border-white/[0.08] text-base sm:text-sm text-[#F1F0EE] placeholder-[#5A5955] focus:outline-none focus:border-[#6E56CF]/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A5955] hover:text-[#8B8A85] transition-colors"
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                )}

                {/* Confirm password */}
                {mode === 'signup' && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={t('confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-[#161618] border border-white/[0.08] text-base sm:text-sm text-[#F1F0EE] placeholder-[#5A5955] focus:outline-none focus:border-[#6E56CF]/60 transition-colors"
                    />
                  </div>
                )}

                {/* Forgot password */}
                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-[11px] text-[#5A5955] hover:text-[#8B8A85] transition-colors"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !email || (mode !== 'reset' && !password)}
                  className="w-full py-3 px-4 rounded-xl bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? t('submit.loading')
                    : mode === 'signin'
                    ? t('submit.signin')
                    : mode === 'signup'
                    ? t('submit.signup')
                    : t('submit.reset')}
                </button>
              </form>

              {/* Error */}
              {error && (
                <p className="text-xs text-[#FF4444] text-center px-2">{error}</p>
              )}

              {/* Toggle */}
              <p className="text-[11px] text-[#5A5955] text-center pt-1">
                {mode === 'signin' ? (
                  <>{t('footer.newHere')}{' '}<button onClick={() => switchMode('signup')} className="text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">{t('footer.createFreeAccount')}</button></>
                ) : mode === 'signup' ? (
                  <>{t('footer.alreadyHaveAccount')}{' '}<button onClick={() => switchMode('signin')} className="text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">{t('switcher.signIn')}</button></>
                ) : null}
              </p>

              {/* Legal */}
              <p className="text-[10px] text-[#5A5955] text-center leading-relaxed">
                {t('footer.legalPrefix')}{' '}
                <Link href="/terms" className="hover:text-[#8B8A85] transition-colors">{t('footer.terms')}</Link>
                {' '}and{' '}
                <Link href="/privacy" className="hover:text-[#8B8A85] transition-colors">{t('footer.privacy')}</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
