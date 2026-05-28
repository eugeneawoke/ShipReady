import Link from 'next/link'
import { SiteBrandLink } from '@/components/SiteHeader'

export default function DomainNotFound() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex flex-col">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <SiteBrandLink />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-5xl font-bold text-[#3A3A3E]">404</p>
        <h1 className="text-xl font-semibold">Domain report not found</h1>
        <p className="text-sm text-[#8B8A85]">This domain hasn&apos;t been published yet, or the URL is incorrect.</p>
        <Link
          href="/"
          className="mt-2 rounded-lg bg-[#6E56CF] px-5 py-2 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
        >
          Audit your site →
        </Link>
      </main>
    </div>
  )
}
