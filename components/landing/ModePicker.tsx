import Link from 'next/link'

const MODES = [
  {
    href: '/seo',
    icon: '🔍',
    title: 'SEO',
    tagline: 'Get found on Google',
    description: 'Find out why you\'re invisible to search engines. Core Web Vitals, indexability, structured data.',
    color: 'from-blue-500/10 to-transparent border-blue-500/20',
  },
  {
    href: '/security',
    icon: '🛡️',
    title: 'Security',
    tagline: 'Protect your site',
    description: 'Scan headers, SSL, exposed credentials, and privacy compliance in 60 seconds.',
    color: 'from-orange-500/10 to-transparent border-orange-500/20',
  },
  {
    href: '/ai-visibility',
    icon: '🤖',
    title: 'AI Visibility',
    tagline: 'Get cited by ChatGPT & Claude',
    description: 'Check if AI crawlers can read your site. Generate llms.txt, schema.org, and FAQ markup.',
    color: 'from-violet-500/10 to-transparent border-violet-500/20',
  },
]

export function ModePicker() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <p className="mb-6 text-center text-sm text-[#8B8A85]">Or start with a focused report:</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={`group flex flex-col gap-3 rounded-2xl border bg-gradient-to-b p-5 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer ${mode.color}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{mode.icon}</span>
              <span className="font-semibold text-[#F1F0EE]">{mode.title}</span>
            </div>
            <p className="text-sm font-medium text-[#F1F0EE]/80">{mode.tagline}</p>
            <p className="text-xs leading-relaxed text-[#8B8A85]">{mode.description}</p>
            <span className="mt-auto text-xs text-[#6E56CF] group-hover:text-[#7C68D4]">
              Run {mode.title} report →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
