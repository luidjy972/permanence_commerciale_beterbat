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
    .from('prospect_projects')
    .select('*, commercials(name)')
    .eq('id', parseInt(id))
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Projet non trouvé.' }, { status: 404 })

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

  const allowedStatuses = ['nouveau', 'contact', 'devis', 'negociation', 'gagne', 'reporte', 'en_attente', 'annule']
  const allowedPriorities = ['low', 'medium', 'high']

  if (body.status && !allowedStatuses.includes(body.status as string)) {
    return NextResponse.json({ error: `Statut invalide. Valeurs acceptées : ${allowedStatuses.join(', ')}` }, { status: 400 })
  }

  if (body.priority && !allowedPriorities.includes(body.priority as string)) {
    return NextResponse.json({ error: `Priorité invalide. Valeurs acceptées : ${allowedPriorities.join(', ')}` }, { status: 400 })
  }

  const allowedFields = ['name', 'contact_name', 'contact_phone', 'contact_email', 'description', 'amount', 'status', 'priority', 'commercial_id', 'due_date']
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
  }

  // Auto-set closed_at when status changes to 'gagne'
  if (updates.status === 'gagne') {
    updates.closed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('prospect_projects')
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
    .from('prospect_projects')
    .delete()
    .eq('id', parseInt(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Projet de prospection supprimé.' })
}
