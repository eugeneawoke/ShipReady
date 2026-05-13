import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import type { ScanResult } from '@/types/scan'

// Valid hostname: letters, digits, hyphens, dots — no wildcards or path separators
const HOSTNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,251}[a-zA-Z0-9]$/

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params

  if (!domain || !HOSTNAME_RE.test(domain)) {
    return badgeSvg(0)
  }

  const supabase = await createClient()

  // RLS limits this route to anonymous/public scans only.
  const { data } = await supabase
    .from('scans')
    .select('results')
    .or(
      [
        `url.eq.https://${domain}`,
        `url.eq.http://${domain}`,
        `url.like.https://${domain}/%`,
        `url.like.http://${domain}/%`,
      ].join(',')
    )
    .eq('status', 'done')
    .eq('badge_enabled', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const rawScore = (data?.results as ScanResult | null)?.totalScore ?? 0
  const score = Math.max(0, Math.min(100, Math.round(Number(rawScore) || 0)))

  return badgeSvg(score)
}

function badgeSvg(score: number): NextResponse {
  const color =
    score >= 90 ? '#3DDC84' :
    score >= 70 ? '#7BC67E' :
    score >= 50 ? '#F5C518' : '#FF4444'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="140" height="20" fill="#555"/>
  <rect rx="3" x="80" width="60" height="20" fill="${color}"/>
  <rect rx="3" width="140" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="40" y="15" fill="#010101" fill-opacity=".3">ShipReady</text>
    <text x="40" y="14">ShipReady</text>
    <text x="110" y="15" fill="#010101" fill-opacity=".3">${score}/100</text>
    <text x="110" y="14">${score}/100</text>
  </g>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
