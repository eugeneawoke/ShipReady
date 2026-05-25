export interface DetectedLibrary {
  name: string
  version: string
  ecosystem: string
}

export interface CVEResult {
  library: DetectedLibrary
  cveIds: string[]
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown'
}

interface OSVVulnerability {
  id: string
  severity?: Array<{ type: string; score: string }>
}

interface OSVResponse {
  vulns?: OSVVulnerability[]
}

export function detectJsLibraries(html: string): DetectedLibrary[] {
  const libs: DetectedLibrary[] = []

  const patterns: Array<{ re: RegExp; name: string; ecosystem: string }> = [
    { re: /jquery[.-](\d+\.\d+\.\d+)(?:\.min)?\.js/i, name: 'jquery', ecosystem: 'npm' },
    { re: /bootstrap[.-](\d+\.\d+\.\d+)(?:\.min)?\.(?:js|css)/i, name: 'bootstrap', ecosystem: 'npm' },
    { re: /lodash[.-](\d+\.\d+\.\d+)(?:\.min)?\.js/i, name: 'lodash', ecosystem: 'npm' },
    { re: /moment[.-](\d+\.\d+\.\d+)(?:\.min)?\.js/i, name: 'moment', ecosystem: 'npm' },
    { re: /angular(?:\.min)?\.js.*?[?&]v=(\d+\.\d+\.\d+)/i, name: '@angular/core', ecosystem: 'npm' },
    { re: /react(?:\.development|\.production\.min)?\.js.*?[?&]v=(\d+\.\d+\.\d+)/i, name: 'react', ecosystem: 'npm' },
  ]

  for (const { re, name, ecosystem } of patterns) {
    const match = html.match(re)
    if (match?.[1]) {
      libs.push({ name, version: match[1], ecosystem })
    }
  }

  return libs
}

export async function queryOSVBatch(
  libraries: DetectedLibrary[],
  timeoutMs = 10_000,
): Promise<CVEResult[]> {
  if (libraries.length === 0) return []

  const results: CVEResult[] = []

  await Promise.allSettled(
    libraries.map(async (lib) => {
      try {
        const body = {
          version: lib.version,
          package: { name: lib.name, ecosystem: lib.ecosystem },
        }

        const res = await fetch('https://api.osv.dev/v1/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        })

        if (!res.ok) return

        const data = await res.json() as OSVResponse
        const vulns = data.vulns ?? []
        if (vulns.length === 0) return

        let severity: CVEResult['severity'] = 'unknown'
        for (const vuln of vulns) {
          for (const s of vuln.severity ?? []) {
            const score = parseFloat(s.score)
            if (!isNaN(score)) {
              if (score >= 9.0) { severity = 'critical'; break }
              else if (score >= 7.0 && severity !== 'critical') severity = 'high'
              else if (score >= 4.0 && !['critical', 'high'].includes(severity)) severity = 'medium'
              else if (severity === 'unknown') severity = 'low'
            }
          }
        }

        results.push({
          library: lib,
          cveIds: vulns.slice(0, 5).map(v => v.id),
          severity,
        })
      } catch {
        // non-fatal per library
      }
    }),
  )

  return results
}
