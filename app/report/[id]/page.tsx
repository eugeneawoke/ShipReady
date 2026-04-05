'use client'

import { useEffect, useState } from 'react'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import type { Scan } from '@/types/scan'

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return

    let interval: NodeJS.Timeout

    async function poll() {
      const res = await fetch(`/api/scan/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setScan(data)
      if (data.status === 'done' || data.status === 'error') {
        clearInterval(interval)
      }
    }

    poll()
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [id])

  if (!scan || scan.status === 'pending' || scan.status === 'running') {
    return <ReportSkeleton status={scan?.status ?? 'pending'} />
  }

  if (scan.status === 'error') {
    return <ReportSkeleton status="error" />
  }

  // Phase 5 will replace this with full report UI
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium mb-4">Report ready</h1>
        <p className="text-[#8B8A85] font-mono text-sm">{scan.url}</p>
        {scan.results && (
          <div className="mt-6 p-4 rounded-xl bg-[#161618] border border-white/6">
            <p className="text-4xl font-mono font-medium">
              {scan.results.totalScore}
              <span className="text-base text-[#8B8A85] font-sans ml-1">/100</span>
            </p>
            <p className="mt-2 text-sm text-[#8B8A85]">
              Performance {scan.results.performance.score} · SEO {scan.results.seo.score} · Security {scan.results.security.score} · Mobile {scan.results.mobile.score}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
