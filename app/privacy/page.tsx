import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { SiteMicroFooter } from '@/components/SiteMicroFooter'
import { SiteHeader } from '@/components/SiteHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')

  return {
    title: t('privacyTitle'),
    description: t('privacyDescription'),
  }
}

const UPDATED = 'May 11, 2026'
const EMAIL = 'support@glook.dev'

export default async function PrivacyPage() {
  const locale = await getLocale()
  const isRu = locale === 'ru'

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader
        sticky
        right={<span className="text-xs text-[#5A5955]">{isRu ? `Обновлено: ${UPDATED}` : `Last updated: ${UPDATED}`}</span>}
      />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#8B8A85] transition-colors hover:text-[#F1F0EE]">
            <ArrowLeft className="h-4 w-4" />
            <span>{isRu ? 'Назад' : 'Back'}</span>
          </Link>
        </div>
        <h1 className="text-3xl font-medium mb-2">{isRu ? 'Политика конфиденциальности' : 'Privacy Policy'}</h1>
        <p className="text-[#8B8A85] mb-12 text-sm">{isRu ? `Дата вступления в силу: ${UPDATED}` : `Effective date: ${UPDATED}`}</p>

        <div className="prose-custom space-y-10 text-[#8B8A85] text-sm leading-relaxed">
          <Section title={isRu ? '1. Кто мы' : '1. Who we are'}>
            {isRu ? (
              <>
                Glook — это инструмент аудита качества веб-приложений, который создаёт и поддерживает Eugene Gusakov.
                Связаться с нами можно по адресу <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.
              </>
            ) : (
              <>
                Glook is a web quality audit tool built and operated by Eugene Gusakov.
                You can reach us at <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.
              </>
            )}
          </Section>

          <Section title={isRu ? '2. Какие данные мы собираем' : '2. What data we collect'}>
            {isRu ? <p>Мы собираем только те данные, которые действительно нужны для работы сервиса:</p> : <p>We collect only what is necessary to provide the service:</p>}
            <ul>
              <li><strong className="text-[#F1F0EE]">{isRu ? 'URL, которые вы отправляете' : 'URLs you submit'}</strong> {isRu ? '— чтобы запускать аудит. Мы не краулим и не храним содержимое ваших страниц сверх того, что необходимо для генерации отчёта.' : '— to run the audit. We do not crawl or store the content of your pages beyond what is needed to generate the report.'}</li>
              <li><strong className="text-[#F1F0EE]">{isRu ? 'Данные аккаунта' : 'Account data'}</strong> {isRu ? '— если вы регистрируетесь: ваш email, который обрабатывается через Supabase Auth (magic link и OAuth).' : '— if you sign up: your email address, provided via Supabase Auth (supports magic link and OAuth).'}</li>
              <li><strong className="text-[#F1F0EE]">{isRu ? 'Платёжные данные' : 'Payment data'}</strong> {isRu ? '— обрабатываются PayPro Global (Merchant of Record). Мы не видим и не храним данные вашей карты.' : '— processed by PayPro Global (Merchant of Record). We never see or store your card details.'}</li>
              <li><strong className="text-[#F1F0EE]">{isRu ? 'Данные использования' : 'Usage data'}</strong> {isRu ? '— история сканов, связанная с аккаунтом: URL, оценки и время запуска.' : '— scan history linked to your account (URL, scores, timestamp).'}</li>
              <li><strong className="text-[#F1F0EE]">{isRu ? 'Технические данные' : 'Technical data'}</strong> {isRu ? '— стандартные серверные логи: IP-адрес, браузер, временные метки. Они хранятся до 30 дней.' : '— standard server logs (IP address, browser, timestamps) retained for up to 30 days.'}</li>
            </ul>
          </Section>

          <Section title={isRu ? '3. Как мы используем ваши данные' : '3. How we use your data'}>
            <ul>
              <li>{isRu ? 'Чтобы запускать сканы и формировать отчёты для вас.' : 'To run scans and generate reports for you.'}</li>
              <li>{isRu ? 'Чтобы управлять вашим аккаунтом и подпиской.' : 'To manage your account and subscription.'}</li>
              <li>{isRu ? 'Чтобы отправлять транзакционные письма: завершение скана, квитанции об оплате. Маркетинговые письма без вашего согласия не отправляются.' : 'To send transactional emails (scan complete, billing receipts). We do not send marketing emails without your consent.'}</li>
              <li>{isRu ? 'Чтобы выявлять злоупотребления и защищать сервис.' : 'To detect abuse and protect the service.'}</li>
            </ul>
            {isRu ? 'Мы не продаём ваши данные и не используем их для рекламы.' : 'We do not sell your data. We do not use it for advertising.'}
          </Section>

          <Section title={isRu ? '4. Сторонние сервисы' : '4. Third-party services'}>
            <ul>
              <li><strong className="text-[#F1F0EE]">Supabase</strong> {isRu ? '— база данных и аутентификация (EU region).' : '— database and authentication (EU region).'} <a href="https://supabase.com/privacy" className="text-[#6E56CF] hover:underline" target="_blank" rel="noopener noreferrer">{isRu ? 'Политика конфиденциальности' : 'Privacy policy'}</a>.</li>
              <li><strong className="text-[#F1F0EE]">PayPro Global</strong> {isRu ? '— обработка платежей и выставление счетов (Merchant of Record).' : '— payment processing and billing (Merchant of Record).'} <a href="https://payproglobal.com/privacy-policy" className="text-[#6E56CF] hover:underline" target="_blank" rel="noopener noreferrer">{isRu ? 'Политика конфиденциальности' : 'Privacy policy'}</a>.</li>
              <li><strong className="text-[#F1F0EE]">Vercel</strong> {isRu ? '— хостинг и edge functions.' : '— hosting and edge functions.'} <a href="https://vercel.com/legal/privacy-policy" className="text-[#6E56CF] hover:underline" target="_blank" rel="noopener noreferrer">{isRu ? 'Политика конфиденциальности' : 'Privacy policy'}</a>.</li>
              <li><strong className="text-[#F1F0EE]">OpenAI</strong> {isRu ? '— AI-enrichment отчётов и промпты для исправлений. URL и данные по issue могут отправляться для генерации промптов.' : '— AI-generated report enrichment and fix prompts. URLs and issue data are sent to generate prompts.'} <a href="https://openai.com/policies/privacy-policy/" className="text-[#6E56CF] hover:underline" target="_blank" rel="noopener noreferrer">{isRu ? 'Политика конфиденциальности' : 'Privacy policy'}</a>.</li>
            </ul>
          </Section>

          <Section title={isRu ? '4a. Платежи и PayPro Global' : '4a. Payment processing and PayPro Global'}>
            {isRu ? (
              <>
                <p>PayPro Global действует как Merchant of Record и обрабатывает все платёжные данные и биллинговую информацию от вашего имени. Мы не храним номера карт, данные платёжных реквизитов или иные конфиденциальные платёжные информацию — всё это обрабатывается исключительно PayPro Global в соответствии с их политикой конфиденциальности.</p>
                <p>Мы получаем webhook&apos;и от PayPro Global с информацией о статусе подписки (оплачена, просрочена, отменена). Эта информация используется исключительно для предоставления или отзыва доступа к вашему аккаунту и платёжным функциям сервиса.</p>
              </>
            ) : (
              <>
                <p>PayPro Global acts as Merchant of Record and processes all payment and customer billing data on Glook&apos;s behalf. We do not store card numbers, payment credentials, or sensitive payment information — all payment processing is handled exclusively by PayPro Global in accordance with their privacy policy.</p>
                <p>We receive webhooks from PayPro Global containing subscription status events (paid, overdue, cancelled). This information is used solely to grant or revoke access to your account and platform features.</p>
              </>
            )}
          </Section>

          <Section title={isRu ? '5. Cookies' : '5. Cookies'}>
            {isRu
              ? 'Мы используем только обязательные cookies для управления сессией, аутентификации и выбора языка интерфейса. Трекинговые и рекламные cookies не используются.'
              : 'We use only essential cookies required for session management, authentication, and interface language selection. We do not use tracking or advertising cookies.'}
          </Section>

          <Section title={isRu ? '6. Срок хранения данных' : '6. Data retention'}>
            <ul>
              <li>{isRu ? 'Результаты сканов хранятся, пока ваш аккаунт активен.' : 'Scan results are retained as long as your account is active.'}</li>
              <li>{isRu ? 'Анонимные сканы (без аккаунта) могут быть удалены через 30 дней.' : 'Anonymous scans (no account) may be deleted after 30 days.'}</li>
              <li>{isRu ? 'Вы можете запросить удаление своих данных в любой момент, написав нам на email.' : 'You can request deletion of your data at any time by emailing us.'}</li>
            </ul>
          </Section>

          <Section title={isRu ? '6a. Видимость отчётов' : '6a. Report visibility'}>
            {isRu
              ? 'Анонимные отчёты доступны каждому, у кого есть ссылка на отчёт. Отчёты, связанные с авторизованным аккаунтом, остаются приватными для владельца, пока мы явно не добавим механизм шаринга. Если вы не хотите, чтобы отчёт открывался по URL, запускайте скан из авторизованного аккаунта.'
              : 'Anonymous reports are accessible to anyone who has the report URL. Reports linked to a signed-in account are private to that account unless we add an explicit sharing feature in the future. If you do not want a report to be accessible by URL, run the scan from a signed-in account.'}
          </Section>

          <Section title={isRu ? '7. Ваши права (GDPR)' : '7. Your rights (GDPR)'}>
            {isRu ? 'Если вы находитесь в Европейской экономической зоне, у вас есть право:' : 'If you are in the European Economic Area, you have the right to:'}
            <ul>
              <li>{isRu ? 'Получить доступ к персональным данным, которые мы храним.' : 'Access the personal data we hold about you.'}</li>
              <li>{isRu ? 'Исправить неточные данные.' : 'Correct inaccurate data.'}</li>
              <li>{isRu ? 'Запросить удаление данных ("право быть забытым").' : 'Request deletion of your data ("right to be forgotten").'}</li>
              <li>{isRu ? 'Возразить против обработки или ограничить её.' : 'Object to or restrict processing.'}</li>
              <li>{isRu ? 'Запросить переносимость данных.' : 'Data portability.'}</li>
            </ul>
            {isRu ? <>Чтобы воспользоваться этими правами, напишите на <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.</> : <>To exercise any of these rights, email <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.</>}
          </Section>

          <Section title={isRu ? '8. Безопасность' : '8. Security'}>
            {isRu
              ? 'Все данные передаются по HTTPS. Доступ к базе данных защищён row-level security (Supabase RLS). Пароли мы не храним: аутентификация работает через magic links и OAuth.'
              : 'All data is transmitted over HTTPS. Database access is protected by row-level security (Supabase RLS). We do not store passwords — authentication is handled via magic links and OAuth.'}
          </Section>

          <Section title={isRu ? '9. Изменения в политике' : '9. Changes to this policy'}>
            {isRu
              ? 'Мы можем обновлять эту политику. Об изменениях мы сообщаем публикацией новой версии на этой странице и обновлением даты вступления в силу. Существенные изменения будем дополнительно отправлять на email, если у вас есть аккаунт.'
              : 'We may update this policy. We will notify you by posting the new policy on this page and updating the effective date. Material changes will be communicated by email if you have an account.'}
          </Section>

          <Section title={isRu ? '10. Контакты' : '10. Contact'}>
            {isRu ? <>Есть вопросы по этой политике? Напишите нам на <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.</> : <>Questions about this policy? Email us at <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.</>}
          </Section>
        </div>
      </main>

      <SiteMicroFooter currentPage="privacy" />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-medium text-[#F1F0EE] mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
