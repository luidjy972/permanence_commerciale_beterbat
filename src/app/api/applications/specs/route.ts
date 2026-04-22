import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('app_specifications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()

    const body = await request.json()
    const { title, slug, description, spec_content, status } = body

    if (!title || !slug || !spec_content) {
      return NextResponse.json({ error: 'title, slug et spec_content sont requis' }, { status: 400 })
    }

    // Upsert by slug — allows updating an existing spec
    const { data, error } = await supabase
      .from('app_specifications')
      .upsert(
        {
          title,
          slug,
          description: description || null,
          spec_content,
          status: status || 'draft',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
