import { NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('commercials')
    .select('*')
    .eq('id', parseInt(id))
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Commercial non trouvé.' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const { id } = await params
  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const allowedFields = [
    'name', 'agency', 'phone', 'email',
    'is_active_in_planning', 'is_prospect', 'notes', 'position',
  ]
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('commercials')
    .update(updates)
    .eq('id', parseInt(id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const { id } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('commercials')
    .delete()
    .eq('id', parseInt(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Commercial supprimé.' })
}
