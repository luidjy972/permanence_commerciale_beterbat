import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureAssistantApiKey } from '@/lib/assistant-key'
import OpenAI from 'openai'
import { getAssistantSystemPrompt, getAssistantTools } from '@/lib/assistant-docs'
import type { SupabaseClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ---- Tool execution: uses authenticated Supabase client ----
async function executeTool(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
): Promise<{ result: unknown; editRecord?: EditRecord }> {

  switch (name) {
    // ===== COMMERCIALS =====
    case 'list_commercials': {
      let query = supabase.from('commercials').select('*').order('position')
      if (args.active_only) query = query.eq('is_active_in_planning', true)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return { result: data }
    }
    case 'get_commercial': {
      const { data, error } = await supabase.from('commercials').select('*').eq('id', args.id).single()
      if (error) throw new Error(error.message)
      return { result: data }
    }
    case 'create_commercial': {
      const { data, error } = await supabase.from('commercials').insert(args).select().single()
      if (error) throw new Error(error.message)
      return {
        result: data,
        editRecord: { type: 'create', table: 'commercials', record_id: data.id, new_data: data },
      }
    }
    case 'update_commercial': {
      const id = args.id
      const updates = { ...args }
      delete updates.id
      // Snapshot before update
      const { data: before } = await supabase.from('commercials').select('*').eq('id', id).single()
      const { data, error } = await supabase.from('commercials').update(updates).eq('id', id).select().single()
      if (error) throw new Error(error.message)
      return {
        result: data,
        editRecord: { type: 'update', table: 'commercials', record_id: data.id, previous_data: before, new_data: data },
      }
    }
    case 'delete_commercial': {
      const { data: before } = await supabase.from('commercials').select('*').eq('id', args.id).single()
      const { error } = await supabase.from('commercials').delete().eq('id', args.id)
      if (error) throw new Error(error.message)
      return {
        result: { message: 'Commercial supprimé', id: args.id },
        editRecord: { type: 'delete', table: 'commercials', record_id: args.id as number, previous_data: before },
      }
    }

    // ===== PLANNING =====
    case 'get_planning': {
      const { data, error } = await supabase.from('planning_state').select('*').eq('id', 1).single()
      if (error) throw new Error(error.message)
      return { result: data }
    }
    case 'generate_planning': {
      // Get current state for snapshot
      const { data: before } = await supabase.from('planning_state').select('*').eq('id', 1).single()
      // Get active commercials
      const { data: commercials } = await supabase
        .from('commercials')
        .select('*')
        .eq('is_active_in_planning', true)
        .order('position')
      if (!commercials || commercials.length === 0) throw new Error('Aucun commercial actif trouvé')

      const { buildPlanning, getDefaultMonday } = await import('@/lib/planning')
      const weekStart = (args.week_start as string) || before?.week_start || getDefaultMonday()
      const planningWeeks = (args.planning_weeks as number) || before?.planning_weeks || 12
      const startIndex = (args.start_index as number) ?? before?.start_index ?? 0
      const rotationMode = (args.rotation_mode as string) || before?.rotation_mode || 'weekly'

      const people = commercials.map((c) => c.name)
      const planningData = buildPlanning(weekStart, people, startIndex, planningWeeks, rotationMode as 'weekly' | 'monthly')

      const stateRow = {
        id: 1,
        week_start: weekStart,
        planning_weeks: planningWeeks,
        start_index: startIndex,
        rotation_mode: rotationMode,
        planning_data: planningData,
        updated_at: new Date().toISOString(),
      }
      const { data: saved, error } = await supabase.from('planning_state').upsert(stateRow).select().single()
      if (error) throw new Error(error.message)
      return {
        result: { message: 'Planning généré avec succès', parameters: { week_start: weekStart, planning_weeks: planningWeeks, start_index: startIndex, rotation_mode: rotationMode }, weeks: planningData.length },
        editRecord: { type: 'update', table: 'planning_state', record_id: 1, previous_data: before, new_data: saved },
      }
    }

    // ===== PROSPECT PROJECTS =====
    case 'list_prospect_projects': {
      let query = supabase.from('prospect_projects').select('*, commercials(name)').order('created_at', { ascending: false })
      if (args.status) query = query.eq('status', args.status)
      if (args.commercial_id) query = query.eq('commercial_id', args.commercial_id)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return { result: data }
    }
    case 'create_prospect_project': {
      const { data, error } = await supabase.from('prospect_projects').insert(args).select().single()
      if (error) throw new Error(error.message)
      return {
        result: data,
        editRecord: { type: 'create', table: 'prospect_projects', record_id: data.id, new_data: data },
      }
    }
    case 'update_prospect_project': {
      const id = args.id
      const updates = { ...args }
      delete updates.id
      if (updates.status === 'gagne' && !updates.closed_at) {
        updates.closed_at = new Date().toISOString()
      }
      const { data: before } = await supabase.from('prospect_projects').select('*').eq('id', id).single()
      const { data, error } = await supabase.from('prospect_projects').update(updates).eq('id', id).select().single()
      if (error) throw new Error(error.message)
      return {
        result: data,
        editRecord: { type: 'update', table: 'prospect_projects', record_id: data.id, previous_data: before, new_data: data },
      }
    }
    case 'delete_prospect_project': {
      const { data: before } = await supabase.from('prospect_projects').select('*').eq('id', args.id).single()
      const { error } = await supabase.from('prospect_projects').delete().eq('id', args.id)
      if (error) throw new Error(error.message)
      return {
        result: { message: 'Projet supprimé', id: args.id },
        editRecord: { type: 'delete', table: 'prospect_projects', record_id: args.id as number, previous_data: before },
      }
    }

    // ===== PROSPECTION OBJECTIVES =====
    case 'get_prospection_objectives': {
      const { data, error } = await supabase.from('prospection_objectives').select('*').eq('id', 1).single()
      if (error) throw new Error(error.message)
      return { result: data }
    }
    case 'update_prospection_objectives': {
      const { data: before } = await supabase.from('prospection_objectives').select('*').eq('id', 1).single()
      const { data, error } = await supabase.from('prospection_objectives').update(args).eq('id', 1).select().single()
      if (error) throw new Error(error.message)
      return {
        result: data,
        editRecord: { type: 'update', table: 'prospection_objectives', record_id: 1, previous_data: before, new_data: data },
      }
    }

    default:
      throw new Error(`Fonction inconnue: ${name}`)
  }
}

interface EditRecord {
  type: 'create' | 'update' | 'delete'
  table: string
  record_id: number
  previous_data?: unknown
  new_data?: unknown
}

export async function POST(request: Request) {
  try {
    const { messages, editHistory = [] } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    // Use authenticated server client (user's session via cookies)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous reconnecter.' }, { status: 401 })
    }

    // Auto-provision a dedicated API key for the assistant (first-time only)
    try {
      await ensureAssistantApiKey()
    } catch {
      // Non-blocking: the key is for audit only, operations work without it
    }

    const baseUrl = new URL(request.url).origin
    const systemPrompt = getAssistantSystemPrompt(baseUrl)
    const tools = getAssistantTools()

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ]

    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: allMessages,
      tools,
      tool_choice: 'auto',
    })

    const newEdits: EditRecord[] = []
    let assistantMessage = response.choices[0].message

    // Process tool calls in a loop (the model may chain multiple)
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      allMessages.push(assistantMessage)

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') continue
        const fnName = toolCall.function.name
        let fnArgs: Record<string, unknown>
        try {
          fnArgs = JSON.parse(toolCall.function.arguments)
        } catch {
          fnArgs = {}
        }

        let toolResult: string
        try {
          const { result, editRecord } = await executeTool(supabase, fnName, fnArgs)
          if (editRecord) newEdits.push(editRecord)
          toolResult = JSON.stringify(result)
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erreur inconnue'
          toolResult = JSON.stringify({ error: message })
        }

        allMessages.push({
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: toolResult,
        })
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: allMessages,
        tools,
        tool_choice: 'auto',
      })
      assistantMessage = response.choices[0].message
    }

    // Build updated edit history
    const updatedHistory = [
      ...editHistory,
      ...newEdits.map((edit) => ({
        ...edit,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID(),
      })),
    ]

    return NextResponse.json({
      message: assistantMessage.content,
      editHistory: updatedHistory,
    })
  } catch (err: unknown) {
    console.error('Assistant error:', err)
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
