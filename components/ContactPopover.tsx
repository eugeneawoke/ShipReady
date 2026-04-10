'use client'

import { useState } from 'react'

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

const CONTACTS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/eugene-gusakov/', icon: <IconLinkedIn /> },
  { label: 'Email',    href: 'mailto:egusakov74@gmail.com',                 icon: <IconMail /> },
  { label: 'Telegram', href: 'https://t.me/eugenegusakov',                  icon: <IconTelegram /> },
]

export function ContactPopover({ label = 'Contact', className = '' }: { label?: string; className?: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`relative overflow-hidden cursor-pointer select-none ${className}`}
      style={{ minWidth: '90px' }}
    >
      {/* Label — fades out on hover */}
      <span
        className="flex items-center justify-center transition-all duration-200 pointer-events-none"
        style={{
          opacity: hovered ? 0 : 1,
          transform: hovered ? 'scale(0.8)' : 'scale(1)',
          position: hovered ? 'absolute' : 'relative',
          inset: 0,
        }}
      >
        {label}
      </span>

      {/* Icons row — fades in on hover, absolute when hidden so it takes no space */}
      <span
        className="flex items-center justify-center gap-3 transition-all duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scale(1)' : 'scale(0.8)',
          position: hovered ? 'relative' : 'absolute',
          inset: 0,
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
        {CONTACTS.map((c) => (
          <a
            key={c.href}
            href={c.href}
            target={c.href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={c.label}
            className="text-[#8B8A85] hover:text-[#F1F0EE] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {c.icon}
          </a>
        ))}
      </span>
    </div>
  )
}
