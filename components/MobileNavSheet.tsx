'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
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
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  useEffect(() => {
    if (open) {
      const first = sheetRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
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
    onScrollTo(selector)
    onClose()
  }

  return (
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
            className="fixed bottom-0 inset-x-0 z-50 bg-[#161618] rounded-t-2xl border-t border-white/[0.08]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

            {/* Nav items */}
            <nav>
              {scrollItems.map((item, index) => (
                <button
                  key={item.selector}
                  onClick={() => handleScrollTo(item.selector)}
                  className={`w-full text-left px-6 py-4 text-base text-[#F1F0EE] ${
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
                className="block px-6 py-4 text-base text-[#F1F0EE]"
              >
                {labels.methodology}
              </Link>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
