'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agency } from '@/lib/types'
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Loader2,
  Phone,
  MapPin,
  Users,
} from 'lucide-react'

export default function AgenciesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [commercialCounts, setCommercialCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Agency>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAgency, setNewAgency] = useState<Partial<Agency>>({
    name: '', address: '', phone: '',
  })
  const [status, setStatus] = useState('')

  const loadAgencies = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('name', { ascending: true })

    if (data) setAgencies(data)
    if (error) console.error(error)

    // Load commercial counts per agency
    const { data: commercials } = await supabase
      .from('commercials')
      .select('agency')

    if (commercials) {
      const counts: Record<string, number> = {}
      commercials.forEach((c: { agency: string }) => {
        if (c.agency) {
          counts[c.agency] = (counts[c.agency] || 0) + 1
        }
      })
      setCommercialCounts(counts)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadAgencies()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = agencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.address || '').toLowerCase().includes(search.toLowerCase())
  )

  const addAgency = async () => {
    if (!newAgency.name?.trim()) {
      setStatus('Le nom est obligatoire.')
      return
    }

    const { error } = await supabase.from('agencies').insert({
      name: newAgency.name!.trim(),
      address: newAgency.address || '',
      phone: newAgency.phone || '',
    })

    if (error) {
      if (error.code === '23505') {
        setStatus('Une agence avec ce nom existe déjà.')
      } else {
        setStatus('Erreur lors de l\'ajout.')
      }
      console.error(error)
      return
    }

    setNewAgency({ name: '', address: '', phone: '' })
    setShowAddForm(false)
    setStatus('Agence ajoutée.')
    loadAgencies()
  }

  const startEdit = (a: Agency) => {
    setEditingId(a.id!)
    setEditData({ ...a })
  }

  const saveEdit = async () => {
    if (!editData.name?.trim()) {
      setStatus('Le nom est obligatoire.')
      return
    }

    // Get old agency name to update commercials
    const oldAgency = agencies.find(a => a.id === editingId)
    const oldName = oldAgency?.name

    const { error } = await supabase.from('agencies').update({
      name: editData.name!.trim(),
      address: editData.address || '',
      phone: editData.phone || '',
    }).eq('id', editingId)

    if (error) {
      if (error.code === '23505') {
        setStatus('Une agence avec ce nom existe déjà.')
      } else {
        setStatus('Erreur lors de la mise à jour.')
      }
      console.error(error)
      return
    }

    // Update commercials referencing the old agency name
    if (oldName && oldName !== editData.name!.trim()) {
      await supabase
        .from('commercials')
        .update({ agency: editData.name!.trim() })
        .eq('agency', oldName)
    }

    setEditingId(null)
    setEditData({})
    setStatus('Agence mise à jour.')
    loadAgencies()
  }

  const deleteAgency = async (id: number) => {
    const agency = agencies.find(a => a.id === id)
    const count = agency ? (commercialCounts[agency.name] || 0) : 0

    const message = count > 0
      ? `Cette agence est attribuée à ${count} commercial(aux). Supprimer quand même ? Les commerciaux concernés n'auront plus d'agence.`
      : 'Supprimer cette agence ?'

    if (!confirm(message)) return

    // Clear agency from commercials
    if (agency && count > 0) {
      await supabase
        .from('commercials')
        .update({ agency: '' })
        .eq('agency', agency.name)
    }

    const { error } = await supabase.from('agencies').delete().eq('id', id)
    if (error) {
      setStatus('Erreur lors de la suppression.')
      console.error(error)
      return
    }

    setStatus('Agence supprimée.')
    loadAgencies()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Building className="h-7 w-7 text-purple-500" />
            Gestion des agences
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {agencies.length} agence{agencies.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
        >
          <Plus className="h-4 w-4" />
          Ajouter une agence
        </button>
      </div>

      {status && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)' }}>
          {status}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Nouvelle agence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nom *</label>
              <input
                type="text"
                value={newAgency.name || ''}
                onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                className="input-field"
                placeholder="Nom de l'agence"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Adresse</label>
              <input
                type="text"
                value={newAgency.address || ''}
                onChange={(e) => setNewAgency({ ...newAgency, address: e.target.value })}
                className="input-field"
                placeholder="Adresse"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Téléphone</label>
              <input
                type="tel"
                value={newAgency.phone || ''}
                onChange={(e) => setNewAgency({ ...newAgency, phone: e.target.value })}
                className="input-field"
                placeholder="0596 XX XX XX"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addAgency}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              <Check className="h-4 w-4" />
              Ajouter
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
            >
              <X className="h-4 w-4" />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Rechercher une agence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Agency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => {
          const isEditing = editingId === a.id
          const count = commercialCounts[a.name] || 0

          if (isEditing) {
            return (
              <div key={a.id} className="card p-5" style={{ borderColor: '#8b5cf6', borderWidth: '2px' }}>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="input-field"
                    placeholder="Nom"
                  />
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="input-field"
                    placeholder="Adresse"
                  />
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="input-field"
                    placeholder="Téléphone"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="btn-primary text-xs !px-3 !py-1.5"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                  >
                    <Check className="h-3 w-3" /> Enregistrer
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditData({}) }}
                    className="btn-secondary text-xs !px-3 !py-1.5"
                  >
                    <X className="h-3 w-3" /> Annuler
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div key={a.id} className="card p-5 transition-all hover:scale-[1.01]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{a.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(a)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteAgency(a.id!)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {a.address && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                    {a.address}
                  </div>
                )}
                {a.phone && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                    {a.phone}
                  </div>
                )}
              </div>

              <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Users className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                  {count} commercia{count > 1 ? 'ux' : 'l'} rattaché{count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Building className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>Aucune agence trouvée</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Ajoutez une agence ou modifiez votre recherche.</p>
        </div>
      )}
    </div>
  )
}
