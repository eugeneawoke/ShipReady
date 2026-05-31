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

test.describe('/vs/ahrefs', () => {
  test('h1 + FAQPage JSON-LD + CTA', async ({ page }) => {
    await page.goto('/vs/ahrefs')
    await expect(page.locator('h1')).toContainText('ShipReady vs Ahrefs')

    // Find FAQPage JSON-LD — may not be the first script tag on the page
    const scripts = await page.locator('script[type="application/ld+json"]').all()
    let faqFound = false
    for (const script of scripts) {
      const text = await script.textContent()
      const data = JSON.parse(text ?? '{}')
      if (data['@type'] === 'FAQPage') {
        faqFound = true
        expect(data.mainEntity).toHaveLength(3)
        break
      }
    }
    expect(faqFound, 'FAQPage JSON-LD not found on /vs/ahrefs').toBe(true)

    await expect(page.locator('a[href="/"]').first()).toBeVisible()
  })
})

test.describe('/vs/[slug] — all competitors', () => {
  for (const slug of COMPETITOR_SLUGS) {
    test(`${slug} — 200 and title contains year`, async ({ page }) => {
      const response = await page.goto(`/vs/${slug}`)
      expect(response?.status()).toBe(200)
      const title = await page.title()
      const year = new Date().getFullYear().toString()
      expect(title).toContain(year)
    })

    test(`${slug} — feature table rendered`, async ({ page }) => {
      await page.goto(`/vs/${slug}`)
      await expect(page.getByText('ShipReady').first()).toBeVisible()
      // Table has AI visibility row
      await expect(page.getByText('AI visibility score').first()).toBeVisible()
    })
  }

  test('invalid slug → 404', async ({ page }) => {
    const response = await page.goto('/vs/nonexistent-tool-xyz')
    expect(response?.status()).toBe(404)
  })
})
