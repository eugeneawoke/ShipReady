import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

const LOCAL_ORIGINS = ['http://localhost:3000', 'http://localhost:3001']

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function requestOrigin(request: NextRequest): string | null {
  const host = request.headers.get('host')
  if (!host) return null

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const proto = forwardedProto || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  return normalizeOrigin(`${proto}://${host}`)
}

function allowedOrigins(): Set<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const localOrigins = process.env.NODE_ENV !== 'production' ? LOCAL_ORIGINS : []
  // requestOrigin(request) intentionally excluded — deriving allowed origin from
  // inbound Host header makes the CSRF guard a no-op (Host always self-matches).
  return new Set([
    ...(appUrl ? [appUrl] : []),
    ...localOrigins,
  ])
}

export function isAllowedOrigin(_request: NextRequest, origin: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin)
  return !!normalizedOrigin && allowedOrigins().has(normalizedOrigin)
}

export function requireSameOriginJsonRequest(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const contentType = request.headers.get('content-type') ?? ''

  if (!contentType.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
  }

  if (!origin || !isAllowedOrigin(request, origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
