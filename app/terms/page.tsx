import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { SiteMicroFooter } from '@/components/SiteMicroFooter'
import { SiteHeader } from '@/components/SiteHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')

  return {
    title: t('termsTitle'),
    description: t('termsDescription'),
  }
}

const UPDATED = 'June 12, 2026'
const EMAIL = 'support@glook.dev'

export default async function TermsPage() {
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
        <h1 className="text-3xl font-medium mb-2">{isRu ? 'Условия использования' : 'Terms of Service'}</h1>
        <p className="text-[#8B8A85] mb-12 text-sm">{isRu ? `Дата вступления в силу: ${UPDATED}` : `Effective date: ${UPDATED}`}</p>

        <div className="space-y-10 text-[#8B8A85] text-sm leading-relaxed">
          <Section title={isRu ? '1. Принятие условий' : '1. Acceptance'}>
            {isRu
              ? 'Получая доступ к Glook или используя сервис, вы соглашаетесь с этими условиями. Если вы не согласны, не используйте сервис. Glook управляется Eugene Gusakov.'
              : 'By accessing or using Glook ("the Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service. Glook is operated by Eugene Gusakov.'}
          </Section>

          <Section title={isRu ? '2. Описание сервиса' : '2. Description of service'}>
            {isRu
              ? 'Glook — это автоматизированный инструмент аудита сайтов для веб-агентств и разработчиков. Он сканирует публично доступные URL и формирует отчёты по производительности, SEO, безопасности и мобильной готовности. В отчёты также входят AI-промпты для Cursor, Claude Code и Windsurf. В рамках аудита Glook читает публично доступные конфигурационные файлы сайта (robots.txt, sitemap.xml, llms.txt) и проверяет, разрешён ли доступ AI-краулерам (GPTBot, ClaudeBot, PerplexityBot и другим) — чтобы сообщить владельцу сайта о возможных ограничениях видимости в AI-поисковиках. Glook не имитирует и не запускает ни один из этих краулеров.'
              : 'Glook is an automated site audit tool for web agencies and developers. It scans publicly accessible URLs and generates reports covering performance, SEO, security, and mobile readiness. Reports include AI-generated fix prompts for use with Cursor, Claude Code, and Windsurf. As part of the audit, Glook reads publicly accessible configuration files (robots.txt, sitemap.xml, llms.txt) and checks whether AI crawlers (GPTBot, ClaudeBot, PerplexityBot, and others) are permitted access — to inform site owners of potential AI search visibility issues. Glook does not impersonate or operate any of these crawlers.'}
          </Section>

          <Section title={isRu ? '3. Допустимое использование' : '3. Acceptable use'}>
            {isRu ? <p>Вы соглашаетесь не:</p> : <p>You agree not to:</p>}
            <ul>
              <li>{isRu ? 'Сканировать URL, которыми вы не владеете и на аудит которых у вас нет явного разрешения.' : 'Scan URLs you do not own or have explicit permission to audit.'}</li>
              <li>{isRu ? 'Использовать сервис для атак, probe-активности или эксплуатации сторонних систем.' : 'Use the Service to attack, probe, or exploit third-party systems.'}</li>
              <li>{isRu ? 'Пытаться reverse-engineer, scrape или перегружать сервис.' : 'Attempt to reverse-engineer, scrape, or overload the Service.'}</li>
              <li>{isRu ? 'Перепродавать или перераспределять отчёты без действующего тарифа Agency.' : 'Resell or redistribute reports without a valid Agency plan.'}</li>
              <li>{isRu ? 'Использовать сервис в незаконных целях.' : 'Use the Service for any illegal purpose.'}</li>
            </ul>
            {isRu ? 'Мы оставляем за собой право блокировать аккаунты, нарушающие эти правила, без предварительного уведомления.' : 'We reserve the right to suspend accounts that violate these rules without prior notice.'}
          </Section>

          <Section title={isRu ? '4. Ограничения бесплатного тарифа' : '4. Free plan limits'}>
            {isRu
              ? 'Бесплатный тариф ограничен 3 сканами в календарный месяц на один аккаунт. Анонимное использование также ограничивается 3 сканами в календарный месяц на один IP/device context. Обход этих лимитов, например через создание нескольких аккаунтов или уклонение от технических ограничений, запрещён.'
              : 'The free plan is limited to 3 scans per calendar month per account. Anonymous use is also subject to a 3 scans per calendar month limit per IP/device context. Circumventing these limits (for example by creating multiple accounts or evading technical controls) is not permitted.'}
          </Section>

          <Section title={isRu ? '4a. Доступ к отчётам' : '4a. Report access'}>
            {isRu
              ? 'Анонимные ссылки на отчёты следует считать шаримыми: любой, у кого есть URL, потенциально может увидеть такой отчёт. Отчёты, созданные из авторизованного аккаунта, считаются приватными для владельца, пока Glook явно не добавит механизм шаринга.'
              : 'Anonymous report URLs should be treated as shareable links: anyone with the URL may be able to view that anonymous report. Reports created from a signed-in account are intended to be private to that account unless Glook explicitly provides a sharing mechanism.'}
          </Section>

          <Section title={isRu ? '5. Платные тарифы и биллинг' : '5. Paid plans & billing'}>
            <ul>
              <li>
                {isRu
                  ? <>
                      <strong className="text-[#F1F0EE]">Pro подписка:</strong> Доступны два варианта:
                      <ul className="ml-4 mt-2 space-y-1">
                        <li>Pro Месячно: $14 в месяц (автоматическое возобновление каждый месяц)</li>
                        <li>Pro Годово: $140 в год (автоматическое возобновление каждый год)</li>
                      </ul>
                    </>
                  : <>
                      <strong className="text-[#F1F0EE]">Pro subscription:</strong> Two options are available:
                      <ul className="ml-4 mt-2 space-y-1">
                        <li>Pro Monthly: $14/month (auto-renews monthly)</li>
                        <li>Pro Yearly: $140/year (auto-renews annually)</li>
                      </ul>
                    </>
                }
              </li>
              <li>{isRu ? 'Отмена подписки. Вы можете отменить подписку в любой момент. Отмена вступает в силу в конце текущего платёжного периода. Возврат за частично использованные периоды по умолчанию не предоставляется.' : 'Cancellation. You may cancel at any time. Cancellation takes effect at the end of the current billing period. Refunds for partial periods are not provided by default.'}</li>
              <li>{isRu ? 'Возвраты и спорные платежи обрабатываются в соответствии с политиками платёжного провайдера PayPro Global.' : 'Refunds and chargebacks are handled according to PayPro Global payment provider policies.'}</li>
              <li>{isRu ? 'Agency план: доступен по индивидуальному соглашению. Функциональность и цены обсуждаются при запросе. За подробностями обратитесь к support@glook.dev.' : 'Agency plan: available by manual arrangement. Features and pricing are discussed on request. Contact support@glook.dev for details.'}</li>
              <li>{isRu ? 'Beta Pro доступ: временный промо-доступ, предоставляемый во время beta-тестирования. Beta Pro grants не являются платными подписками, не связаны с биллингом и могут истечь или быть отменены в любой момент без уведомления.' : 'Beta Pro access: temporary promotional access granted during beta testing. Beta Pro grants are not paid subscriptions, are separate from billing, and may expire or be revoked at any time without notice.'}</li>
              <li>{isRu ? 'Цены могут меняться с уведомлением за 30 дней на email вашего аккаунта.' : 'Prices may change with 30 days advance notice to your account email.'}</li>
            </ul>
          </Section>

          <Section title={isRu ? '6. AI-контент' : '6. AI-generated content'}>
            {isRu
              ? 'Промпты для исправлений генерируются OpenAI и предоставляются "как есть". Это стартовые точки, а не гарантированные решения. Всегда проверяйте AI-сгенерированный код перед деплоем. Glook не несёт ответственности за проблемы, возникшие после применения AI-рекомендаций.'
              : 'Fix prompts are generated by OpenAI and are provided as-is. They are starting points, not guaranteed solutions. Always review AI-generated code before deploying. Glook is not responsible for any issues arising from applying AI suggestions.'}
          </Section>

          <Section title={isRu ? '7. Отказ от гарантий' : '7. Disclaimer of warranties'}>
            {isRu
              ? <>Сервис предоставляется <strong className="text-[#F1F0EE]">&quot;как есть&quot;</strong>, без каких-либо гарантий. Мы не гарантируем полноту или абсолютную точность аудита, а также то, что применение исправлений решит все проблемы. Оценки считаются эвристически и могут отличаться от других инструментов.</>
              : <>The Service is provided <strong className="text-[#F1F0EE]">&quot;as is&quot;</strong> without warranties of any kind. We do not guarantee that audit results are complete, accurate, or that applying fixes will resolve all issues. Scores are computed heuristically and may differ from other tools.</>}
          </Section>

          <Section title={isRu ? '8. Ограничение ответственности' : '8. Limitation of liability'}>
            {isRu
              ? 'В максимальной степени, разрешённой законом, Glook и Eugene Gusakov не несут ответственности за любые косвенные, случайные, последующие или штрафные убытки, связанные с использованием сервиса, включая потерю данных, выручки или инциденты безопасности. Наша суммарная ответственность не превышает сумму, которую вы заплатили нам за 3 месяца до возникновения претензии.'
              : 'To the maximum extent permitted by law, Glook and Eugene Gusakov shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service, including but not limited to data loss, lost revenue, or security incidents. Our total liability shall not exceed the amount you paid us in the 3 months prior to the claim.'}
          </Section>

          <Section title={isRu ? '9. Интеллектуальная собственность' : '9. Intellectual property'}>
            {isRu
              ? 'Glook, его бренд и UI принадлежат Eugene Gusakov. Данные отчётов, сформированные на основе ваших URL, принадлежат вам. AI-промпты предоставляются в рамках правил использования выбранного AI-провайдера.'
              : 'Glook, its branding, and UI are the intellectual property of Eugene Gusakov. Report data generated from your URLs belongs to you. AI-generated prompts are provided under the selected AI provider\'s usage policies.'}
          </Section>

          <Section title={isRu ? '10. Прекращение доступа' : '10. Termination'}>
            {isRu
              ? 'Мы можем прекратить или ограничить ваш доступ в любое время при нарушении этих условий. Вы можете удалить аккаунт в любой момент, связавшись с нами. После прекращения доступа ваши данные будут удалены в течение 30 дней.'
              : 'We may terminate or suspend your access at any time for violations of these Terms. You may delete your account at any time by contacting us. On termination, your data will be deleted within 30 days.'}
          </Section>

          <Section title={isRu ? '11. Изменения условий' : '11. Changes to terms'}>
            {isRu
              ? 'Мы можем обновлять эти условия. Если у вас есть аккаунт, мы уведомим вас по email минимум за 14 дней до вступления существенных изменений в силу. Продолжение использования сервиса после этой даты означает принятие обновлённых условий.'
              : 'We may update these Terms. We will notify you by email (if you have an account) at least 14 days before material changes take effect. Continued use after that date constitutes acceptance.'}
          </Section>

          <Section title={isRu ? '12. Применимое право' : '12. Governing law'}>
            {isRu
              ? 'Эти условия регулируются законодательством Республики Беларусь без учёта коллизионных норм. Споры сначала решаются через добросовестные переговоры, а затем — в судах города Минска, Беларусь.'
              : 'These Terms are governed by the laws of the Republic of Belarus, without regard to conflict of law principles. Disputes shall be resolved through good-faith negotiation first, then by the courts of Minsk, Belarus.'}
          </Section>

          <Section title={isRu ? '13. Контакты' : '13. Contact'}>
            {isRu ? <>Есть вопросы по этим условиям? Напишите на <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.</> : <>Questions about these Terms? Email <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.</>}
          </Section>
        </div>
      </main>

      <SiteMicroFooter currentPage="terms" />
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
