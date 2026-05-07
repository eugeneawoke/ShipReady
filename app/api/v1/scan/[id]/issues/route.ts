import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { validateApiKey, ApiKeyError } from '@/lib/api/api-key-auth'
import { getAllIssues } from '@/lib/scoring'
import type { IssueCategory, IssueSeverity, IssueConfidence, ScanResult } from '@/types/scan'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let apiKeyCtx
  try {
    apiKeyCtx = await validateApiKey(request.headers.get('authorization'))
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data: scan } = await supabase
    .from('scans')
    .select('id, user_id, status, results')
    .eq('id', id)
    .single()

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  if (scan.user_id !== apiKeyCtx.userId) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('owner_user_id', scan.user_id)
      .eq('member_user_id', apiKeyCtx.userId)
      .not('accepted_at', 'is', null)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  if (!scan.results) {
    return NextResponse.json({ error: 'Scan results not yet available', status: scan.status }, { status: 404 })
  }

  const results = scan.results as ScanResult
  const searchParams = request.nextUrl.searchParams
  const filterCategory = searchParams.get('category') as IssueCategory | null
  const filterSeverity = searchParams.get('severity') as IssueSeverity | null
  const filterConfidence = searchParams.get('confidence') as IssueConfidence | null

  let issues = getAllIssues(results)

  if (filterCategory) issues = issues.filter(i => i.category === filterCategory)
  if (filterSeverity) issues = issues.filter(i => i.severity === filterSeverity)
  if (filterConfidence) issues = issues.filter(i => i.confidence === filterConfidence)

  const categoryScores = Object.fromEntries(
    (['performance', 'seo', 'security', 'mobile', 'ai_visibility', 'accessibility'] as IssueCategory[])
      .map(cat => [cat, results[cat]?.score ?? null])
  ) as Record<IssueCategory, number | null>

  return NextResponse.json({
    issues,
    totalScore: results.totalScore,
    categoryScores,
  })
}
