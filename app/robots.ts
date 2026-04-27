import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
