import { NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('prospection_objectives')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: Request) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const allowedFields = ['target_closed_contracts', 'target_revenue', 'target_total_contract_price', 'contract_amount_1', 'contract_amount_2', 'contract_amount_3', 'contract_amount_4']
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('prospection_objectives')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
