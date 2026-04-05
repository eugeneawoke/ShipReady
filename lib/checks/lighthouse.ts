// Lighthouse, puppeteer-core and @sparticuz/chromium are loaded via eval('require')
// to prevent Turbopack from statically analyzing their complex internal module graphs.
// These packages are server-only and run in Node.js at runtime.

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function runLighthouse(url: string) {
  // eval prevents Turbopack from tracing into these packages at build time
  const chromium   = eval("require('@sparticuz/chromium')")  as any
  const lighthouse = eval("require('lighthouse')")           as any
  const puppeteer  = eval("require('puppeteer-core')")       as any

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })

  try {
    const { lhr } = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'seo'],
      formFactor: 'mobile',
    })

    return {
      performanceScore: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      seoScore:         Math.round((lhr.categories.seo?.score ?? 0) * 100),
      a11yScore:        Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
      lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? 0,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
      inp: lhr.audits['interaction-to-next-paint']?.numericValue ?? 0,
      fcp: lhr.audits['first-contentful-paint']?.numericValue ?? 0,
    }
  } finally {
    await browser.close()
  }
}
