'use client'

import { useState } from 'react'
import MobileNavSheet from './MobileNavSheet'

interface RoadmapMobileMenuProps {
  labels: {
    howItWorks: string
    seeReport: string
    whatWeCheck: string
    faq: string
    pricing: string
    methodology: string
  }
}

export function RoadmapMobileMenu({ labels }: RoadmapMobileMenuProps) {
  const [open, setOpen] = useState(false)

  // On roadmap we navigate to the landing section instead of smooth-scrolling
  function handleScrollTo(selector: string) {
    window.location.href = '/' + selector
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="flex items-center justify-center w-9 h-9 rounded-lg text-[#8B8A85] hover:text-[#F1F0EE] hover:bg-white/[0.06] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <MobileNavSheet
        open={open}
        onClose={() => setOpen(false)}
        labels={labels}
        onScrollTo={handleScrollTo}
      />
    </div>
  )
}
