import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SiteHeader } from '@/components/SiteHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')

  return {
    title: t('notFoundTitle'),
  }
}

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <>
      <style>{`
        .sr-404-giant {
          font-size: 26vw;
          line-height: 0.75;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255,255,255,0.05);
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          -webkit-background-clip: text;
          background-clip: text;
          user-select: none;
          pointer-events: none;
        }
        .sr-404-aurora {
          background: radial-gradient(circle at 50% 50%, rgba(110,86,207,0.15) 0%, transparent 70%);
          animation: sr-breathe 8s ease-in-out infinite alternate;
        }
        @keyframes sr-breathe {
          from { transform: scale(1); opacity: 0.7; }
          to   { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      <div className="relative min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex flex-col items-center justify-center overflow-hidden">

        {/* Aurora */}
        <div className="sr-404-aurora absolute inset-0 pointer-events-none" />

        {/* Grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
          }}
        />

        {/* Giant bg text */}
        <div className="sr-404-giant absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap">
          404
        </div>

        <div className="absolute top-0 inset-x-0">
          <SiteHeader />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 gap-6">
          <div
            className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E56CF]"
          >
            {t('eyebrow')}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            {t('title')}
          </h1>

          <p className="text-[#8B8A85] max-w-sm text-sm leading-relaxed">
            {t('body')}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <Link
              href="/"
              className="px-6 py-3 rounded-full bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors"
            >
              {t('home')}
            </Link>
            <a
              href="https://t.me/eugenegusakov"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#8B8A85] text-sm font-medium hover:text-[#F1F0EE] hover:bg-white/[0.10] transition-colors"
            >
              {t('contact')}
            </a>
          </div>
        </div>

      </div>
    </>
  )
}
