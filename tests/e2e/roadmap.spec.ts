import { test, expect } from '@playwright/test'

test.describe('/roadmap — changelog tab', () => {
  test('both tabs visible', async ({ page }) => {
    await page.goto('/roadmap')
    await expect(page.getByRole('button', { name: /roadmap/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /what.s new/i })).toBeVisible()
  })

  test("clicking What's New shows changelog entries", async ({ page }) => {
    await page.goto('/roadmap')
    await page.getByRole('button', { name: /what.s new/i }).click()
    // At least one done phase with releaseDate should appear
    await expect(page.getByText(/Scanner Engine|Report & AI|Growth & Quality|Accounts/).first()).toBeVisible()
  })

  test('changelog sorted newest first — May 28 before May 7', async ({ page }) => {
    await page.goto('/roadmap')
    await page.getByRole('button', { name: /what.s new/i }).click()
    const entries = page.locator('text=/May.*2026/').all()
    const texts = await (await entries).map(e => e.textContent())
    // Growth & Quality (May 28) should appear in DOM before Scanner Engine (May 7)
    const bodyText = await page.locator('main').textContent()
    const pos28 = bodyText?.indexOf('Growth') ?? -1
    const pos07 = bodyText?.indexOf('Scanner Engine') ?? -1
    expect(pos28).toBeGreaterThan(-1)
    expect(pos07).toBeGreaterThan(-1)
    expect(pos28).toBeLessThan(pos07)
  })

  test('Roadmap tab still works after switching', async ({ page }) => {
    await page.goto('/roadmap')
    await page.getByRole('button', { name: /what.s new/i }).click()
    await page.getByRole('button', { name: /roadmap/i }).first().click()
    // Phase cards should be back
    await expect(page.getByText('Beta Launch')).toBeVisible()
  })
})
