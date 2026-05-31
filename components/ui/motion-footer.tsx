'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useMessages } from 'next-intl'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'
import type { AppMessages } from '@/messages/en'
import { competitors, competitorSlugs } from '@/lib/vs/competitors'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

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

// ─── Styles ──────────────────────────────────────────────────────────────────

const STYLES = `
.sr-footer-wrapper {
  -webkit-font-smoothing: antialiased;

  --pill-bg-1:            color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2:            color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow:          color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight:       color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow:    color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border:          color-mix(in oklch, var(--foreground) 8%, transparent);

  --pill-bg-1-hover:      color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover:      color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover:    color-mix(in oklch, var(--foreground) 22%, transparent);
  --pill-shadow-hover:    color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}

@keyframes sr-breathe {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.9; }
}

@keyframes sr-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

@keyframes sr-heartbeat {
  0%,100% { transform: scale(1);   filter: drop-shadow(0 0 5px  color-mix(in oklch, #FF4444 50%, transparent)); }
  15%,45% { transform: scale(1.25); filter: drop-shadow(0 0 10px color-mix(in oklch, #FF4444 80%, transparent)); }
  30%     { transform: scale(1); }
}

.sr-footer-breathe  { animation: sr-breathe   8s ease-in-out infinite alternate; }
.sr-footer-marquee  { animation: sr-marquee   45s linear infinite; }
.sr-footer-heartbeat{ animation: sr-heartbeat 2s  cubic-bezier(.25,1,.5,1) infinite; }

.sr-footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right,  color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.sr-footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, #6E56CF 18%, transparent) 0%,
    color-mix(in oklch, #4A9EFF 10%, transparent) 45%,
    transparent 70%
  );
}

.sr-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow:
    0 10px 30px -10px var(--pill-shadow),
    inset 0 1px 1px var(--pill-highlight),
    inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.sr-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow:
    0 20px 40px -10px var(--pill-shadow-hover),
    inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

.sr-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 8%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.sr-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}
`

// ─── MagneticButton ───────────────────────────────────────────────────────────

type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType
  }

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = 'button', ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null)

    useEffect(() => {
      if (typeof window === 'undefined') return
      const el = localRef.current
      if (!el) return

      const ctx = gsap.context(() => {
        const onMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2
          gsap.to(el, { x: x * 0.4, y: y * 0.4, rotationX: -y * 0.15, rotationY: x * 0.15, scale: 1.05, ease: 'power2.out', duration: 0.4 })
        }
        const onLeave = () => {
          gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: 'elastic.out(1, 0.3)', duration: 1.2 })
        }
        el.addEventListener('mousemove', onMove as EventListener)
        el.addEventListener('mouseleave', onLeave)
        return () => {
          el.removeEventListener('mousemove', onMove as EventListener)
          el.removeEventListener('mouseleave', onLeave)
        }
      }, el)

      return () => ctx.revert()
    }, [])

    return (
      <Component
        ref={(node: HTMLElement) => {
          ;(localRef as React.MutableRefObject<HTMLElement | null>).current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node
        }}
        className={cn('cursor-pointer', className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
MagneticButton.displayName = 'MagneticButton'

// ─── Marquee ──────────────────────────────────────────────────────────────────

function MarqueeItem({ items }: { items: string[] }) {
  return (
    <div className="flex items-center space-x-12 px-6 font-semibold tracking-[0.25em] uppercase text-xs">
      {items.map((item) => (
        <React.Fragment key={item}>
          <span>{item}</span>
          <span className="opacity-40">✦</span>
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── ContactButton ────────────────────────────────────────────────────────────

const IconLinkedIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const IconTelegram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13"/>
    <path d="M22 2L15 22l-4-9-9-4 20-7z"/>
  </svg>
)

function ContactButton({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false)

  const contacts = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/eugene-gusakov/', icon: <IconLinkedIn /> },
    { label: 'Email',    href: 'mailto:egusakov74@gmail.com',                 icon: <IconMail /> },
    { label: 'Telegram', href: 'https://t.me/eugenegusakov',                  icon: <IconTelegram /> },
  ]

  return (
    <MagneticButton
      as="div"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="sr-glass-pill px-6 py-3 rounded-full text-[#8B8A85] font-medium text-xs md:text-sm hover:text-[#F1F0EE] overflow-hidden"
      style={{ minWidth: '80px' }}
    >
      <span
        className="flex items-center justify-center transition-all duration-200"
        style={{
          opacity: hovered ? 0 : 1,
          transform: hovered ? 'scale(0.8)' : 'scale(1)',
          position: hovered ? 'absolute' : 'relative',
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>

      {/* Icons row */}
      <span
        className="flex items-center justify-center gap-3 transition-all duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scale(1)' : 'scale(0.8)',
          position: hovered ? 'relative' : 'absolute',
        }}
      >
        {contacts.map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            aria-label={label}
            onClick={e => e.stopPropagation()}
            className="text-[#8B8A85] hover:text-[#6E56CF] transition-colors"
          >
            {icon}
          </a>
        ))}
      </span>
    </MagneticButton>
  )
}

// ─── CinematicFooter ──────────────────────────────────────────────────────────

interface CinematicFooterProps {
  scanHref?: string
  pricingHref?: string
}

function navigateToTarget(target: string) {
  if (target.startsWith('#')) {
    smoothScrollTo(target)
    return
  }

  window.location.href = target
}

export function CinematicFooter({
  scanHref = '#cta',
  pricingHref = '#pricing',
}: CinematicFooterProps) {
  const messages = useMessages() as AppMessages
  const t = messages.Landing.footer.cinematic
  const wrapperRef    = useRef<HTMLDivElement>(null)
  const giantTextRef  = useRef<HTMLDivElement>(null)
  const headingRef    = useRef<HTMLHeadingElement>(null)
  const linksRef      = useRef<HTMLDivElement>(null)
  const compareRef    = useRef<HTMLDivElement>(null)
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    if (!compareOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (compareRef.current && !compareRef.current.contains(e.target as Node)) {
        setCompareOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [compareOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || !wrapperRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: '10vh', scale: 0.85, opacity: 0 },
        {
          y: '0vh', scale: 1, opacity: 1, ease: 'power1.out',
          scrollTrigger: { trigger: wrapperRef.current, start: 'top 80%', end: 'bottom bottom', scrub: 1 },
        }
      )
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: wrapperRef.current, start: 'top 40%', end: 'bottom bottom', scrub: 1 },
        }
      )
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className="relative h-screen w-full sr-footer-wrapper"
        style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}
      >
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[#0E0E0F] text-[#F1F0EE]">

          {/* Aurora glow */}
          <div className="sr-footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 sr-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />

          {/* Grid */}
          <div className="sr-footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant bg text */}
          <div
            ref={giantTextRef}
            className="sr-giant-bg-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            READY
          </div>

          {/* Marquee */}
          <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-white/[0.06] bg-[#0E0E0F]/60 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl text-[#8B8A85]">
            <div className="flex w-max sr-footer-marquee">
              <MarqueeItem items={t.marquee} /><MarqueeItem items={t.marquee} />
            </div>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
            <h2 ref={headingRef} className="text-5xl md:text-8xl font-black sr-text-glow tracking-tighter mb-12 text-center" style={{ fontFamily: 'var(--font-heading)' }}>
              {t.heading.split('\n').map((line, index) => (
                <React.Fragment key={line}>
                  {index > 0 ? <br/> : null}
                  {line}
                </React.Fragment>
              ))}
            </h2>

            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              {/* Primary CTAs */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton
                  as="button"
                  onClick={() => navigateToTarget(scanHref)}
                  className="sr-glass-pill px-10 py-5 rounded-full text-[#F1F0EE] font-bold text-sm md:text-base flex items-center gap-3 group"
                >
                  <span className="text-[#6E56CF] group-hover:text-[#a78bfa] transition-colors text-lg">⬡</span>
                  {t.primaryCta}
                </MagneticButton>

                <MagneticButton
                  as="button"
                  onClick={() => navigateToTarget(pricingHref)}
                  className="sr-glass-pill px-10 py-5 rounded-full text-[#8B8A85] font-bold text-sm md:text-base flex items-center gap-3 group"
                >
                  <span className="text-[#6E56CF] group-hover:text-[#a78bfa] transition-colors">$</span>
                  {t.secondaryCta}
                </MagneticButton>
              </div>

              {/* Secondary links */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full mt-2">
                <MagneticButton as="a" href="/blog" className="sr-glass-pill px-6 py-3 rounded-full text-[#8B8A85] font-medium text-xs md:text-sm hover:text-[#F1F0EE]">{messages.Landing.footer.blog}</MagneticButton>

                {/* Compare dropdown — click/touch toggle */}
                <div className="relative" ref={compareRef}>
                  <button
                    type="button"
                    onClick={() => setCompareOpen(o => !o)}
                    className="sr-glass-pill px-6 py-3 rounded-full text-[#8B8A85] font-medium text-xs md:text-sm hover:text-[#F1F0EE] cursor-pointer select-none flex items-center gap-1.5 transition-colors"
                  >
                    {messages.Landing.footer.compare}
                    <svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none"
                      className="transition-transform duration-200"
                      style={{ transform: compareOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {/* Dropdown list — appears upward */}
                  {compareOpen && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[230px] bg-[#161618] border border-white/[0.08] rounded-xl p-2 z-50 shadow-2xl">
                      {competitorSlugs.map(slug => (
                        <Link
                          key={slug}
                          href={`/vs/${slug}`}
                          onClick={() => setCompareOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#8B8A85] hover:text-[#F1F0EE] hover:bg-white/[0.04] transition-colors"
                        >
                          <span className="text-[#6E56CF] font-mono text-[10px]">vs</span>
                          {competitors[slug].name}
                        </Link>
                      ))}
                      <div className="border-t border-white/[0.06] mt-1 pt-1">
                        <Link
                          href="/vs"
                          onClick={() => setCompareOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#5A5955] hover:text-[#6E56CF] transition-colors"
                        >
                          All comparisons →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <MagneticButton as="a" href="/privacy" className="sr-glass-pill px-6 py-3 rounded-full text-[#8B8A85] font-medium text-xs md:text-sm hover:text-[#F1F0EE]">{messages.Landing.footer.privacy}</MagneticButton>
                <MagneticButton as="a" href="/terms" className="sr-glass-pill px-6 py-3 rounded-full text-[#8B8A85] font-medium text-xs md:text-sm hover:text-[#F1F0EE]">{messages.Landing.footer.terms}</MagneticButton>
                <ContactButton label={t.contact} />
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative z-20 flex w-full flex-col items-center justify-between gap-3 px-6 pb-52 md:flex-row md:gap-6 md:px-12 md:pb-8">

            <div className="order-3 text-[#5A5955] text-[10px] font-semibold uppercase tracking-widest md:order-1 md:text-xs">
              © {new Date().getFullYear()} ShipReady · {t.allRightsReserved}
            </div>

            <div className="sr-glass-pill order-1 flex items-center gap-2 rounded-full px-6 py-3 md:order-2 cursor-default">
              <span className="text-[#5A5955] text-[10px] md:text-xs font-bold uppercase tracking-widest">{t.craftedWith}</span>
              <span className="sr-footer-heartbeat text-sm md:text-base text-[#FF4444]">❤</span>
              <span className="text-[#5A5955] text-[10px] md:text-xs font-bold uppercase tracking-widest">{t.by}</span>
              <a
                href="https://www.linkedin.com/in/eugene-gusakov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F1F0EE] font-black text-xs md:text-sm tracking-normal ml-1 hover:text-[#6E56CF] transition-colors"
              >
                Eugene Gusakov
              </a>
            </div>

            <MagneticButton
              as="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="order-2 flex h-12 w-12 items-center justify-center rounded-full sr-glass-pill text-[#8B8A85] hover:text-[#F1F0EE] group md:order-3"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </MagneticButton>

          </div>
        </footer>
      </div>
    </>
  )
}
