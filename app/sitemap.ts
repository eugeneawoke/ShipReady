import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')
  return [
    { url: `${base}/`, lastModified: new Date('2026-05-09') },
    { url: `${base}/pricing`, lastModified: new Date('2026-05-09') },
    { url: `${base}/roadmap`, lastModified: new Date('2026-05-09') },
    { url: `${base}/privacy`, lastModified: new Date('2026-05-11') },
    { url: `${base}/terms`, lastModified: new Date('2026-05-11') },
  ]
}
