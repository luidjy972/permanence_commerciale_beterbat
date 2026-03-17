import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashApiKey } from '@/lib/api-auth'
import { randomBytes } from 'crypto'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_by, is_active, last_used_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const name = body.name as string | undefined
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Le nom de la clé est obligatoire.' }, { status: 400 })
  }

  // Generate a secure API key
  const rawKey = 'bp_' + randomBytes(32).toString('hex')
  const keyHash = hashApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12) + '...'

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
      created_by: user.email,
    })
    .select('id, name, key_prefix, created_by, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: { ...data, key: rawKey },
    message: 'Clé API créée. Copiez-la maintenant, elle ne sera plus affichée.',
  }, { status: 201 })
}
