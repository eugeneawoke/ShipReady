import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, hasSupabaseConfig } from '@/lib/supabase'
import { SiteHeader } from '@/components/SiteHeader'

interface ContentPageHeaderProps {
  /** Highlight the active nav link */
  activePath?: '/pricing' | '/roadmap' | '/blog'
}

export async function ContentPageHeader({ activePath }: ContentPageHeaderProps) {
  const tnav = await getTranslations('Landing.nav')

  // Auth check — same pattern as pricing page
  let user = null
  if (hasSupabaseConfig()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      // not configured locally
    }
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`hover:text-[#F1F0EE] transition-colors ${
        activePath === href ? 'text-[#F1F0EE] font-medium' : ''
      }`}
    >
      {label}
    </Link>
  )

  return (
    <SiteHeader
      sticky
      mobileNavItems={[
        { label: tnav('pricing'), href: '/pricing' },
        { label: tnav('roadmap'), href: '/roadmap' },
        { label: 'Blog', href: '/blog' },
      ]}
      mobileActions={
        user ? (
          <Link
            href="/dashboard"
            className="flex min-h-11 items-center justify-center rounded-lg bg-[#6E56CF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7C68D4]"
          >
            {tnav('dashboard')}
          </Link>
        ) : (
          <>
            <Link
              href="/auth/login?mode=signup"
              className="flex min-h-11 items-center justify-center rounded-lg bg-[#6E56CF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7C68D4]"
            >
              {tnav('getStarted')}
            </Link>
            <Link
              href="/auth/login"
              className="flex min-h-11 items-center justify-center rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-[#F1F0EE] transition-colors hover:bg-white/[0.04]"
            >
              {tnav('signIn')}
            </Link>
          </>
        )
      }
      right={
        user ? (
          <Link
            href="/dashboard"
            className="hidden text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium md:inline-flex"
          >
            {tnav('dashboard')}
          </Link>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/auth/login"
              className="text-sm px-4 py-1.5 rounded-lg border border-white/[0.08] text-[#F1F0EE] hover:bg-[#161618] transition-colors"
            >
              {tnav('signIn')}
            </Link>
            <Link
              href="/auth/login?mode=signup"
              className="text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
            >
              {tnav('getStarted')}
            </Link>
          </div>
        )
      }
    >
      <nav className="hidden md:flex items-center gap-5 text-sm text-[#8B8A85]">
        {navLink('/pricing', tnav('pricing'))}
        {navLink('/roadmap', tnav('roadmap'))}
        {navLink('/blog', 'Blog')}
      </nav>
    </SiteHeader>
  )
}
