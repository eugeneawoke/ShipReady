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
const LIGHTHOUSE_QUEUE_KEY = Symbol.for('shipready.lighthouseQueue')

type GlobalWithLighthouseQueue = typeof globalThis & {
  [LIGHTHOUSE_QUEUE_KEY]?: Promise<void>
}

function getLighthouseQueue(): Promise<void> {
  const globalState = globalThis as GlobalWithLighthouseQueue
  globalState[LIGHTHOUSE_QUEUE_KEY] ??= Promise.resolve()
  return globalState[LIGHTHOUSE_QUEUE_KEY]
}

function setLighthouseQueue(queue: Promise<void>) {
  const globalState = globalThis as GlobalWithLighthouseQueue
  globalState[LIGHTHOUSE_QUEUE_KEY] = queue
}

function scannerBuildId(): string {
  return (
    process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7)
    || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
    || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
    || 'local'
  )
}

function isStartupProtocolTimeout(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: unknown; protocolMethod?: unknown }
  return candidate.code === 'PROTOCOL_TIMEOUT' && candidate.protocolMethod === 'Page.enable'
}

async function withLighthouseSlot<T>(task: () => Promise<T>): Promise<T> {
  const queuedAt = Date.now()
  const previous = getLighthouseQueue().catch(() => undefined)
  let releaseSlot!: () => void

  setLighthouseQueue(new Promise<void>((resolve) => {
    releaseSlot = resolve
  }))

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

async function closeBrowser(browser: any, forceKill: boolean) {
  const processRef = typeof browser.process === 'function' ? browser.process() : null
  let closeTimeout: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      browser.close(),
      new Promise<never>((_, reject) => {
        closeTimeout = setTimeout(() => reject(new Error('browser close timed out')), 5_000)
      }),
    ])
  } catch (error) {
    console.error('[lighthouse] failed to close browser:', error)
  } finally {
    if (closeTimeout) clearTimeout(closeTimeout)
    if (forceKill && processRef && !processRef.killed) {
      processRef.kill('SIGKILL')
    }
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
  return withLighthouseSlot(async () => {
    try {
      return await runLighthouseNow(url, options, 1)
    } catch (error) {
      if (!isStartupProtocolTimeout(error)) throw error

      console.error('[lighthouse] startup protocol timeout; retrying once after browser restart:', error)
      await new Promise(resolve => setTimeout(resolve, 3_000))
      return runLighthouseNow(url, options, 2)
    }
  })
}

async function runLighthouseNow(url: string, options: LighthouseOptions = {}, attempt: number): Promise<LighthouseMetrics> {
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

  console.info(`[lighthouse] starting build=${scannerBuildId()} attempt=${attempt} url=${url} chromium=${executablePath} systemChromium=${Boolean(systemChromium)}`)

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
  let timedOut = false
  let forceKillBrowser = false

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
          timedOut = true
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
      `[lighthouse] completed build=${scannerBuildId()} attempt=${attempt} url=${url} durationMs=${Date.now() - startedAt} performance=${metrics.performanceScore} seo=${metrics.seoScore} a11y=${metrics.a11yScore ?? 'null'} warnings=${metrics.warnings.length}`,
    )

    return metrics
  } catch (error) {
    forceKillBrowser = timedOut || isStartupProtocolTimeout(error)
    throw error
  } finally {
    if (timeout) clearTimeout(timeout)
    await closeBrowser(browser, forceKillBrowser)
  }
}
