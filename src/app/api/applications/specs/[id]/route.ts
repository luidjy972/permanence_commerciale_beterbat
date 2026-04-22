import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()

    const { id } = await params
    const { data, error } = await supabase
      .from('app_specifications')
      .select('*')
      .eq('id', parseInt(id, 10))
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()

    const { id } = await params
    const { error } = await supabase
      .from('app_specifications')
      .delete()
      .eq('id', parseInt(id, 10))
    if (error) throw new Error(error.message)
    return NextResponse.json({ message: 'Spécification supprimée' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
