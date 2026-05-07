'use client'

interface ScrollAnchorButtonProps {
  targetId: string
  children: React.ReactNode
  className?: string
}

export function ScrollAnchorButton({ targetId, children, className }: ScrollAnchorButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    const el = document.getElementById(targetId)
    if (!el) return
    const NAV_H = 96
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_H
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
