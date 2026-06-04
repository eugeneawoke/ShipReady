'use client'

import { Analytics } from '@vercel/analytics/next'

const CONSENT_COOKIE = 'glook-consent'

export function AnalyticsGate() {
  return (
    <Analytics
      beforeSend={(event) => {
        if (typeof document === 'undefined') return event
        const hasConsent = document.cookie
          .split(';')
          .some((c) => c.trim() === `${CONSENT_COOKIE}=accepted`)
        return hasConsent ? event : null
      }}
    />
  )
}
