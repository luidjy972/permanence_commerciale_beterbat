import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { edit } = await request.json()

    if (!edit || !edit.type || !edit.table || edit.record_id == null) {
      return NextResponse.json({ error: 'Données d\'annulation invalides' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const allowedTables = ['commercials', 'agencies', 'prospect_projects', 'prospection_objectives', 'planning_state']

    if (!allowedTables.includes(edit.table)) {
      return NextResponse.json({ error: 'Table non autorisée' }, { status: 400 })
    }

    switch (edit.type) {
      case 'create': {
        // Revert a creation = delete the record
        const { error } = await supabase.from(edit.table).delete().eq('id', edit.record_id)
        if (error) throw new Error(error.message)
        return NextResponse.json({ message: `Création annulée : enregistrement ${edit.record_id} supprimé de ${edit.table}` })
      }
      case 'update': {
        // Revert an update = restore previous data
        if (!edit.previous_data) {
          return NextResponse.json({ error: 'Pas de données précédentes pour restaurer' }, { status: 400 })
        }
        const restoreData = { ...edit.previous_data }
        delete restoreData.id // Don't try to update the primary key
        const { error } = await supabase.from(edit.table).update(restoreData).eq('id', edit.record_id)
        if (error) throw new Error(error.message)
        return NextResponse.json({ message: `Modification annulée : enregistrement ${edit.record_id} restauré dans ${edit.table}` })
      }
      case 'delete': {
        // Revert a deletion = re-insert the record
        if (!edit.previous_data) {
          return NextResponse.json({ error: 'Pas de données précédentes pour restaurer' }, { status: 400 })
        }
        const insertData = { ...edit.previous_data }
        // For tables with identity columns, we need to handle id carefully
        // Supabase GENERATED ALWAYS AS IDENTITY doesn't allow inserting with id
        if (edit.table === 'prospect_projects' || edit.table === 'agencies') {
          delete insertData.id
        }
        const { error } = await supabase.from(edit.table).insert(insertData)
        if (error) throw new Error(error.message)
        return NextResponse.json({ message: `Suppression annulée : enregistrement restauré dans ${edit.table}` })
      }
      default:
        return NextResponse.json({ error: `Type d'action inconnu: ${edit.type}` }, { status: 400 })
    }
  } catch (err: unknown) {
    console.error('Revert error:', err)
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
