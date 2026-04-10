import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

interface SiteMicroFooterProps {
  currentPage?: 'privacy' | 'terms'
}

export async function SiteMicroFooter({ currentPage }: SiteMicroFooterProps) {
  const t = await getTranslations('SiteMicroFooter')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/[0.06] px-6 py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 text-center text-xs text-[#5A5955] md:flex-row md:text-left">
        <p>
          {t('contact')}:{' '}
          <a
            href="mailto:hi@shipready.app"
            className="transition-colors hover:text-[#8B8A85]"
          >
            hi@shipready.app
          </a>
          {' · '}{t('craftedWithLoveBy')}{' '}
          <a
            href="https://www.linkedin.com/in/eugene-gusakov/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#8B8A85]"
          >
            Eugene Gusakov
          </a>
        </p>

        <p>
          © {year} ShipReady. {t('allRightsReserved')}
          {currentPage !== 'privacy' && (
            <>
              {' · '}
              <Link href="/privacy" className="transition-colors hover:text-[#8B8A85]">
                {t('privacy')}
              </Link>
            </>
          )}
          {currentPage !== 'terms' && (
            <>
              {' · '}
              <Link href="/terms" className="transition-colors hover:text-[#8B8A85]">
                {t('terms')}
              </Link>
            </>
          )}
        </p>
      </div>
    </footer>
  )
}
