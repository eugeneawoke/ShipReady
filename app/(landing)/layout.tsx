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
        text: 'ShipReady is a pre-deploy quality gate for vibe-coded apps. Submit your URL and get a report covering performance, SEO, security, mobile readiness, and AI visibility — with fix prompts ready to paste into your AI coding tool.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the scan work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ShipReady fetches your page, runs a real Lighthouse mobile audit, checks HTTP security headers, inspects HTML metadata, and verifies structured data. Results are classified as verified, likely, or heuristic so you know exactly how confident each finding is.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is ShipReady free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the core scan is free. Pro and Agency plans add PDF export, weekly monitoring, and deeper insights.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does ShipReady work with AI coding tools like Cursor, Bolt, or Lovable?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Each issue in your report includes a ready-to-paste fix prompt for AI coding tools like Cursor, Windsurf, Bolt, Lovable, v0, and Replit.',
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
