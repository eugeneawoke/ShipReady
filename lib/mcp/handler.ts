import { createServiceClient } from '@/lib/supabase'
import { validateApiKey, ApiKeyError, type ApiKeyContext } from '@/lib/api/api-key-auth'
import { assertSafeScanUrl } from '@/lib/server/url-safety'
import { dispatchScanToRailway } from '@/lib/server/scanner-dispatch'
import { getAllIssues } from '@/lib/scoring'
import { MCP_TOOLS } from './tools'
import type { ScanResult, IssueCategory, IssueSeverity, IssueConfidence } from '@/types/scan'

export type McpResult = { content: Array<{ type: 'text'; text: string }> }
export type McpError = { code: number; message: string }

export async function mcpToolsCall(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ApiKeyContext,
): Promise<McpResult> {
  const supabase = createServiceClient()

  if (toolName === 'scan_url') {
    const url = args.url as string
    if (!url) throw { code: -32602, message: 'url is required' }

    let safeUrl: string
    try {
      safeUrl = await assertSafeScanUrl(url)
    } catch (err: unknown) {
      throw { code: -32602, message: err instanceof Error ? err.message : 'Invalid URL' }
    }

    const { data: scan, error } = await supabase
      .from('scans')
      .insert({
        url: safeUrl,
        user_id: ctx.userId,
        status: 'pending',
        scan_goal: args.goal ?? 'full',
        trigger: 'api',
      })
      .select('id')
      .single()

    if (error || !scan) throw { code: -32603, message: 'Failed to create scan' }

    try {
      await dispatchScanToRailway(scan.id, safeUrl)
    } catch {
      // non-fatal — scan still exists, will show error status
    }

    return { content: [{ type: 'text', text: JSON.stringify({ scan_id: scan.id, status: 'pending', url: safeUrl }) }] }
  }

  if (toolName === 'get_report') {
    const scanId = args.scan_id as string
    if (!scanId) throw { code: -32602, message: 'scan_id is required' }

    const { data: scan } = await supabase
      .from('scans')
      .select('id, url, status, results, created_at')
      .eq('id', scanId)
      .eq('user_id', ctx.userId)
      .single()

    if (!scan) throw { code: -32602, message: 'Scan not found or access denied' }

    const out: Record<string, unknown> = {
      scan_id: scan.id,
      url: scan.url,
      status: scan.status,
      created_at: scan.created_at,
    }

    if (scan.results && scan.status === 'done') {
      const r = scan.results as ScanResult
      out.total_score = r.totalScore
      out.categories = {
        performance: r.performance?.score,
        seo: r.seo?.score,
        security: r.security?.score,
        mobile: r.mobile?.score,
        ai_visibility: r.ai_visibility?.score,
        accessibility: r.accessibility?.score,
      }
      out.ai_summary = r.aiSummary
      out.top_priorities = r.topPriorities
    }

    return { content: [{ type: 'text', text: JSON.stringify(out) }] }
  }

  if (toolName === 'list_issues') {
    const scanId = args.scan_id as string
    if (!scanId) throw { code: -32602, message: 'scan_id is required' }

    const { data: scan } = await supabase
      .from('scans')
      .select('user_id, status, results')
      .eq('id', scanId)
      .eq('user_id', ctx.userId)
      .single()

    if (!scan) throw { code: -32602, message: 'Scan not found or access denied' }
    if (scan.status !== 'done') throw { code: -32602, message: `Scan not complete (status: ${scan.status})` }

    let issues = getAllIssues(scan.results as ScanResult)

    if (args.category) issues = issues.filter(i => i.category === (args.category as IssueCategory))
    if (args.severity) issues = issues.filter(i => i.severity === (args.severity as IssueSeverity))
    if (args.confidence) issues = issues.filter(i => i.confidence === (args.confidence as IssueConfidence))

    const out = issues.map(i => ({
      id: i.id,
      category: i.category,
      severity: i.severity,
      confidence: i.confidence,
      title: i.title,
      plain_english: i.plainEnglish,
      value: i.value,
    }))

    return { content: [{ type: 'text', text: JSON.stringify({ issues: out, count: out.length }) }] }
  }

  if (toolName === 'get_issue') {
    const scanId = args.scan_id as string
    const issueId = args.issue_id as string
    if (!scanId || !issueId) throw { code: -32602, message: 'scan_id and issue_id are required' }

    const { data: scan } = await supabase
      .from('scans')
      .select('user_id, status, results')
      .eq('id', scanId)
      .eq('user_id', ctx.userId)
      .single()

    if (!scan) throw { code: -32602, message: 'Scan not found or access denied' }
    if (scan.status !== 'done') throw { code: -32602, message: `Scan not complete (status: ${scan.status})` }

    const issue = getAllIssues(scan.results as ScanResult).find(i => i.id === issueId)
    if (!issue) throw { code: -32602, message: `Issue '${issueId}' not found in this scan` }

    const out = {
      id: issue.id,
      category: issue.category,
      severity: issue.severity,
      confidence: issue.confidence,
      title: issue.title,
      plain_english: issue.plainEnglish,
      value: issue.value,
      evidence: issue.evidence,
      fix_prompt: issue.fixPrompt,
      docs_url: issue.docsUrl,
    }

    return { content: [{ type: 'text', text: JSON.stringify(out) }] }
  }

  throw { code: -32601, message: `Unknown tool: ${toolName}` }
}

export async function handleMcpRequest(
  body: unknown,
  authHeader: string | null,
): Promise<{ status: number; body: unknown }> {
  // Validate JSON-RPC shape
  if (!body || typeof body !== 'object' || !('method' in body) || !('jsonrpc' in body)) {
    return {
      status: 400,
      body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } },
    }
  }

  const req = body as { jsonrpc: string; method: string; params?: unknown; id?: unknown }
  const id = req.id ?? null

  // initialize — no auth required
  if (req.method === 'initialize') {
    return {
      status: 200,
      body: {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'glook-mcp', version: '1.0.0' },
        },
      },
    }
  }

  // All other methods require auth
  let ctx: ApiKeyContext
  try {
    ctx = await validateApiKey(authHeader)
  } catch (err) {
    const e = err as ApiKeyError
    return {
      status: e.status,
      body: { jsonrpc: '2.0', id, error: { code: -32001, message: e.message } },
    }
  }

  if (req.method === 'tools/list') {
    return {
      status: 200,
      body: { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } },
    }
  }

  if (req.method === 'tools/call') {
    const params = req.params as { name?: string; arguments?: Record<string, unknown> } | undefined
    const toolName = params?.name
    const args = params?.arguments ?? {}

    if (!toolName) {
      return {
        status: 400,
        body: { jsonrpc: '2.0', id, error: { code: -32602, message: 'params.name is required' } },
      }
    }

    try {
      const result = await mcpToolsCall(toolName, args, ctx)
      return { status: 200, body: { jsonrpc: '2.0', id, result } }
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      return {
        status: 200,
        body: {
          jsonrpc: '2.0',
          id,
          error: { code: e.code ?? -32603, message: e.message ?? 'Internal error' },
        },
      }
    }
  }

  return {
    status: 200,
    body: { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${req.method}` } },
  }
}
