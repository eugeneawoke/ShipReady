import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Glook — Site audits that understand your client\'s business'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '64px',
          background: '#0E0E0F',
        }}
      >
        {/* Score decorations */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          {[{ label: 'Performance', score: 94, color: '#FF8C42' },
            { label: 'Security', score: 87, color: '#FF4444' },
            { label: 'SEO', score: 91, color: '#4A9EFF' },
            { label: 'Mobile', score: 100, color: '#3DDC84' }].map(item => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
              <span style={{ color: '#8B8A85', fontSize: '14px' }}>{item.label}</span>
              <span style={{ color: item.color, fontSize: '14px', fontFamily: 'monospace', fontWeight: 600 }}>{item.score}</span>
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: '#F1F0EE', fontSize: '72px', fontWeight: 600, letterSpacing: '-2px', lineHeight: 1 }}>
            Glook
          </span>
          <span style={{ color: '#8B8A85', fontSize: '28px', fontWeight: 400 }}>
            Site audits that understand your client&apos;s business
          </span>
          <span style={{ color: '#5A5955', fontSize: '20px', marginTop: '8px' }}>
            40+ checks · fast truth pass · AI fix prompts
          </span>
        </div>

        {/* Accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#6E56CF',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
