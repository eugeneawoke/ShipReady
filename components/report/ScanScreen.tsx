'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import type { Scan, ScanStatus } from '@/types/scan'

const MIN_SCAN_SCREEN_MS = 18_000
const DRAFT_REPORT_AFTER_MS = 35_000
const MAX_SCAN_SCREEN_MS = 90_000
const POLL_INTERVAL_MS = 1500

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function ScanScreen({ id }: { id: string }) {
  const router = useRouter()
  const startedAtRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const [status, setStatus] = useState<ScanStatus>('pending')
  const [processingIssue, setProcessingIssue] = useState<Scan['processingIssue']>()

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    startedAtRef.current = Date.now()

    function elapsedMs() {
      return Date.now() - (startedAtRef.current ?? Date.now())
    }

    async function openReport() {
      const remaining = MIN_SCAN_SCREEN_MS - elapsedMs()
      if (remaining > 0) await sleep(remaining)
      if (!cancelled && mountedRef.current) {
        router.push(`/report/${id}`)
      }
    }

    async function poll() {
      try {
        const res = await fetch(`/api/scan/${id}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        })

        if (res.ok) {
          const data = await res.json() as Scan
          if (cancelled || !mountedRef.current) return
          setStatus(data.status)
          setProcessingIssue(data.processingIssue ?? data.results?.processingIssue)

          const hasDeepResult = data.results?.phase && data.results.phase !== 'fast'
          const canShowDraftReport = Boolean(data.results) && elapsedMs() >= DRAFT_REPORT_AFTER_MS
          if (data.status === 'done' || data.status === 'error' || hasDeepResult || canShowDraftReport) {
            await openReport()
            return
          }
        } else if (elapsedMs() >= MAX_SCAN_SCREEN_MS) {
          await openReport()
          return
        }
      } catch {
        if (elapsedMs() >= MAX_SCAN_SCREEN_MS) {
          await openReport()
          return
        }
      }

      if (!cancelled) {
        window.setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [id, router])

  return <ReportSkeleton status={status} processingIssue={processingIssue} />
}
