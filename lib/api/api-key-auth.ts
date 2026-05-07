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

  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id, user_id, plan, daily_limit, calls_today, last_reset_at')
    .eq('key_hash', keyHash)
    .single()

  if (!apiKey) {
    throw new ApiKeyError(401, 'Invalid API key')
  }

  // Reset daily counter if date has changed
  const today = new Date().toISOString().slice(0, 10)
  if (apiKey.last_reset_at < today) {
    await supabase
      .from('api_keys')
      .update({ calls_today: 0, last_reset_at: today })
      .eq('id', apiKey.id)
    apiKey.calls_today = 0
  }

  if (apiKey.calls_today >= apiKey.daily_limit) {
    throw new ApiKeyError(429, `Daily limit of ${apiKey.daily_limit} requests reached`)
  }

  // Increment usage (fire-and-forget, non-blocking)
  supabase
    .from('api_keys')
    .update({ calls_today: apiKey.calls_today + 1 })
    .eq('id', apiKey.id)
    .then(() => {})

  return {
    userId: apiKey.user_id,
    plan: apiKey.plan as ApiKeyContext['plan'],
    keyId: apiKey.id,
  }
}
