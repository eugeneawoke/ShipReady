'use client'

import { useEffect, useRef, useState } from 'react'

interface WaitlistModalProps {
  open: boolean
  onClose: () => void
}

type State = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate'

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Focus email on open
  useEffect(() => {
    if (open) {
      setState('idle')
      setEmail('')
      setName('')
      setTimeout(() => emailRef.current?.focus(), 50)
    }
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('submitting')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      })

      if (res.ok) {
        setState('success')
        setTimeout(onClose, 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        setState(data.error === 'already_registered' ? 'duplicate' : 'error')
      }
    } catch {
      setState('error')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#161618] p-8 shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#5A5955] hover:text-[#8B8A85] transition-colors p-1"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {state === 'success' ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#F1F0EE]">You&apos;re on the list!</h2>
            <p className="mt-2 text-sm text-[#8B8A85]">We&apos;ll reach out at launch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 id="waitlist-title" className="mb-1 text-xl font-semibold text-[#F1F0EE]">
              Get notified at launch
            </h2>
            <p className="mb-6 text-sm text-[#8B8A85]">
              We&apos;ll email you when the Founder Deal goes live.
            </p>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="wl-email" className="mb-1.5 block text-sm font-medium text-[#F1F0EE]">
                Email <span className="text-[#6E56CF]">*</span>
              </label>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0E0E0F] pl-3 focus-within:border-[#6E56CF]/50 transition-colors overflow-hidden">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 text-[#5A5955]">
                  <path d="M17.5 3.438h-15a.937.937 0 0 0-.937.937V15a1.563 1.563 0 0 0 1.562 1.563h13.75A1.563 1.563 0 0 0 18.438 15V4.375a.94.94 0 0 0-.938-.937m-2.41 1.874L10 9.979 4.91 5.313zM3.438 14.688v-8.18l5.928 5.434a.937.937 0 0 0 1.268 0l5.929-5.435v8.182z" fill="currentColor"/>
                </svg>
                <input
                  ref={emailRef}
                  id="wl-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-full w-full bg-transparent pr-3 text-sm text-[#F1F0EE] placeholder-[#5A5955] outline-none"
                  disabled={state === 'submitting'}
                />
              </div>
            </div>

            {/* Name */}
            <div className="mb-6">
              <label htmlFor="wl-name" className="mb-1.5 block text-sm font-medium text-[#F1F0EE]">
                Name <span className="text-[#5A5955] font-normal">(optional)</span>
              </label>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0E0E0F] pl-3 focus-within:border-[#6E56CF]/50 transition-colors overflow-hidden">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 text-[#5A5955]">
                  <path d="M18.311 16.406a9.64 9.64 0 0 0-4.748-4.158 5.938 5.938 0 1 0-7.125 0 9.64 9.64 0 0 0-4.749 4.158.937.937 0 1 0 1.623.938c1.416-2.447 3.916-3.906 6.688-3.906 2.773 0 5.273 1.46 6.689 3.906a.938.938 0 0 0 1.622-.938M5.938 7.5a4.063 4.063 0 1 1 8.125 0 4.063 4.063 0 0 1-8.125 0" fill="currentColor"/>
                </svg>
                <input
                  id="wl-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-full w-full bg-transparent pr-3 text-sm text-[#F1F0EE] placeholder-[#5A5955] outline-none"
                  disabled={state === 'submitting'}
                />
              </div>
            </div>

            {/* Error messages */}
            {state === 'duplicate' && (
              <p className="mb-4 text-sm text-amber-400">This email is already registered.</p>
            )}
            {state === 'error' && (
              <p className="mb-4 text-sm text-red-400">Something went wrong — try again.</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={state === 'submitting' || !email}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6E56CF] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7C68D4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state === 'submitting' ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Joining...
                </>
              ) : (
                <>
                  Join the waitlist
                  <svg width="16" height="16" viewBox="0 0 21 20" fill="none">
                    <path d="m18.038 10.663-5.625 5.625a.94.94 0 0 1-1.328-1.328l4.024-4.023H3.625a.938.938 0 0 1 0-1.875h11.484l-4.022-4.025a.94.94 0 0 1 1.328-1.328l5.625 5.625a.935.935 0 0 1-.002 1.33" fill="currentColor"/>
                  </svg>
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-[#5A5955]">One email. No spam.</p>
          </form>
        )}
      </div>
    </div>
  )
}
