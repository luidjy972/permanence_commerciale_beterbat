import { createHash, createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const ASSISTANT_KEY_NAME = 'Assistant IA Beterbat (auto)'

/**
 * Derives a deterministic API key from OPENAI_API_KEY.
 * Always produces the same key for the same OPENAI_API_KEY,
 * so the assistant's identity is stable across restarts.
 */
function deriveAssistantKey(): string {
  const secret = process.env.OPENAI_API_KEY
  if (!secret) throw new Error('OPENAI_API_KEY not configured')
  const hmac = createHmac('sha256', 'beterbat-assistant-internal-v1')
  hmac.update(secret)
  const derived = hmac.digest('hex')
  // Format: bbt_ast_ + 48 hex chars
  return `bbt_ast_${derived.slice(0, 48)}`
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Ensures the assistant's dedicated API key exists in the database.
 * Uses the current user's session (via cookies) for the insert.
 * Returns the raw API key string.
 */
export async function ensureAssistantApiKey(): Promise<string> {
  const rawKey = deriveAssistantKey()
  const keyHash = hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12)

  const supabase = await createClient()

  // Check if key already exists
  const { data: existing } = await supabase
    .from('api_keys')
    .select('id, is_active')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (existing) {
    // Re-activate if deactivated
    if (!existing.is_active) {
      await supabase
        .from('api_keys')
        .update({ is_active: true })
        .eq('id', existing.id)
    }
    return rawKey
  }

  // Create the key
  const { error } = await supabase.from('api_keys').insert({
    name: ASSISTANT_KEY_NAME,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    created_by: 'system',
    is_active: true,
  })

  if (error) {
    // If insert fails (e.g. duplicate from race condition), that's OK
    console.warn('Assistant key insert warning:', error.message)
  }

  return rawKey
}
