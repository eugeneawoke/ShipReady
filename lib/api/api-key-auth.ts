import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase'

export interface ApiKeyContext {
  userId: string
  plan: 'free' | 'pro' | 'agency'
  keyId: string
}

export class ApiKeyError extends Error {
  constructor(
    public readonly status: 401 | 429,
    message: string,
  ) {
    super(message)
  }
}

export async function validateApiKey(authHeader: string | null): Promise<ApiKeyContext> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiKeyError(401, 'Missing or invalid Authorization header')
  }

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey) {
    throw new ApiKeyError(401, 'Empty API key')
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc('consume_api_key_quota', { p_key_hash: keyHash })

  if (error) {
    throw new ApiKeyError(401, 'Authentication failed')
  }

  const result = data as { allowed: boolean; reason?: string; user_id?: string; plan?: string; key_id?: string; daily_limit?: number }

  if (!result.allowed) {
    if (result.reason === 'rate_limited') {
      throw new ApiKeyError(429, `Daily limit of ${result.daily_limit} requests reached`)
    }
    throw new ApiKeyError(401, 'Invalid API key')
  }

  return {
    userId: result.user_id!,
    plan: result.plan as ApiKeyContext['plan'],
    keyId: result.key_id!,
  }
}
