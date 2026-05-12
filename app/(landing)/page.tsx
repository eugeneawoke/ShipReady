'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale, useMessages } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ScanForm } from '@/components/landing/ScanForm'
import { PricingSection } from '@/components/landing/PricingSection'
import { AttributionTracker } from '@/components/growth/AttributionTracker'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { NumberTicker } from '@/components/ui/number-ticker'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { SiteBrandLink } from '@/components/SiteHeader'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'
import { localeCookieName } from '@/lib/i18n'
import type { AppMessages } from '@/messages/en'
import MobileNavSheet from '@/components/MobileNavSheet'

// Heavy decorative components — lazy-loaded so they don't block initial hydration / LCP
// Components return JSX.Element (not ReactNode) — cast required for next/dynamic with React 19 strict types
import type { ComponentType } from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>
const Particles = dynamic(async () => { const m = await import('@/components/ui/particles'); return m.Particles as AnyComponent }, { ssr: false })
const HeroNoise = dynamic(async () => { const m = await import('@/components/ui/hero-noise'); return m.HeroNoise as AnyComponent }, { ssr: false })
const FlickeringGrid = dynamic(async () => { const m = await import('@/components/ui/flickering-grid'); return m.FlickeringGrid as AnyComponent }, { ssr: false })

const CinematicFooter = dynamic(async () => { const m = await import('@/components/ui/motion-footer'); return m.CinematicFooter as AnyComponent }, { ssr: false })

// ─── smooth scroll ────────────────────────────────────────────────────────────

function smoothScrollTo(selector: string) {
  const el = document.querySelector(selector)
  if (!el) return
  const NAV_H = 64
  const start = window.scrollY
  const end = el.getBoundingClientRect().top + window.scrollY - NAV_H
  const duration = 550
  const startTime = performance.now()
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1)
    window.scrollTo(0, start + (end - start) * easeOutCubic(progress))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ─── contact ──────────────────────────────────────────────────────────────────

// ─── inline SVG icons ────────────────────────────────────────────────────────

const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9z"/>
  </svg>
)

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

const IconCheckCircle = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)

const IconCopy = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

const IconBot = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <path d="M12 11V7"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M8 15h.01M16 15h.01"/>
  </svg>
)

const IconAccessibility = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M9 9h6"/>
    <path d="M12 9v5"/>
    <path d="M9 21l3-7 3 7"/>
  </svg>
)

const IconChevron = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

const IconArrow = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
)

const IconGlobe = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

type Lang = 'EN' | 'RU'
type Translations = AppMessages['Landing']

// ─── animation helpers ────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
})

// ─── feature meta ─────────────────────────────────────────────────────────────

const FEATURE_META = [
  { Icon: IconZap,           color: '#FF8C42' },
  { Icon: IconSearch,        color: '#4A9EFF' },
  { Icon: IconShield,        color: '#FF4444' },
  { Icon: IconPhone,         color: '#3DDC84' },
  { Icon: IconBot,           color: '#A78BFA' },
  { Icon: IconAccessibility, color: '#22D3EE' },
]

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const locale = useLocale()
  const messages = useMessages() as AppMessages
  const t = messages.Landing as Translations
  const languageAriaLabel = messages.LanguageSwitcher.ariaLabel
  const [isPending, startTransition] = useTransition()
  const lang: Lang = locale === 'ru' ? 'RU' : 'EN'

  function handleSetLang(nextLang: Lang) {
    const nextLocale = nextLang.toLowerCase()
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = nextLocale

    if (nextLocale === locale) return

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] overflow-x-hidden">
      <AttributionTracker />
      <Nav t={t} lang={lang} setLang={handleSetLang} switching={isPending} languageAriaLabel={languageAriaLabel} />
      <HeroSection t={t} />
      <StatsBar t={t} />
      <HowItWorksSection t={t} />
      <ReportPreviewSection t={t} />
      <FeaturesSection t={t} />
      <AIPromptsSection t={t} />
      <PricingSection />
      <FAQSection t={t} />
      <BottomCTA t={t} />
      {/* Spacer so dock doesn't clip the footer's clip-path container on mobile */}
      <MobileDockSpacer />
      <CinematicFooter />
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ t, lang, setLang, switching, languageAriaLabel }: { t: Translations; lang: Lang; setLang: (l: Lang) => void; switching: boolean; languageAriaLabel: string }) {
  const [langOpen, setLangOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return
    const supabase = createBrowserClient(url, key)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <>
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* left */}
        <div className="flex items-center gap-8">
          <SiteBrandLink />
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={() => smoothScrollTo('#how-it-works')}
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.howItWorks}
            </button>
            <button
              onClick={() => smoothScrollTo('#preview')}
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.seeReport}
            </button>
            <button
              onClick={() => smoothScrollTo('#features')}
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.whatWeCheck}
            </button>
            <button
              onClick={() => smoothScrollTo('#faq')}
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.faq}
            </button>
            <button
              onClick={() => smoothScrollTo('#pricing')}
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.pricing}
            </button>
            <Link
              href="/methodology"
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap"
            >
              {t.nav.methodology}
            </Link>
          </div>
        </div>

        {/* right */}
        <div className="flex items-center gap-4">
          {/* globe language picker */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#8B8A85] hover:text-[#F1F0EE] hover:bg-white/[0.04] transition-colors"
              aria-label={languageAriaLabel}
              aria-busy={switching}
            >
              <IconGlobe />
              <span className="text-xs font-mono">{lang}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 py-1 bg-[#161618] border border-white/[0.08] rounded-xl shadow-xl z-50 w-[86px] overflow-hidden">
                {(['EN', 'RU'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false) }}
                    disabled={switching}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-mono transition-colors ${
                      lang === l ? 'text-[#F1F0EE] bg-white/[0.05]' : 'text-[#8B8A85] hover:text-[#F1F0EE] hover:bg-white/[0.03]'
                    }`}
                  >
                    <span>{l === 'EN' ? '🇬🇧' : '🇷🇺'}</span>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop auth buttons — hidden on mobile (dock handles page-level mobile navigation; sheet handles section scrolling) */}
          {userEmail ? (
            <a
              href="/dashboard"
              className="hidden md:inline-flex text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium whitespace-nowrap"
            >
              {t.nav.dashboard}
            </a>
          ) : (
            <>
              <a href="/auth/login" className="hidden md:block text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap">
                {t.nav.signIn}
              </a>
              <a
                href="/auth/login?mode=signup"
                className="hidden md:inline-flex text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium whitespace-nowrap"
              >
                {t.nav.getStarted}
              </a>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 text-[#8B8A85] hover:text-[#F1F0EE] transition-colors"
            aria-label="Open navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16"/>
              <path d="M4 12h16"/>
              <path d="M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>

    </nav>
    <MobileNavSheet
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      labels={{
        howItWorks: t.nav.howItWorks,
        seeReport: t.nav.seeReport,
        whatWeCheck: t.nav.whatWeCheck,
        faq: t.nav.faq,
        pricing: t.nav.pricing,
        methodology: t.nav.methodology,
      }}
      onScrollTo={smoothScrollTo}
    />
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ t }: { t: Translations }) {
  return (
    <section id="scan" className="relative flex min-h-[680px] flex-col justify-center overflow-hidden px-6 pb-24 pt-32 text-center sm:pb-28 sm:pt-36">
      {/* WebGL domain-warped FBM noise shader */}
      <HeroNoise className="z-0" />
      {/* Particles on top of noise */}
      <Particles
        className="absolute inset-0 z-[1]"
        quantity={60}
        color="#a78bfa"
        ease={100}
        size={0.4}
        staticity={60}
      />
      <div className="relative z-10 mx-auto w-full max-w-3xl overflow-visible">
        <h1
          className="hero-1 text-[28px] sm:text-[46px] md:text-[68px] font-semibold leading-[1.1] tracking-[-0.02em] break-words"
        >
          {t.hero.h1a}
          <span className="block mt-1">
            <AnimatedGradientText
              colorFrom="#6E56CF"
              colorTo="#a78bfa"
              speed={2}
              className="text-[28px] sm:text-[46px] md:text-[68px] font-semibold leading-[1.1] tracking-[-0.02em]"
            >
              {t.hero.h1b}
            </AnimatedGradientText>
          </span>
        </h1>

        <p className="hero-2 mt-5 text-base text-[#8B8A85] max-w-xl mx-auto leading-relaxed">
          {t.hero.sub}
        </p>

        <div className="hero-3 mt-10 w-full">
          <ScanForm />
          <p className="mt-3 text-xs text-[#5A5955]">{t.hero.noSignup}</p>
        </div>

        <div className="hero-4 mt-8 max-w-2xl mx-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6E56CF]/25 bg-[#6E56CF]/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.12em] text-[#CBBEFF]">
              <IconBot />
              <span>{t.hero.aiCompatibilityBadge}</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-[#E7E4DE]">
              {t.hero.worksWith}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Cursor', 'Claude Code', 'Windsurf', 'Codex', 'Gemini'].map(p => (
                <div key={p} className="works-chip">
                  <span className="works-chip-inner">{p}</span>
                </div>
              ))}
              <span className="text-xs text-[#6F6E69]">{t.hero.worksWithExamples}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ t }: { t: Translations }) {
  const [scansCount, setScansCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/public/stats')
      .then(r => r.json())
      .then((data: { scansCount: number }) => setScansCount(data.scansCount))
      .catch(() => {/* silently ignore */})
  }, [])

  return (
    <section className="border-y border-white/[0.06] py-8 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {t.stats.map((s, i) => {
          const isLiveCount = i === 2
          const displayValue = isLiveCount
            ? (scansCount !== null ? String(scansCount) : null)
            : s.value
          const numMatch = displayValue?.match(/^(\d+)([+\w]*)$/)

          return (
            <motion.div key={i} {...fadeUp(i * 0.07)} className="text-center">
              <div className="text-2xl font-mono font-medium flex items-center justify-center gap-2">
                {isLiveCount && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: scansCount !== null ? '#3DDC84' : '#5A5955' }}
                  />
                )}
                {displayValue === null ? (
                  <span className="text-[#5A5955]">…</span>
                ) : numMatch ? (
                  <>
                    <NumberTicker value={parseInt(numMatch[1])} className="text-2xl font-mono font-medium text-[#F1F0EE]" />
                    {numMatch[2]}
                  </>
                ) : (
                  displayValue
                )}
              </div>
              <div className="text-xs text-[#5A5955] mt-1 min-h-[1.25rem]">{s.label}</div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection({ t }: { t: Translations }) {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <AnimatedShinyText
              shimmerWidth={120}
              className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono"
            >
              {t.how.eyebrow}
            </AnimatedShinyText>
          </div>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em]">{t.how.title}</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 relative">
          <div className="hidden md:block absolute top-10 left-[calc(33%+24px)] right-[calc(33%+24px)] h-px bg-gradient-to-r from-[#6E56CF]/20 via-[#6E56CF]/40 to-[#6E56CF]/20" />
          {t.how.steps.map((item, i) => (
            <motion.div key={item.step} {...fadeUp(i * 0.12)}>
              <SpotlightCard className="h-full p-6 rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-[#6E56CF]/30 transition-colors">
                <div className="relative z-10">
                  <div className="font-mono text-xs text-[#5A5955] mb-5 tracking-widest">{item.step}</div>
                  <div className="mb-4 text-[#6E56CF]">
                    {i === 0 && (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                    )}
                    {i === 1 && (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                        <rect x="7" y="7" width="10" height="10" rx="1"/>
                      </svg>
                    )}
                    {i === 2 && (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-[#8B8A85] leading-relaxed">{item.desc}</p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Report preview ───────────────────────────────────────────────────────────

function ReportPreviewSection({ t }: { t: Translations }) {
  const previewCategories = [
    { name: t.features.items[0].title, score: 74, color: '#F5C518', icon: '⚡' },
    { name: t.features.items[1].title, score: 89, color: '#4A9EFF', icon: '🔍' },
    { name: t.features.items[2].title, score: 63, color: '#FF4444', icon: '🛡️' },
    { name: t.features.items[3].title, score: 91, color: '#3DDC84', icon: '📱' },
    { name: t.features.items[4].title, score: 46, color: '#A78BFA', icon: '🤖' },
    { name: t.features.items[5].title, score: 82, color: '#22D3EE', icon: '♿' },
  ] as const

  return (
    <section id="preview" className="py-8 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <AnimatedShinyText
              shimmerWidth={120}
              className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono"
            >
              {t.preview.eyebrow}
            </AnimatedShinyText>
          </div>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em]">{t.preview.title}</h2>
          <p className="mt-3 text-[#8B8A85] max-w-lg mx-auto text-sm">{t.preview.sub}</p>
        </motion.div>

        <motion.div
          {...fadeUp(0.1)}
          className="relative rounded-2xl bg-[#161618] border border-white/[0.06] overflow-hidden shadow-[0_0_80px_rgba(110,86,207,0.08)]"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#0E0E0F]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 mx-2 px-3 py-1 rounded-md bg-[#1E1E21] text-xs font-mono text-[#5A5955] truncate">
              shipready.app/report/vercel-com-demo
            </div>
            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6E56CF]/15 border border-[#6E56CF]/25 text-[#CBBEFF] uppercase tracking-[0.08em]">
              Live example
            </span>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-8 items-start mb-6">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative w-[110px] h-[110px]">
                  <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
                    <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                    <circle cx="55" cy="55" r="46" fill="none" stroke="#7BC67E" strokeWidth="7" strokeLinecap="round" strokeDasharray="289" strokeDashoffset="72" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] font-mono font-medium">71</span>
                    <span className="text-[8px] text-[#5A5955] uppercase tracking-widest">{t.demo.score}</span>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#7BC67E]/10 text-[#7BC67E] font-mono">{t.demo.grade}</span>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                {previewCategories.map(cat => (
                  <div key={cat.name} className="p-3 rounded-xl bg-[#1E1E21] border border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#8B8A85] flex items-center gap-1.5">
                        <span>{cat.icon}</span>{cat.name}
                      </span>
                      <span className="font-mono text-sm font-medium" style={{ color: cat.color }}>{cat.score}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${cat.score}%`, background: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#A78BFA]/25 bg-[#A78BFA]/[0.04] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#A78BFA]/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4444]" />
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#FF4444]">{t.demo.severity}</span>
                <span className="text-sm font-medium">No llms.txt found</span>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-[#8B8A85] mb-4 leading-relaxed">vercel.com has no llms.txt or ai.txt. AI assistants like ChatGPT, Perplexity, and Claude cannot discover the site&apos;s content boundaries — limiting citations and AI-driven traffic.</p>
                <div className="flex gap-2 mb-4">
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors">{t.demo.recommendedFix}</button>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-[#1E1E21] border border-white/[0.08] text-[#8B8A85] hover:bg-[#232328] transition-colors">{t.demo.copyPrompt}</button>
                </div>
                <div className="relative rounded-lg bg-[#0E0E0F] border border-white/[0.06] overflow-hidden">
                  <div className="px-4 py-3">
                    <pre className="text-[11px] font-mono text-[#8B8A85] blur-sm select-none leading-relaxed">{t.demo.prompt}</pre>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0E0E0F]/70 backdrop-blur-[2px]">
                    <button
                      onClick={() => smoothScrollTo('#pricing')}
                      className="text-xs px-4 py-2 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{t.preview.upgradeBtn}</span>
                      <IconArrow />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-[#5A5955] text-center">Real scan of vercel.com · Updated May 2026</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection({ t }: { t: Translations }) {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <AnimatedShinyText
              shimmerWidth={120}
              className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono"
            >
              {t.features.eyebrow}
            </AnimatedShinyText>
          </div>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em]">{t.features.title}</h2>
          <p className="mt-3 text-[#8B8A85] text-sm max-w-md mx-auto">{t.features.sub}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {t.features.items.map((f, i) => {
            const { Icon, color } = FEATURE_META[i]
            return (
              <motion.div
                key={f.title}
                {...fadeUp(i * 0.09)}
                className="group relative p-6 rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-white/[0.10] transition-all overflow-hidden"
              >
                {/* Category color glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 10% 10%, ${color}18 0%, transparent 65%)` }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl" style={{ background: `${color}16`, color }}>
                      <Icon />
                    </div>
                    <h3 className="font-semibold tracking-tight">{f.title}</h3>
                  </div>
                  <p className="text-sm text-[#8B8A85] mb-5 leading-relaxed">{f.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.checks.map(check => (
                      <span key={check} className="text-[11px] px-2 py-0.5 rounded-md bg-[#1E1E21] border border-white/[0.06] text-[#5A5955] font-mono">
                        {check}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── AI prompts ───────────────────────────────────────────────────────────────

function AIPromptsSection({ t }: { t: Translations }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(t.ai.promptText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="py-24 px-6 bg-[#161618] border-y border-white/[0.06] relative overflow-hidden">
      <DotPattern
        className="z-0 opacity-[0.025] [mask-image:radial-gradient(ellipse_60%_80%_at_70%_50%,black,transparent)]"
        width={20}
        height={20}
        cr={1}
      />
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div {...fadeUp()}>
          <div className="inline-flex items-center gap-2 mb-4">
            <AnimatedShinyText
              shimmerWidth={120}
              className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono"
            >
              {t.ai.eyebrow}
            </AnimatedShinyText>
          </div>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em] mb-4 whitespace-pre-line">{t.ai.title}</h2>
          <p className="text-[#8B8A85] leading-relaxed mb-6 text-sm">{t.ai.sub}</p>
          <ul className="space-y-3">
            {t.ai.bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#8B8A85]">
                <span className="mt-0.5 shrink-0 text-[#3DDC84]">
                  <IconCheckCircle size={14} color="#3DDC84" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="relative rounded-2xl bg-[#0E0E0F] border border-white/[0.10] overflow-hidden">
          {/* Flickering grid — terminal/matrix feel */}
          <div className="absolute inset-0 pointer-events-none">
            <FlickeringGrid
              squareSize={3}
              gridGap={5}
              flickerChance={0.04}
              color="#6E56CF"
              maxOpacity={0.12}
              className="h-full w-full"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] relative z-10">
            <span className="text-xs font-mono text-[#5A5955]">{t.ai.fileLabel}</span>
            <span className="ml-auto text-[11px] text-[#3DDC84] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC84]" />
              {t.ai.ready}
            </span>
          </div>
          <div className="p-5 relative z-10">
            <pre className="text-[11px] font-mono text-[#E8C77D] leading-relaxed whitespace-pre-wrap overflow-x-auto">{t.ai.promptText}</pre>
          </div>
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-3 relative z-10">
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                copied
                  ? 'bg-[#3DDC84]/20 text-[#3DDC84] border border-[#3DDC84]/30'
                  : 'bg-[#6E56CF] text-white hover:bg-[#7C68D4]'
              }`}
            >
              {copied ? (
                <>
                  <IconCheckCircle size={12} color="currentColor" /> {t.ai.copiedBtn}
                </>
              ) : (
                <>
                  <IconCopy /> {t.ai.copyBtn}
                </>
              )}
            </button>
            <span className="text-xs text-[#5A5955]">{t.ai.pasteHint}</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQSection({ t }: { t: Translations }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <AnimatedShinyText
              shimmerWidth={120}
              className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono"
            >
              {t.faq.eyebrow}
            </AnimatedShinyText>
          </div>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em]">{t.faq.title}</h2>
        </motion.div>

        <motion.div {...fadeUp(0.08)} className="rounded-2xl border border-white/[0.06] bg-[#161618] overflow-hidden">
          {t.faq.items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className={i > 0 ? 'border-t border-white/[0.06]' : ''}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer group min-h-[44px]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-[#F1F0EE] group-hover:text-white transition-colors leading-snug">
                    {item.q}
                  </span>
                  <span
                    className="shrink-0 text-[#5A5955] group-hover:text-[#8B8A85] transition-all duration-300"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <IconChevron size={15} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className="px-6 pb-5 text-sm text-[#8B8A85] leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA({ t }: { t: Translations }) {
  return (
    <section id="cta" className="scroll-mt-24 py-24 px-6 relative overflow-hidden">
      <DotPattern
        className="z-0 opacity-[0.04] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"
        width={20}
        height={20}
        cr={1}
      />
      <div className="max-w-2xl mx-auto text-center relative z-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(110,86,207,0.12) 0%, transparent 70%)' }}
        />
        <motion.div {...fadeUp()} className="relative">
          <h2 className="text-[40px] font-semibold tracking-[-0.03em] mb-3">{t.cta.title}</h2>
          <p className="text-[#8B8A85] mb-10 text-sm">{t.cta.sub}</p>
          <ScanForm />
        </motion.div>
      </div>
    </section>
  )
}
