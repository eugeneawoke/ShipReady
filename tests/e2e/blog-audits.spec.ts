import { test, expect } from '@playwright/test'

test.describe('/blog', () => {
  test('page loads, no crash', async ({ page }) => {
    const response = await page.goto('/blog')
    expect(response?.status()).toBe(200)
  })

  test('tag filter chips visible', async ({ page }) => {
    await page.goto('/blog')
    // "All" chip is a link to /blog
    await expect(page.locator('a[href="/blog"]').filter({ hasText: 'All' })).toBeVisible()
    // AI Visibility chip (most unique, avoids matching "SEO" in other text)
    await expect(page.locator('a[href*="tag=AI"]')).toBeVisible()
  })

  test('tag filter navigation works', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href*="tag=Security"]').click()
    await page.waitForURL(/tag=Security/, { timeout: 10000 })
    expect(await page.title()).toContain('Blog')
  })

  test('heading visible', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.locator('h1')).toContainText(/seo|ai visibility|security/i)
  })
})

test.describe('/audits', () => {
  test('page loads, no crash', async ({ page }) => {
    const response = await page.goto('/audits')
    expect(response?.status()).toBe(200)
  })

  test('heading visible', async ({ page }) => {
    await page.goto('/audits')
    await expect(page.locator('h1')).toContainText(/audit/i)
  })

  test('shows empty state or audit cards', async ({ page }) => {
    await page.goto('/audits')
    // Either empty state or audit cards — must not crash
    const body = await page.locator('main').textContent()
    expect(body?.length).toBeGreaterThan(10)
  })
})

test.describe('/blog/[slug] — article page', () => {
  test('non-existent slug → 404', async ({ page }) => {
    const response = await page.goto('/blog/this-article-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
  })
})

test.describe('/audits/[slug] — audit page', () => {
  test('non-existent slug → 404', async ({ page }) => {
    const response = await page.goto('/audits/this-audit-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
  })
})
