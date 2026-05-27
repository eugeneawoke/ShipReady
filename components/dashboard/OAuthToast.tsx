'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google (GSC + GA4)',
  yandex: 'Яндекс',
  bing: 'Bing',
}

const ERROR_LABELS: Record<string, string> = {
  google_denied: 'Google connection was cancelled.',
  yandex_denied: 'Yandex connection was cancelled.',
  bing_denied: 'Bing connection was cancelled.',
  google_token_exchange: 'Google token exchange failed. Try again.',
  yandex_token_exchange: 'Yandex token exchange failed. Try again.',
  bing_token_exchange: 'Bing token exchange failed. Try again.',
}

export function OAuthToast() {
  const params = useSearchParams()
  const router = useRouter()
  const connected = params.get('connected')
  const error = params.get('error')

  useEffect(() => {
    if (!connected && !error) return
    if (connected) {
      const label = PROVIDER_LABELS[connected] ?? connected
      console.log(`✅ ${label} connected successfully`)
    }
    if (error) {
      const msg = ERROR_LABELS[error] ?? `OAuth error: ${error}`
      console.warn(`⚠️ ${msg}`)
    }
    // Clean URL params
    const url = new URL(window.location.href)
    url.searchParams.delete('connected')
    url.searchParams.delete('error')
    router.replace(url.pathname + (url.search || ''))
  }, [connected, error, router])

  return null
}
