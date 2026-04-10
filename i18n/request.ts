import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { localeCookieName, resolveLocale } from '@/lib/i18n'
import en from '@/messages/en'
import ru from '@/messages/ru'

const messages = {
  en,
  ru,
} as const

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const locale = resolveLocale({
    cookieLocale: cookieStore.get(localeCookieName)?.value,
    acceptLanguage: headerStore.get('accept-language'),
  })

  return {
    locale,
    messages: messages[locale],
  }
})
