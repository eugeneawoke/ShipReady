import Link from 'next/link'
import { redirect } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin/audits',  label: 'Audits'  },
  { href: '/admin/blog',    label: 'Blog'    },
  { href: '/admin/growth',  label: 'Growth'  },
  { href: '/admin/qa',      label: 'QA'      },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.ADMIN_SECRET) redirect('/')

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0E0E0F]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <Link href="/" className="text-xs font-mono text-[#5a5a52] hover:text-[#F1F0EE] transition-colors">
            ← ShipReady
          </Link>
          <span className="text-[#2a2a28]">|</span>
          <span className="text-xs font-mono text-[#c8f03a] tracking-widest uppercase">Admin</span>
          <nav className="flex items-center gap-1 ml-2">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-1.5 text-xs font-mono text-[#9a9a8e] hover:bg-white/[0.06] hover:text-[#F1F0EE] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
