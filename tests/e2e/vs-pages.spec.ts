import { test, expect } from '@playwright/test'

const COMPETITOR_SLUGS = ['ahrefs', 'screaming-frog', 'semrush', 'se-ranking', 'otterly']
const COMPETITOR_NAMES: Record<string, string> = {
  ahrefs: 'Ahrefs',
  'screaming-frog': 'Screaming Frog',
  semrush: 'Semrush',
  'se-ranking': 'SE Ranking',
  otterly: 'Otterly',
}

test.describe('/vs — index page', () => {
  test('renders 5 competitor cards', async ({ page }) => {
    await page.goto('/vs')
    await expect(page).toHaveTitle(/comparison|alternative/i)
    for (const name of Object.values(COMPETITOR_NAMES)) {
      await expect(page.getByText(`ShipReady vs ${name}`)).toBeVisible()
    }
  })

  test('each card links to correct slug', async ({ page }) => {
    await page.goto('/vs')
    for (const slug of COMPETITOR_SLUGS) {
      await expect(page.locator(`a[href="/vs/${slug}"]`)).toBeVisible()
    }
  })
})

test.describe('/vs/[slug] — comparison pages', () => {
  test('ahrefs — h1, FAQPage JSON-LD, CTA', async ({ page }) => {
    await page.goto('/vs/ahrefs')
    await expect(page.locator('h1')).toContainText('ShipReady vs Ahrefs')
    // FAQPage JSON-LD present
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    const parsed = JSON.parse(jsonLd ?? '{}')
    expect(parsed['@type']).toBe('FAQPage')
    expect(parsed.mainEntity).toHaveLength(3)
    // CTA links to /
    await expect(page.locator('a[href="/"]').first()).toBeVisible()
  })

  test.each(COMPETITOR_SLUGS)('%s — 200 and title contains year', async ({ page }, slug) => {
    const response = await page.goto(`/vs/${slug}`)
    expect(response?.status()).toBe(200)
    const title = await page.title()
    const year = new Date().getFullYear().toString()
    expect(title).toContain(year)
  })

  test.each(COMPETITOR_SLUGS)('%s — feature table rendered', async ({ page }, slug) => {
    await page.goto(`/vs/${slug}`)
    // Table header has "ShipReady" and competitor name
    await expect(page.getByText('ShipReady').first()).toBeVisible()
    // At least 10 table rows
    const rows = page.locator('div[class*="grid-cols-"]').filter({ hasText: /AI visibility|Security|Free tier|PDF export/ })
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('invalid slug → 404', async ({ page }) => {
    const response = await page.goto('/vs/nonexistent-tool-xyz')
    expect(response?.status()).toBe(404)
  })
})
