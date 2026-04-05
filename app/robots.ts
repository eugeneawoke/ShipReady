import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app'
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
