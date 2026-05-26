import { NextRequest, NextResponse } from 'next/server'
import { handleMcpRequest } from '@/lib/mcp/handler'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 }
    )
  }

  const { status, body: responseBody } = await handleMcpRequest(
    body,
    request.headers.get('authorization')
  )

  return NextResponse.json(responseBody, { status })
}

// OPTIONS for CORS (MCP clients may preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
