import { headers } from 'next/headers'

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is ShipReady?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ShipReady is a site audit tool for web agencies and developers. Submit your URL and get a scan report covering performance, SEO, security, mobile readiness, and AI visibility — with fix prompts ready to paste into Cursor, Claude Code, or Windsurf.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the scan work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ShipReady fetches your page, runs a real Lighthouse mobile audit, checks HTTP security headers, inspects HTML metadata, and verifies structured data. Results are labeled as verified, likely, or heuristic so you know exactly how confident each finding is.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is ShipReady free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The core scan is free — 3 scans per month, all category scores, and issue descriptions. Upgrade to Pro for unlimited scans, full AI fix prompts, PDF export, and weekly monitoring.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does ShipReady work with Cursor, Claude Code, and Windsurf?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every issue in your report includes a ready-to-paste fix prompt tailored for Cursor, Claude Code, Windsurf, and other AI coding tools. Just copy and paste to fix.',
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate are the results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every finding is labeled by confidence level. Verified issues are measured facts. Likely issues are strong heuristics. Lighthouse performance scores are real measured data. ShipReady never marks a check as passed if the measurement could not be completed.',
      },
    },
  ],
}

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  )
}
