import { NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { buildPlanning } from '@/lib/planning'

export async function POST(request: Request) {
  const auth = await validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  const supabase = createServiceClient()

  // Get current state for defaults
  const { data: currentState } = await supabase
    .from('planning_state')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  // Parse body for optional overrides
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // No body provided — use defaults
  }

  const weekStart = (body.week_start as string) ?? currentState?.week_start ?? new Date().toISOString().slice(0, 10)
  const planningWeeks = (body.planning_weeks as number) ?? currentState?.planning_weeks ?? 12
  const startIndex = (body.start_index as number) ?? currentState?.start_index ?? 0
  const rotationMode = (body.rotation_mode as 'weekly' | 'monthly') ?? currentState?.rotation_mode ?? 'weekly'

  // Get active commercials
  const { data: commercials } = await supabase
    .from('commercials')
    .select('*')
    .eq('is_active_in_planning', true)
    .order('position', { ascending: true })

  if (!commercials?.length) {
    return NextResponse.json(
      { error: 'Aucun commercial actif pour le planning.' },
      { status: 400 }
    )
  }

  const people = commercials.map((c) => c.name)
  const planning = buildPlanning(weekStart, people, startIndex, planningWeeks, rotationMode)

  // Save to database
  const { error: saveError } = await supabase
    .from('planning_state')
    .upsert(
      {
        id: 1,
        week_start: weekStart,
        planning_weeks: planningWeeks,
        start_index: startIndex,
        rotation_mode: rotationMode,
        planning_data: planning,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Planning généré avec succès.',
    parameters: {
      week_start: weekStart,
      planning_weeks: planningWeeks,
      start_index: startIndex,
      rotation_mode: rotationMode,
    },
    commercials_count: people.length,
    weeks_generated: planning.length,
    data: planning,
  })
}
