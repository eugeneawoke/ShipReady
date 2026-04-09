// Lighthouse, puppeteer-core and @sparticuz/chromium are loaded via eval('require')
// to prevent Turbopack from statically analyzing their complex internal module graphs.
// These packages are server-only and run in Node.js at runtime.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LighthouseMetrics {
  performanceScore: number
  seoScore: number
  a11yScore: number | null
  lcp: number | null
  cls: number | null
  inp: number | null
  fcp: number | null
  warnings: string[]
}

interface LighthouseOptions {
  timeoutMs?: number
}

const DEFAULT_LIGHTHOUSE_TIMEOUT_MS = 240_000

let lighthouseQueue = Promise.resolve()

async function withLighthouseSlot<T>(task: () => Promise<T>): Promise<T> {
  const queuedAt = Date.now()
  const previous = lighthouseQueue.catch(() => undefined)
  let releaseSlot!: () => void

  lighthouseQueue = new Promise<void>((resolve) => {
    releaseSlot = resolve
  })

  await previous
  const waitMs = Date.now() - queuedAt
  if (waitMs > 1000) {
    console.info(`[lighthouse] acquired scanner slot after waitMs=${waitMs}`)
  }

  try {
    return await task()
  } finally {
    releaseSlot()
  }
}

function scoreFromCategory(category: any, label: string): number {
  const score = category?.score
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error(`Lighthouse returned invalid ${label} score`)
  }
  return Math.round(score * 100)
}

function optionalMetric(lhr: any, auditId: string): number | null {
  const value = lhr.audits?.[auditId]?.numericValue
  if (value === undefined || value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Lighthouse returned invalid ${auditId} metric`)
  }
  return value
}

export async function runLighthouse(url: string, options: LighthouseOptions = {}): Promise<LighthouseMetrics> {
  return withLighthouseSlot(() => runLighthouseNow(url, options))
}

async function runLighthouseNow(url: string, options: LighthouseOptions = {}): Promise<LighthouseMetrics> {
  const startedAt = Date.now()
  const timeoutMs = options.timeoutMs ?? DEFAULT_LIGHTHOUSE_TIMEOUT_MS
  // eval prevents Turbopack from tracing into these packages at build time
  const chromium        = eval("require('@sparticuz/chromium')")  as any
  const lighthouseMod   = eval("require('lighthouse')")           as any
  // Lighthouse 11+ is ESM-wrapped — the callable is at .default
  const lighthouse      = (lighthouseMod.default ?? lighthouseMod) as any
  const puppeteer       = eval("require('puppeteer-core')")       as any

  // On Railway (Docker) use the system Chromium; elsewhere use @sparticuz/chromium
  const systemChromium = process.env.CHROMIUM_PATH
  const executablePath = systemChromium ?? await chromium.executablePath()

  console.info(`[lighthouse] starting url=${url} chromium=${executablePath} systemChromium=${Boolean(systemChromium)}`)

  const browser = await puppeteer.launch({
    args: systemChromium
      ? [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-networking',
          '--no-first-run',
        ]
      : chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
    protocolTimeout: 180_000,
    timeout: 60_000,
  })

  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    const lighthouseRun = lighthouse(url, {
      port: Number(new URL(browser.wsEndpoint()).port),
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'seo'],
      formFactor: 'mobile',
      maxWaitForLoad: 120_000,
    })

    const { lhr } = await Promise.race([
      lighthouseRun,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`lighthouse timed out after ${Math.round(timeoutMs / 1000)}s`))
        }, timeoutMs)
      }),
    ])

    if (!lhr || lhr.runtimeError) {
      throw new Error(lhr?.runtimeError?.message || 'Lighthouse did not produce a valid report')
    }

    const metrics = {
      performanceScore: scoreFromCategory(lhr.categories?.performance, 'performance'),
      seoScore: scoreFromCategory(lhr.categories?.seo, 'seo'),
      a11yScore: lhr.categories?.accessibility ? scoreFromCategory(lhr.categories.accessibility, 'accessibility') : null,
      lcp: optionalMetric(lhr, 'largest-contentful-paint'),
      cls: optionalMetric(lhr, 'cumulative-layout-shift'),
      inp: optionalMetric(lhr, 'interaction-to-next-paint'),
      fcp: optionalMetric(lhr, 'first-contentful-paint'),
      warnings: Array.isArray(lhr.runWarnings) ? lhr.runWarnings.filter((warning: unknown) => typeof warning === 'string') : [],
    }

    console.info(
      `[lighthouse] completed url=${url} durationMs=${Date.now() - startedAt} performance=${metrics.performanceScore} seo=${metrics.seoScore} a11y=${metrics.a11yScore ?? 'null'} warnings=${metrics.warnings.length}`,
    )

    return metrics
  } finally {
    if (timeout) clearTimeout(timeout)
    await browser.close().catch((error: unknown) => {
      console.error('[lighthouse] failed to close browser:', error)
    })
  }
}
