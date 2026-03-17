import { NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('planning_state')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
