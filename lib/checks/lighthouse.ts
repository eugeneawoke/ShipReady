// Lighthouse, puppeteer-core and @sparticuz/chromium are loaded via eval('require')
// to prevent Turbopack from statically analyzing their complex internal module graphs.
// These packages are server-only and run in Node.js at runtime.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LighthouseMetrics {
  performanceScore: number
  seoScore: number | null
  a11yScore: number | null
  lcp: number | null
  cls: number | null
  inp: number | null
  fcp: number | null
  tapTargets?: number | null
  fontSizeIssues?: boolean
  warnings: string[]
}

interface LighthouseOptions {
  timeoutMs?: number
}

interface LighthouseRuntimeError extends Error {
  code?: string
}

interface LighthouseRunProfile {
  config: Record<string, unknown>
  warnings: string[]
  label: 'mobile-full' | 'mobile-performance-fallback'
}

const DEFAULT_LIGHTHOUSE_TIMEOUT_MS = 90_000
const LIGHTHOUSE_QUEUE_KEY = Symbol.for('shipready.lighthouseQueue')

const LIGHTHOUSE_PRIMARY_PROFILE: LighthouseRunProfile = {
  label: 'mobile-full',
  config: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility'],
      formFactor: 'mobile',
      maxWaitForFcp: 15_000,
      maxWaitForLoad: 35_000,
      disableFullPageScreenshot: true,
    },
  },
  warnings: [],
}

const LIGHTHOUSE_FALLBACK_PROFILE: LighthouseRunProfile = {
  label: 'mobile-performance-fallback',
  config: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance'],
      formFactor: 'mobile',
      maxWaitForFcp: 15_000,
      maxWaitForLoad: 35_000,
      disableFullPageScreenshot: true,
    },
  },
  warnings: [
    'Recovered after a mobile tab crash by rerunning a lighter performance-only Lighthouse profile.',
    'Accessibility score is unavailable for this run because the fallback profile skipped accessibility audits.',
  ],
}

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

  await Promise.race([
    previous,
    new Promise<void>(resolve => setTimeout(resolve, 240_000)),
  ])
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

function optionalScoreFromCategory(category: any, label: string): number | null {
  if (!category) return null
  return scoreFromCategory(category, label)
}

function optionalMetric(lhr: any, auditId: string): number | null {
  const value = lhr.audits?.[auditId]?.numericValue
  if (value === undefined || value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Lighthouse returned invalid ${auditId} metric`)
  }
  return value
}

function isTargetCrashed(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  return (error as LighthouseRuntimeError).code === 'TARGET_CRASHED'
}

function runtimeErrorFromLhr(lhr: any): LighthouseRuntimeError | null {
  const runtimeError = lhr?.runtimeError
  if (!runtimeError) return null

  const message = typeof runtimeError.message === 'string'
    ? runtimeError.message
    : 'Lighthouse did not produce a valid report'
  const error = new Error(message) as LighthouseRuntimeError
  if (typeof runtimeError.code === 'string') {
    error.code = runtimeError.code
  }
  return error
}

export async function runLighthouse(url: string, options: LighthouseOptions = {}): Promise<LighthouseMetrics> {
  return withLighthouseSlot(async () => {
    try {
      return await runLighthouseNow(url, options, 1, LIGHTHOUSE_PRIMARY_PROFILE)
    } catch (error) {
      if (isTargetCrashed(error)) {
        console.error('[lighthouse] mobile audit target crashed; retrying once with a lighter mobile profile:', error)
        await new Promise(resolve => setTimeout(resolve, 3_000))
        return runLighthouseNow(url, options, 2, LIGHTHOUSE_FALLBACK_PROFILE)
      }

      if (!isStartupProtocolTimeout(error)) throw error

      console.error('[lighthouse] startup protocol timeout; retrying once after browser restart:', error)
      await new Promise(resolve => setTimeout(resolve, 3_000))
      return runLighthouseNow(url, options, 2, LIGHTHOUSE_PRIMARY_PROFILE)
    }
  })
}

async function runLighthouseNow(
  url: string,
  options: LighthouseOptions = {},
  attempt: number,
  profile: LighthouseRunProfile,
): Promise<LighthouseMetrics> {
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

  console.info(`[lighthouse] starting build=${scannerBuildId()} attempt=${attempt} profile=${profile.label} url=${url} chromium=${executablePath} systemChromium=${Boolean(systemChromium)}`)

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
    }, profile.config)

    const { lhr } = await Promise.race([
      lighthouseRun,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          timedOut = true
          reject(new Error(`lighthouse timed out after ${Math.round(timeoutMs / 1000)}s`))
        }, timeoutMs)
      }),
    ])

    const runtimeError = runtimeErrorFromLhr(lhr)
    if (!lhr || runtimeError) {
      throw runtimeError ?? new Error('Lighthouse did not produce a valid report')
    }

    const tapTargetsScore = lhr.audits?.['tap-targets']?.score
    const fontSizeScore = lhr.audits?.['font-size']?.score
    const metrics = {
      performanceScore: scoreFromCategory(lhr.categories?.performance, 'performance'),
      seoScore: optionalScoreFromCategory(lhr.categories?.seo, 'seo'),
      a11yScore: lhr.categories?.accessibility ? scoreFromCategory(lhr.categories.accessibility, 'accessibility') : null,
      lcp: optionalMetric(lhr, 'largest-contentful-paint'),
      cls: optionalMetric(lhr, 'cumulative-layout-shift'),
      inp: optionalMetric(lhr, 'interaction-to-next-paint'),
      fcp: optionalMetric(lhr, 'first-contentful-paint'),
      tapTargets: typeof tapTargetsScore === 'number' ? tapTargetsScore : null,
      fontSizeIssues: typeof fontSizeScore === 'number' && fontSizeScore < 1,
      warnings: [
        ...(Array.isArray(lhr.runWarnings) ? lhr.runWarnings.filter((warning: unknown) => typeof warning === 'string') : []),
        ...profile.warnings,
      ],
    }

    console.info(
      `[lighthouse] completed build=${scannerBuildId()} attempt=${attempt} profile=${profile.label} url=${url} durationMs=${Date.now() - startedAt} performance=${metrics.performanceScore} seo=${metrics.seoScore ?? 'null'} a11y=${metrics.a11yScore ?? 'null'} warnings=${metrics.warnings.length}`,
    )

    return metrics
  } catch (error) {
    forceKillBrowser = timedOut || isStartupProtocolTimeout(error) || isTargetCrashed(error)
    throw error
  } finally {
    if (timeout) clearTimeout(timeout)
    await closeBrowser(browser, forceKillBrowser)
  }
}
