'use client'

import { useEffect } from 'react'

const SUPPORTED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'promo']

export function AttributionTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasAttribution = SUPPORTED_PARAMS.some((param) => params.has(param))
    if (!hasAttribution) return

    const storageKey = `sr_visit:${window.location.href}`
    try {
      if (sessionStorage.getItem(storageKey)) return
      sessionStorage.setItem(storageKey, '1')
    } catch {}

    const attribution = Object.fromEntries(
      SUPPORTED_PARAMS
        .map((param) => [param, params.get(param)] as const)
        .filter(([, value]) => typeof value === 'string' && value.length > 0),
    )

    fetch('/api/growth/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        landingPath: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || null,
        attribution,
      }),
    }).catch(() => {})
  }, [])

  return null
}
