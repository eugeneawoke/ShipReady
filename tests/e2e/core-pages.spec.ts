import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('scan form present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[type="url"], input[placeholder*="https"]').first()).toBeVisible()
  })

  test('footer links present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/blog"]').first()).toBeVisible()
    await expect(page.locator('a[href="/vs"]').first()).toBeVisible()
    await expect(page.locator('a[href="/audits"]').first()).toBeVisible()
  })
})

test.describe('SEO landing pages', () => {
  for (const path of ['/seo', '/security', '/ai-visibility']) {
    test(`${path} loads with ScanForm`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('input[type="url"], input[placeholder*="https"]').first()).toBeVisible()
    })
  }
})

test.describe('/pricing', () => {
  test('feature comparison table renders', async ({ page }) => {
    await page.goto('/pricing')
    // Column headers
    await expect(page.getByText('Free').first()).toBeVisible()
    await expect(page.getByText('Pro').first()).toBeVisible()
    // Toggle present
    await expect(page.getByText(/monthly|yearly/i).first()).toBeVisible()
  })

  test('FeatureCell checkmarks rendered (SVG circles present)', async ({ page }) => {
    await page.goto('/pricing')
    const checkmarks = page.locator('svg circle')
    expect(await checkmarks.count()).toBeGreaterThan(5)
  })
})

test.describe('sitemap.xml', () => {
  test('contains /vs/ entries', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)
    const body = await response?.text()
    expect(body).toContain('/vs/ahrefs')
    expect(body).toContain('/vs/semrush')
  })

  test('contains /blog', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    const body = await response?.text()
    expect(body).toContain('/blog')
  })

  test('contains /audits', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    const body = await response?.text()
    expect(body).toContain('/audits')
  })
})
