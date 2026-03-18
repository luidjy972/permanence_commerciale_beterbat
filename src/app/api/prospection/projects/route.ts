import { NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('prospect_projects')
    .select('*, commercials(name)')
    .order('created_at', { ascending: false })

  const status = searchParams.get('status')
  if (status) query = query.eq('status', status)

  const commercialId = searchParams.get('commercial_id')
  if (commercialId) query = query.eq('commercial_id', parseInt(commercialId))

  const priority = searchParams.get('priority')
  if (priority) query = query.eq('priority', priority)

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

  const allowedStatuses = ['nouveau', 'contact', 'devis', 'negociation', 'gagne', 'reporte', 'en_attente', 'annule']
  const allowedPriorities = ['low', 'medium', 'high']

  if (body.status && !allowedStatuses.includes(body.status as string)) {
    return NextResponse.json({ error: `Statut invalide. Valeurs acceptées : ${allowedStatuses.join(', ')}` }, { status: 400 })
  }

  if (body.priority && !allowedPriorities.includes(body.priority as string)) {
    return NextResponse.json({ error: `Priorité invalide. Valeurs acceptées : ${allowedPriorities.join(', ')}` }, { status: 400 })
  }

  const insertData: Record<string, unknown> = {
    name: (body.name as string).trim(),
  }

  const optionalFields = ['contact_name', 'contact_phone', 'contact_email', 'description', 'amount', 'status', 'priority', 'commercial_id', 'due_date']
  for (const field of optionalFields) {
    if (body[field] !== undefined) insertData[field] = body[field]
  }

  const { data, error } = await supabase
    .from('prospect_projects')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
