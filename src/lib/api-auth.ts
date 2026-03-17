import { createServiceClient } from '@/lib/supabase/service'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export async function validateApiKey(request: Request): Promise<{ valid: boolean; keyId?: number }> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false }
  }

  const apiKey = authHeader.slice(7)
  if (!apiKey || apiKey.length < 10) {
    return { valid: false }
  }

  const keyHash = hashApiKey(apiKey)
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) {
    return { valid: false }
  }

  // Update last_used_at asynchronously
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return { valid: true, keyId: data.id }
}

export function unauthorizedResponse(message = 'Clé API invalide ou manquante') {
  return NextResponse.json({ error: message }, { status: 401 })
}
