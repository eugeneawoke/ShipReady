import { headers } from 'next/headers'

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I make my website appear in ChatGPT, Claude, and Perplexity?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI search engines need three things: access (robots.txt must allow GPTBot, ClaudeBot, and PerplexityBot), structure (FAQ schema, Organization sameAs links, and llms.txt help AI parse your content), and answer-first content (pages should answer their main question in the first paragraph). ShipReady\'s AI Visibility scan checks all of this automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I check if my website has security vulnerabilities?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most impactful security issues are misconfigured HTTP headers — missing CSP, HSTS, X-Frame-Options, and Referrer-Policy expose your site to XSS and clickjacking attacks. ShipReady runs 10+ security checks for free: paste your URL and get a report in under a minute, with exact fix prompts for each issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I audit my website\'s SEO for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A proper SEO audit checks title tags, meta descriptions, canonical URLs, Open Graph tags, robots.txt, sitemap.xml, structured data, and image alt text. ShipReady runs all of these in 30 seconds — free, no signup required for the first scan.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is AI visibility and why does it matter for my site?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI search (ChatGPT, Claude, Perplexity, Google AI Overview) now handles over 40% of information queries. AI visibility is whether AI crawlers can access your pages, whether your structured data gives them context, and whether your content is structured to be cited. ShipReady checks all of this with a dedicated AI Visibility category.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is ShipReady free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '3 scans per month are free — no credit card required. You get all category scores and issue descriptions. Upgrade to Pro ($14/mo) for unlimited scans, full AI fix prompts, PDF export, and weekly domain monitoring.',
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
