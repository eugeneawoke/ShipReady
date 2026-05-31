import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { readFile } from 'fs/promises'
import path from 'path'

export const metadata: Metadata = {
  title: 'QA Report — ShipReady Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface SuiteResult {
  runner: string
  passed?: number
  failed?: number
  total?: number
  durationMs?: number
  failures?: { file: string; name: string; message: string }[]
  error?: string
}

interface CombinedReport {
  generatedAt: string
  suites: SuiteResult[]
  summary: { passed: number; failed: number; ok: boolean }
}

async function loadReport(): Promise<CombinedReport | null> {
  try {
    const filePath = path.join(process.cwd(), 'reports', 'combined.json')
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default async function AdminQaPage() {
  if (!process.env.ADMIN_SECRET) redirect('/')

  const report = await loadReport()

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] font-mono text-[#6E56CF] uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-semibold">QA Report</h1>
        </div>

        {!report ? (
          <div className="p-6 rounded-2xl bg-[#161618] border border-white/[0.06]">
            <p className="text-sm text-[#5A5955] mb-3">No report found.</p>
            <code className="text-xs font-mono text-[#6E56CF] bg-[#0E0E0F] px-3 py-2 rounded-lg block">
              npm run test:all
            </code>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#161618] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${report.summary.ok ? 'text-[#3DDC84]' : 'text-[#FF4444]'}`}>
                  {report.summary.ok ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {report.summary.passed} passed · {report.summary.failed} failed
                  </p>
                  <p className="text-[10px] text-[#5A5955]">
                    {new Date(report.generatedAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <code className="text-[10px] font-mono text-[#3A3A3A]">npm run test:all</code>
            </div>

            {/* Suites */}
            {report.suites.map(suite => (
              <div key={suite.runner} className="p-5 rounded-2xl bg-[#161618] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      suite.error ? 'bg-[#F5C518]'
                      : (suite.failed ?? 0) > 0 ? 'bg-[#FF4444]'
                      : 'bg-[#3DDC84]'
                    }`} />
                    <span className="text-sm font-medium">{suite.runner}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-[#5A5955]">
                    {suite.total !== undefined && (
                      <span>{suite.passed}/{suite.total} passed</span>
                    )}
                    {suite.durationMs !== undefined && (
                      <span>{formatDuration(suite.durationMs)}</span>
                    )}
                  </div>
                </div>

                {suite.error && (
                  <p className="text-xs text-[#F5C518] font-mono">{suite.error}</p>
                )}

                {suite.failures && suite.failures.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest">Failed</p>
                    {suite.failures.map((f, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#FF4444]/[0.08] border border-[#FF4444]/20">
                        <p className="text-xs font-medium text-[#F1F0EE]">{f.name}</p>
                        <p className="text-[10px] text-[#8B8A85] font-mono mt-0.5">{f.file}</p>
                        {f.message && (
                          <p className="text-[10px] text-[#FF4444] mt-1 font-mono">{f.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!suite.error && (suite.failures?.length ?? 0) === 0 && (
                  <p className="text-xs text-[#3DDC84] font-mono">All tests passed ✓</p>
                )}
              </div>
            ))}

            {/* Smoke checklist link */}
            <div className="p-4 rounded-xl bg-[#161618] border border-white/[0.06] text-center">
              <p className="text-xs text-[#5A5955]">
                Manual checks that Playwright cannot cover →{' '}
                <code className="text-[#6E56CF]">docs/qa/smoke-checklist.md</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
