import { test, expect } from '@playwright/test'

test.describe('/blog', () => {
  test('page loads, no crash', async ({ page }) => {
    const response = await page.goto('/blog')
    expect(response?.status()).toBe(200)
  })

  test('tag filter chips visible', async ({ page }) => {
    await page.goto('/blog')
    // "All" chip always present
    await expect(page.getByText('All')).toBeVisible()
    // Tag filter chips
    for (const tag of ['SEO', 'AI Visibility', 'Security', 'Performance']) {
      await expect(page.getByText(tag).first()).toBeVisible()
    }
  })

  test('tag filter navigation works', async ({ page }) => {
    await page.goto('/blog')
    await page.click('text=SEO')
    await expect(page).toHaveURL(/tag=SEO/)
    // No crash on tag filter
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
