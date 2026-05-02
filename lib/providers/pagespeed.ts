import type { PageSpeedProviderData } from '@/types/scan'

interface PageSpeedFetchOptions {
  apiKey: string | undefined
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

type PageSpeedFetchResult =
  | { ok: true; data: PageSpeedProviderData }
  | { ok: false; status: 'unavailable' | 'failed'; message: string }

function metricPercentile(response: Record<string, unknown>, metricId: string): number | undefined {
  const metric = response[metricId]
  if (!metric || typeof metric !== 'object') return undefined
  const percentile = (metric as { percentile?: unknown }).percentile
  return typeof percentile === 'number' ? percentile : undefined
}

export async function fetchPageSpeedData(
  url: string,
  options: PageSpeedFetchOptions,
): Promise<PageSpeedFetchResult> {
  const apiKey = options.apiKey?.trim()
  if (!apiKey) {
    return {
      ok: false,
      status: 'unavailable',
      message: 'PAGESPEED_API_KEY is not configured.',
    }
  }

  const fetchImpl = options.fetchImpl ?? fetch
  const requestUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  requestUrl.searchParams.set('url', url)
  requestUrl.searchParams.set('strategy', 'mobile')
  requestUrl.searchParams.set('category', 'PERFORMANCE')
  requestUrl.searchParams.set('key', apiKey)

  try {
    const response = await fetchImpl(requestUrl, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = (
        typeof body === 'object' && body !== null && 'error' in body
          ? (body.error as { message?: string })?.message
          : undefined
      ) ?? `PageSpeed provider error ${response.status}`

      return {
        ok: false,
        status: 'failed',
        message,
      }
    }

    const data = body as {
      id?: string
      originLoadingExperience?: {
        id?: string
        metrics?: Record<string, unknown>
      }
      lighthouseResult?: {
        categories?: {
          performance?: {
            score?: number
          }
        }
      }
    }

    const performanceScore = data.lighthouseResult?.categories?.performance?.score

    return {
      ok: true,
      data: {
        source: 'google-pagespeed-insights',
        fetchedAt: new Date().toISOString(),
        strategy: 'mobile',
        analysisUrl: data.id ?? url,
        origin: data.originLoadingExperience?.id,
        performanceScore: typeof performanceScore === 'number'
          ? Math.round(performanceScore * 100)
          : null,
        fieldMetrics: {
          lcpMs: metricPercentile(data.originLoadingExperience?.metrics ?? {}, 'LARGEST_CONTENTFUL_PAINT_MS'),
          inpMs: metricPercentile(data.originLoadingExperience?.metrics ?? {}, 'INTERACTION_TO_NEXT_PAINT'),
          cls: (() => {
            const raw = metricPercentile(data.originLoadingExperience?.metrics ?? {}, 'CUMULATIVE_LAYOUT_SHIFT_SCORE')
            return typeof raw === 'number' ? raw / 100 : undefined
          })(),
        },
      },
    }
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'PageSpeed provider request failed.',
    }
  }
}
