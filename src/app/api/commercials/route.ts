import { NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const supabase = createServiceClient()
  const url = new URL(request.url)
  const activeOnly = url.searchParams.get('active') === 'true'

  let query = supabase.from('commercials').select('*').order('position', { ascending: true })
  if (activeOnly) {
    query = query.eq('is_active_in_planning', true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Le champ "name" est obligatoire.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('commercials')
    .insert({
      name: (body.name as string).trim(),
      agency: (body.agency as string) ?? '',
      phone: (body.phone as string) ?? '',
      email: (body.email as string) ?? '',
      is_active_in_planning: body.is_active_in_planning ?? true,
      is_prospect: body.is_prospect ?? false,
      notes: (body.notes as string) ?? '',
      position: (body.position as number) ?? 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
