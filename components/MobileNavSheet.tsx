'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface MobileNavSheetProps {
  open: boolean
  onClose: () => void
  labels: {
    howItWorks: string
    seeReport: string
    whatWeCheck: string
    faq: string
    pricing: string
    methodology: string
  }
  onScrollTo: (selector: string) => void
}

interface ScrollItem {
  label: string
  selector: string
}

export default function MobileNavSheet({
  open,
  onClose,
  labels,
  onScrollTo,
}: MobileNavSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyOverscroll = document.body.style.overscrollBehavior

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'contain'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.overscrollBehavior = previousBodyOverscroll
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(
          sheetRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) ?? []
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const scrollItems: ScrollItem[] = [
    { label: labels.howItWorks, selector: '#how-it-works' },
    { label: labels.seeReport, selector: '#preview' },
    { label: labels.whatWeCheck, selector: '#features' },
    { label: labels.faq, selector: '#faq' },
    { label: labels.pricing, selector: '#pricing' },
  ]

  function handleScrollTo(selector: string) {
    onClose()
    requestAnimationFrame(() => onScrollTo(selector))
  }

  const sheet = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-x-0 top-0 z-50 box-border max-h-[calc(100vh-4rem)] overflow-y-auto rounded-b-2xl border-b border-white/[0.08] bg-[#161618] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
              paddingBottom: '1rem',
            }}
          >
            {/* Handle bar */}
            <div className="mx-auto mb-1 h-1 w-12 rounded-full bg-white/20" />

            {/* Nav items */}
            <nav>
              {scrollItems.map((item, index) => (
                <button
                  key={item.selector}
                  onClick={() => handleScrollTo(item.selector)}
                  className={`min-h-12 w-full px-6 py-4 text-left text-base text-[#F1F0EE] transition-colors hover:bg-white/[0.04] ${
                    index < scrollItems.length - 1
                      ? 'border-b border-white/[0.05]'
                      : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Methodology — real page link */}
              <Link
                href="/methodology"
                onClick={onClose}
                className="block min-h-12 px-6 py-4 text-base text-[#F1F0EE] transition-colors hover:bg-white/[0.04]"
              >
                {labels.methodology}
              </Link>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(sheet, document.body) : null
}
