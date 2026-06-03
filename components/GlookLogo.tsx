'use client'

interface GlookLogoProps {
  size?: number   // font-size in px, circles scale proportionally
  className?: string
}

/**
 * Glook integrated wordmark.
 * The "oo" in "glook" are rendered as OO-Lens SVG circles (green rings with dots).
 * Uses Space Grotesk Bold to match the app's heading font.
 */
export function GlookLogo({ size = 22, className = '' }: GlookLogoProps) {
  const circleSize = size * 0.72        // diameter ≈ x-height of Space Grotesk Bold
  const circleRadius = circleSize / 2
  const innerRadius = circleRadius * 0.33
  const strokeWidth = circleRadius * 0.17
  const gap = circleSize * 0.09         // gap between two circles
  const margin = circleRadius * 0.20    // symmetric margin on both sides of oo

  // Scale factors for the fixed 32x32 viewBox
  const vbStrokeWidth = strokeWidth * (32 / circleSize)
  const vbInnerRadius = innerRadius * (32 / circleSize)
  const vbOuterRadius = 16 - vbStrokeWidth / 2

  const circle = (
    <svg
      width={circleSize}
      height={circleSize}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r={vbOuterRadius} stroke="#22C55E" strokeWidth={vbStrokeWidth} />
      <circle cx="16" cy="16" r={vbInnerRadius} fill="#22C55E" />
    </svg>
  )

  return (
    <span
      className={`inline-flex items-center leading-none select-none ${className}`.trim()}
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.04em',
        color: 'inherit',
      }}
      aria-label="Glook"
      role="img"
    >
      <span style={{ letterSpacing: '-0.04em' }}>gl</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: `${gap}px`,
          margin: `0 ${margin}px`,
          lineHeight: 0,
        }}
      >
        {circle}
        {circle}
      </span>
      <span style={{ letterSpacing: '-0.04em' }}>k</span>
    </span>
  )
}
