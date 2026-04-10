export const locales = ['en', 'ru'] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = 'en'
export const localeCookieName = 'shipready-locale'

export function normalizeLocale(value: string | null | undefined): AppLocale | undefined {
  if (!value) return undefined

  const normalized = value.toLowerCase()
  if (normalized.startsWith('ru')) return 'ru'
  if (normalized.startsWith('en')) return 'en'

  return undefined
}

export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): AppLocale {
  if (!header) return defaultLocale

  const [firstLanguage = ''] = header.split(',')
  return firstLanguage.trim().toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

export function resolveLocale(options?: {
  cookieLocale?: string | null
  acceptLanguage?: string | null
}) {
  const cookieLocale = normalizeLocale(options?.cookieLocale)
  if (cookieLocale) return cookieLocale

  return resolveLocaleFromAcceptLanguage(options?.acceptLanguage)
}
