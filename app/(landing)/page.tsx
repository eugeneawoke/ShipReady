'use client'

import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ScanForm } from '@/components/landing/ScanForm'
import { Particles } from '@/components/ui/particles'
import { HeroNoise } from '@/components/ui/hero-noise'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { NumberTicker } from '@/components/ui/number-ticker'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import { Meteors } from '@/components/ui/meteors'
import { FlickeringGrid } from '@/components/ui/flickering-grid'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { CinematicFooter } from '@/components/ui/motion-footer'

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

const CONTACT = {
  email: 'hi@shipready.app',
  x:     'https://x.com/eugenegusakoff',
  tg:    'https://t.me/eugenegusakoff',
}

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

// ─── translations ─────────────────────────────────────────────────────────────

const T = {
  EN: {
    nav: {
      howItWorks: 'How it works',
      pricing: 'Pricing',
      signIn: 'Sign in',
      getStarted: 'Get started',
    },
    hero: {
      h1a: 'Your vibe-coded app,',
      h1b: 'ship-ready in 30 sec',
      sub: 'Paste your URL. Get a full audit — performance, SEO, security, mobile, AI visibility — with AI fix prompts for Cursor and Bolt.',
      noSignup: 'No signup required for first scan',
      worksWith: 'Works with',
    },
    stats: [
      { value: '40+', label: 'automated checks' },
      { value: '5',   label: 'categories covered' },
      { value: '30s', label: 'average scan time' },
      { value: 'AI',  label: 'fix prompt per issue' },
    ],
    how: {
      eyebrow: 'How it works',
      title: 'Three steps to ship-ready',
      steps: [
        { step: '01', emoji: '🔗', title: 'Paste your URL',       desc: 'Drop any live URL — Vercel, Netlify, custom domain. No setup or browser extension needed.' },
        { step: '02', emoji: '⚙️', title: '40+ checks run',       desc: 'Lighthouse, SEO meta, security headers, SSL, mobile viewport, AI visibility — all in parallel within 30 seconds.' },
        { step: '03', emoji: '✨', title: 'Get AI fix prompts',   desc: 'Each issue has a plain-English explanation and a ready-to-paste prompt for Cursor or Bolt.' },
      ],
    },
    preview: {
      eyebrow: 'The report',
      title: 'Not just scores — actionable fixes',
      sub: 'A complete breakdown of every issue with context, severity, and ready-to-use AI prompts.',
      upgradeBtn: 'Upgrade to see AI fix',
    },
    demo: {
      score: 'SCORE',
      grade: 'Good',
      severity: 'Critical',
      issueTitle: 'Content Security Policy header missing',
      issueDesc: 'Without CSP, your app is open to XSS attacks. An attacker can inject scripts that steal session tokens or user data.',
      fixCursor: 'Fix with Cursor ↗',
      fixBolt: 'Fix with Bolt ↗',
      prompt: "Add Content-Security-Policy to next.config.ts:\nheaders: [{ key: 'Content-Security-Policy',\n  value: \"default-src 'self'; script-src 'self'\" }]\nThis fixes the critical security issue immediately.",
    },
    features: {
      eyebrow: 'What we check',
      title: '40+ checks across 5 categories',
      sub: 'Every check that matters before your app goes live.',
      items: [
        { title: 'Performance',    desc: 'Real Lighthouse run in a headless browser. Core Web Vitals, LCP, CLS, INP, FCP, Speed Index.',       checks: ['LCP < 2.5s', 'CLS < 0.1', 'INP < 200ms', 'FCP < 1.8s', 'Speed Index'] },
        { title: 'SEO & Social',   desc: 'Complete meta audit. OG tags, Twitter cards, canonical, robots.txt, sitemap, structured data.',    checks: ['Title & description', 'OG image & tags', 'Canonical URL', 'Sitemap.xml', 'Twitter card'] },
        { title: 'Security',       desc: '11 security checks: HTTP headers, SSL cert validity, exposed .env files, API key detection.',        checks: ['CSP header', 'HSTS', 'X-Frame-Options', 'SSL/TLS cert', 'Exposed .env'] },
        { title: 'Mobile',         desc: 'Viewport meta, touch target sizes, font readability, horizontal overflow, tap target spacing.',    checks: ['Viewport meta', 'Touch 44px+', 'Font size ≥ 16px', 'No horiz. scroll', 'Tap spacing'] },
        { title: 'AI Visibility',  desc: 'AEO + GEO checks: Schema.org, FAQ schema, llms.txt, AI crawler access, sitemap, author entity.',  checks: ['Schema.org JSON-LD', 'llms.txt', 'AI crawlers', 'Sitemap.xml', 'FAQ schema'] },
      ],
    },
    ai: {
      eyebrow: 'The key difference',
      title: "Not just \"what's wrong\" —\nbut how to fix it",
      sub: "Every issue comes with a plain-English explanation and a ready-to-paste prompt. Copy it into Cursor or Bolt — it fixes the problem automatically.",
      bullets: [
        'One prompt per issue — no Stack Overflow hunting',
        'Tailored for Next.js, React, and vibe-coded apps',
        'Works with Cursor, Bolt, Lovable, v0, Windsurf',
      ],
      fileLabel: 'cursor_prompt.txt',
      ready: 'ready to paste',
      copyBtn: 'Copy prompt',
      copiedBtn: 'Copied!',
      pasteHint: '→ paste into Cursor chat',
      promptText: "Fix the missing Content-Security-Policy header\nin my Next.js app.\n\nAdd to next.config.ts headers():\n{\n  key: 'Content-Security-Policy',\n  value: [\n    \"default-src 'self'\",\n    \"script-src 'self' 'unsafe-eval'\",\n    \"style-src 'self' 'unsafe-inline'\",\n  ].join('; ')\n}\n\nThis protects against XSS and will score\n100/100 on security headers.",
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Simple, transparent',
      sub: 'Start free. Upgrade when you need more.',
      plans: [
        { name: 'Free',   nameKey: 'FREE',   price: '$0',  period: null,  desc: 'Try it out',         features: ['3 scans / month', 'All category scores', 'Issue descriptions', 'AI prompts blurred'],            cta: 'Start free',    highlight: false, coming: false },
        { name: 'Pro',    nameKey: 'PRO',    price: '$14', period: '/mo', desc: 'For solo founders',  features: ['Unlimited scans', 'All AI fix prompts', 'PDF export', 'Weekly monitoring', 'Email alerts'],       cta: 'Get Pro',       highlight: true,  coming: false },
        { name: 'Agency', nameKey: 'AGENCY', price: '$39', period: '/mo', desc: 'For teams',          features: ['10 domains', 'White-label PDF', 'All Pro features', 'Priority support', 'API access'],           cta: 'Get Agency',    highlight: false, coming: true  },
      ],
      popular: 'Most popular',
      cancelAnytime: 'Cancel anytime',
      comingSoon: 'Coming soon',
    },
    cta: {
      title: 'Is your app ship-ready?',
      sub: 'Run a free scan and find out in 30 seconds.',
    },
    footer: {
      tagline: 'Pre-deploy quality gate for vibe-coded apps.',
      madeBy: 'Made with ♥ by',
      colProduct: 'Product',
      colSupport: 'Support',
      colLegal: 'Legal',
      howItWorks: 'How it works',
      pricing: 'Pricing',
      roadmap: 'Roadmap',
      exampleReport: 'Example report',
      emailLabel: 'Email support',
      xLabel: 'X (Twitter)',
      tgLabel: 'Telegram',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      copy: '© 2025 ShipReady · Handcrafted for indie builders & vibe coders',
    },
  },

  RU: {
    nav: {
      howItWorks: 'Как это работает',
      pricing: 'Тарифы',
      signIn: 'Войти',
      getStarted: 'Начать',
    },
    hero: {
      h1a: 'Ваше vibe-coded приложение,',
      h1b: 'готово к деплою за 30 сек',
      sub: 'Вставьте URL и получите полный аудит — производительность, SEO, безопасность, мобильный, видимость для ИИ — с AI-промптами для Cursor и Bolt.',
      noSignup: 'Первый скан без регистрации',
      worksWith: 'Работает с',
    },
    stats: [
      { value: '40+', label: 'автоматических проверок' },
      { value: '5',   label: 'категорий' },
      { value: '30с', label: 'среднее время скана' },
      { value: 'AI',  label: 'промпт на каждую проблему' },
    ],
    how: {
      eyebrow: 'Как это работает',
      title: 'Три шага до готовности',
      steps: [
        { step: '01', emoji: '🔗', title: 'Вставьте URL',          desc: 'Любой живой URL — Vercel, Netlify, свой домен. Без настройки и расширений.' },
        { step: '02', emoji: '⚙️', title: 'Запускаем 40+ проверок', desc: 'Lighthouse, SEO-мета, заголовки безопасности, SSL, мобильный вьюпорт, видимость для ИИ — параллельно за 30 секунд.' },
        { step: '03', emoji: '✨', title: 'Получаете AI-промпты',   desc: 'К каждой проблеме — понятное объяснение и готовый промпт для Cursor или Bolt.' },
      ],
    },
    preview: {
      eyebrow: 'Отчёт',
      title: 'Не просто оценки — конкретные исправления',
      sub: 'Полный разбор каждой проблемы с контекстом, серьёзностью и готовыми AI-промптами.',
      upgradeBtn: 'Обновитесь чтобы увидеть исправление',
    },
    demo: {
      score: 'ОЦЕНКА',
      grade: 'Хорошо',
      severity: 'Критично',
      issueTitle: 'Отсутствует заголовок Content Security Policy',
      issueDesc: 'Без CSP ваше приложение уязвимо для XSS-атак. Злоумышленник может внедрить скрипты, которые украдут токены сессий или данные пользователей.',
      fixCursor: 'Исправить в Cursor ↗',
      fixBolt: 'Исправить в Bolt ↗',
      prompt: "Добавьте Content-Security-Policy в next.config.ts:\nheaders: [{ key: 'Content-Security-Policy',\n  value: \"default-src 'self'; script-src 'self'\" }]\nЭто исправит критическую проблему безопасности.",
    },
    features: {
      eyebrow: 'Что проверяем',
      title: '40+ проверок по 5 категориям',
      sub: 'Всё что важно до деплоя вашего приложения.',
      items: [
        { title: 'Производительность',  desc: 'Реальный Lighthouse в headless-браузере. Core Web Vitals, LCP, CLS, INP, FCP, Speed Index.',  checks: ['LCP < 2.5с', 'CLS < 0.1', 'INP < 200мс', 'FCP < 1.8с', 'Speed Index'] },
        { title: 'SEO и соцсети',       desc: 'Полный аудит мета-тегов. OG, Twitter cards, canonical, robots.txt, sitemap.',               checks: ['Title & description', 'OG изображение', 'Canonical URL', 'Sitemap.xml', 'Twitter card'] },
        { title: 'Безопасность',        desc: '11 проверок: HTTP-заголовки, SSL, открытые .env файлы, обнаружение API-ключей.',             checks: ['CSP заголовок', 'HSTS', 'X-Frame-Options', 'SSL/TLS', 'Открытый .env'] },
        { title: 'Мобильный',           desc: 'Viewport meta, размеры кнопок, читаемость шрифтов, горизонтальный скролл.',                 checks: ['Viewport meta', 'Тач 44px+', 'Шрифт ≥ 16px', 'Без гор. скролла', 'Отступы'] },
        { title: 'Видимость для ИИ',    desc: 'AEO + GEO: Schema.org, FAQ-разметка, llms.txt, доступ ИИ-краулеров, sitemap, автор.',       checks: ['Schema.org JSON-LD', 'llms.txt', 'ИИ-краулеры', 'Sitemap.xml', 'FAQ schema'] },
      ],
    },
    ai: {
      eyebrow: 'Ключевое отличие',
      title: 'Не просто «что не так» —\nно как исправить',
      sub: 'К каждой проблеме — понятное объяснение и готовый промпт. Вставьте в Cursor или Bolt — исправится автоматически.',
      bullets: [
        'Один промпт на проблему — без Stack Overflow',
        'Адаптировано для Next.js, React и vibe-coded приложений',
        'Работает с Cursor, Bolt, Lovable, v0, Windsurf',
      ],
      fileLabel: 'cursor_prompt.txt',
      ready: 'готов к вставке',
      copyBtn: 'Скопировать промпт',
      copiedBtn: 'Скопировано!',
      pasteHint: '→ вставьте в чат Cursor',
      promptText: "Исправьте отсутствующий заголовок Content-Security-Policy\nв вашем Next.js приложении.\n\nДобавьте в next.config.ts headers():\n{\n  key: 'Content-Security-Policy',\n  value: [\n    \"default-src 'self'\",\n    \"script-src 'self' 'unsafe-eval'\",\n    \"style-src 'self' 'unsafe-inline'\",\n  ].join('; ')\n}\n\nЭто защитит от XSS и даст\n100/100 по заголовкам безопасности.",
    },
    pricing: {
      eyebrow: 'Тарифы',
      title: 'Просто и прозрачно',
      sub: 'Начните бесплатно. Обновитесь когда нужно.',
      plans: [
        { name: 'Бесплатно', nameKey: 'FREE',   price: '$0',  period: null,   desc: 'Попробуйте',         features: ['3 скана / месяц', 'Все категориальные оценки', 'Описания проблем', 'AI-промпты размыты'],                      cta: 'Начать бесплатно', highlight: false, coming: false },
        { name: 'Pro',       nameKey: 'PRO',    price: '$14', period: '/мес', desc: 'Для соло-фаундеров', features: ['Безлимитные сканы', 'Все AI-промпты', 'Экспорт PDF', 'Еженедельный мониторинг', 'Email-уведомления'],         cta: 'Получить Pro',     highlight: true,  coming: false },
        { name: 'Агентство', nameKey: 'AGENCY', price: '$39', period: '/мес', desc: 'Для команд',         features: ['10 доменов', 'PDF с белым лейблом', 'Всё из Pro', 'Приоритетная поддержка', 'Доступ к API'],                  cta: 'Для агентств',     highlight: false, coming: true  },
      ],
      popular: 'Популярный',
      cancelAnytime: 'Отмена в любой момент',
      comingSoon: 'Скоро',
    },
    cta: {
      title: 'Ваше приложение готово к деплою?',
      sub: 'Запустите бесплатный скан за 30 секунд.',
    },
    footer: {
      tagline: 'Аудит качества перед деплоем для vibe-coded приложений.',
      madeBy: 'Сделано с ♥',
      colProduct: 'Продукт',
      colSupport: 'Поддержка',
      colLegal: 'Документы',
      howItWorks: 'Как это работает',
      pricing: 'Тарифы',
      roadmap: 'Роадмэп',
      exampleReport: 'Пример отчёта',
      emailLabel: 'Email',
      xLabel: 'X (Twitter)',
      tgLabel: 'Telegram',
      privacy: 'Политика конфиденциальности',
      terms: 'Условия использования',
      copy: '© 2025 ShipReady · Сделано для инди-разработчиков с заботой',
    },
  },
} as const

type Lang = keyof typeof T
type Translations = {
  nav: { howItWorks: string; pricing: string; signIn: string; getStarted: string }
  hero: { h1a: string; h1b: string; sub: string; noSignup: string; worksWith: string }
  stats: readonly { value: string; label: string }[]
  how: { eyebrow: string; title: string; steps: readonly { step: string; emoji: string; title: string; desc: string }[] }
  preview: { eyebrow: string; title: string; sub: string; upgradeBtn: string }
  demo: { score: string; grade: string; severity: string; issueTitle: string; issueDesc: string; fixCursor: string; fixBolt: string; prompt: string }
  features: { eyebrow: string; title: string; sub: string; items: readonly { title: string; desc: string; checks: readonly string[] }[] }
  ai: { eyebrow: string; title: string; sub: string; bullets: readonly string[]; fileLabel: string; ready: string; copyBtn: string; copiedBtn: string; pasteHint: string; promptText: string }
  pricing: { eyebrow: string; title: string; sub: string; popular: string; cancelAnytime: string; comingSoon: string; plans: readonly { name: string; nameKey: string; price: string; period: string | null; desc: string; features: readonly string[]; cta: string; highlight: boolean; coming: boolean }[] }
  cta: { title: string; sub: string }
  footer: { tagline: string; madeBy: string; colProduct: string; colSupport: string; colLegal: string; howItWorks: string; pricing: string; roadmap: string; exampleReport: string; emailLabel: string; xLabel: string; tgLabel: string; privacy: string; terms: string; copy: string }
}

// ─── animation helpers ────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
})

// ─── feature meta ─────────────────────────────────────────────────────────────

const FEATURE_META = [
  { Icon: IconZap,    color: '#FF8C42' },
  { Icon: IconSearch, color: '#4A9EFF' },
  { Icon: IconShield, color: '#FF4444' },
  { Icon: IconPhone,  color: '#3DDC84' },
  { Icon: IconBot,    color: '#A78BFA' },
]

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('EN')
  const t = T[lang] as unknown as Translations

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] overflow-x-hidden">
      <Nav t={t} lang={lang} setLang={setLang} />
      <HeroSection t={t} />
      <StatsBar t={t} />
      <HowItWorksSection t={t} />
      <ReportPreviewSection t={t} />
      <FeaturesSection t={t} />
      <AIPromptsSection t={t} />
      <PricingSection t={t} />
      <BottomCTA t={t} />
      <CinematicFooter />
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ t, lang, setLang }: { t: Translations; lang: Lang; setLang: (l: Lang) => void }) {
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return
    const supabase = createBrowserClient(url, key)
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
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
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* left */}
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight cursor-pointer hover:opacity-80 transition-opacity" style={{ fontFamily: 'var(--font-syne)' }}>
              <img src="/logo.svg" alt="ShipReady logo" className="w-7 h-7 flex-shrink-0" />
              ShipReady
            </a>
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => smoothScrollTo('#how-it-works')}
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.howItWorks}
            </button>
            <button
              onClick={() => smoothScrollTo('#pricing')}
              className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.nav.pricing}
            </button>
          </div>
        </div>

        {/* right */}
        <div className="flex items-center gap-4">
          {/* globe language picker */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#8B8A85] hover:text-[#F1F0EE] hover:bg-white/[0.04] transition-colors"
              aria-label="Switch language"
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

          {userEmail ? (
            <a
              href="/dashboard"
              className="text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium whitespace-nowrap"
            >
              Dashboard
            </a>
          ) : (
            <>
              <a href="/auth/login" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors hidden sm:block whitespace-nowrap">
                {t.nav.signIn}
              </a>
              <a
                href="/auth/login?mode=signup"
                className="text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium whitespace-nowrap"
              >
                {t.nav.getStarted}
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ t }: { t: Translations }) {
  return (
    <section className="relative pt-36 pb-28 px-6 text-center overflow-hidden min-h-[680px] flex flex-col justify-center">
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
      <div className="max-w-3xl mx-auto relative z-10">
        <h1
          className="hero-1 text-[52px] md:text-[68px] font-semibold leading-[1.0] tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          {t.hero.h1a}
          <span className="block mt-1">
            <AnimatedGradientText
              colorFrom="#6E56CF"
              colorTo="#a78bfa"
              speed={2}
              className="text-[52px] md:text-[68px] font-semibold leading-[1.0] tracking-[-0.03em]"
            >
              {t.hero.h1b}
            </AnimatedGradientText>
          </span>
        </h1>

        <p className="hero-2 mt-6 text-lg text-[#8B8A85] max-w-xl mx-auto leading-relaxed">
          {t.hero.sub}
        </p>

        <div className="hero-3 mt-10">
          <ScanForm />
          <p className="mt-3 text-xs text-[#5A5955]">{t.hero.noSignup}</p>
        </div>

        <div className="hero-4 mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-[#5A5955] mr-1">{t.hero.worksWith}</span>
          {['Cursor', 'Bolt', 'Lovable', 'v0', 'Replit', 'Windsurf', 'Claude', 'OpenAI'].map(p => (
            <div key={p} className="works-chip">
              <span className="works-chip-inner">{p}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ t }: { t: Translations }) {
  return (
    <section className="border-y border-white/[0.06] py-8 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {t.stats.map((s, i) => {
          const numMatch = s.value.match(/^(\d+)([+\w]*)$/)
          return (
            <motion.div key={i} {...fadeUp(i * 0.07)} className="text-center">
              <div className="text-2xl font-mono font-medium">
                {numMatch ? (
                  <>
                    <NumberTicker value={parseInt(numMatch[1])} className="text-2xl font-mono font-medium text-[#F1F0EE]" />
                    {numMatch[2]}
                  </>
                ) : s.value}
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
              shipready.app/report/my-startup-app
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-8 items-start mb-6">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative w-[110px] h-[110px]">
                  <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
                    <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                    <circle cx="55" cy="55" r="46" fill="none" stroke="#7BC67E" strokeWidth="7" strokeLinecap="round" strokeDasharray="289" strokeDashoffset="63" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] font-mono font-medium">78</span>
                    <span className="text-[8px] text-[#5A5955] uppercase tracking-widest">{t.demo.score}</span>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#7BC67E]/10 text-[#7BC67E] font-mono">{t.demo.grade}</span>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                {[
                  { name: 'Performance', score: 72, color: '#F5C518', icon: '⚡' },
                  { name: 'SEO',         score: 85, color: '#4A9EFF', icon: '🔍' },
                  { name: 'Security',    score: 61, color: '#FF4444', icon: '🛡️' },
                  { name: 'Mobile',      score: 93, color: '#3DDC84', icon: '📱' },
                  { name: 'AI Visibility', score: 48, color: '#A78BFA', icon: '🤖' },
                ].map(cat => (
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

            <div className="rounded-xl border border-[#FF4444]/25 bg-[#FF4444]/[0.04] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#FF4444]/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4444]" />
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#FF4444]">{t.demo.severity}</span>
                <span className="text-sm font-medium">{t.demo.issueTitle}</span>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-[#8B8A85] mb-4 leading-relaxed">{t.demo.issueDesc}</p>
                <div className="flex gap-2 mb-4">
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors">{t.demo.fixCursor}</button>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-[#1E1E21] border border-white/[0.08] text-[#8B8A85] hover:bg-[#232328] transition-colors">{t.demo.fixBolt}</button>
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
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection({ t }: { t: Translations }) {
  return (
    <section className="py-24 px-6">
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
                className={`group relative p-6 rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-white/[0.10] transition-all overflow-hidden${i === 4 ? ' md:col-span-2' : ''}`}
              >
                {/* Category color glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 10% 10%, ${color}18 0%, transparent 65%)` }}
                />
                <div className={`relative z-10 ${i === 4 ? 'md:flex md:gap-8 md:items-start' : ''}`}>
                  <div className={i === 4 ? 'md:flex-1' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl" style={{ background: `${color}16`, color }}>
                        <Icon />
                      </div>
                      <h3 className="font-semibold tracking-tight">{f.title}</h3>
                    </div>
                    <p className="text-sm text-[#8B8A85] mb-5 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className={`flex flex-wrap gap-1.5 ${i === 4 ? 'md:flex-1 md:mb-0 mb-0' : ''}`}>
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
            <pre className="text-[11px] font-mono text-[#E8C77D] leading-relaxed whitespace-pre-wrap">{t.ai.promptText}</pre>
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

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection({ t }: { t: Translations }) {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <AnimatedShinyText
              shimmerWidth={120}
              className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono"
            >
              {t.pricing.eyebrow}
            </AnimatedShinyText>
          </div>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em]">{t.pricing.title}</h2>
          <p className="mt-3 text-[#8B8A85] text-sm">{t.pricing.sub}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {t.pricing.plans.map((plan, i) => (
            <motion.div
              key={plan.nameKey}
              {...fadeUp(i * 0.1)}
              className={`relative p-6 rounded-2xl border ${
                plan.coming
                  ? 'bg-[#161618] border-white/[0.04] opacity-70'
                  : plan.highlight
                  ? 'bg-[#6E56CF]/[0.05] border-[#6E56CF] shadow-[0_0_60px_rgba(110,86,207,0.15)]'
                  : 'bg-[#161618] border-white/[0.06]'
              }`}
            >
              {/* Meteors for Pro card */}
              {plan.highlight && !plan.coming && (
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <Meteors number={10} minDuration={6} maxDuration={14} className="text-[#a78bfa]/70" />
                </div>
              )}
              {plan.highlight && !plan.coming && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#6E56CF] text-white px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
                  {t.pricing.popular}
                </div>
              )}
              {plan.coming && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#232328] text-[#8B8A85] border border-white/[0.10] px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
                  {t.pricing.comingSoon}
                </div>
              )}
              <div className="mb-5">
                <p className="text-[10px] text-[#5A5955] uppercase tracking-[0.15em] font-mono mb-1">{plan.nameKey}</p>
                <p className="text-sm text-[#8B8A85] mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[38px] font-mono font-medium leading-none">{plan.price}</span>
                  {plan.period && <span className="text-[#8B8A85] text-sm">{plan.period}</span>}
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, fi) => (
                  <li key={fi} className={`text-sm flex items-center gap-2 ${plan.coming ? 'text-[#5A5955]' : plan.highlight ? 'text-[#F1F0EE]' : 'text-[#8B8A85]'}`}>
                    <span className="shrink-0">
                      <IconCheckCircle size={13} color={plan.coming ? '#3A3A3A' : '#3DDC84'} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.coming ? (
                <a
                  href="/roadmap"
                  className="block w-full py-2.5 rounded-xl text-sm font-medium text-center bg-[#1E1E21] border border-white/[0.06] text-[#5A5955] hover:text-[#8B8A85] hover:border-white/[0.10] transition-colors"
                >
                  {t.pricing.comingSoon} →
                </a>
              ) : (
                <button
                  onClick={() => { if (!plan.highlight) smoothScrollTo('#cta') }}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    plan.highlight
                      ? 'bg-[#6E56CF] text-white hover:bg-[#7C68D4]'
                      : 'bg-[#1E1E21] border border-white/[0.08] text-[#F1F0EE] hover:bg-[#232328]'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
              {!plan.coming && plan.period && (
                <p className="mt-2.5 text-center text-[11px] text-[#5A5955]">
                  {t.pricing.cancelAnytime}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA({ t }: { t: Translations }) {
  return (
    <section id="cta" className="py-24 px-6 relative overflow-hidden">
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

