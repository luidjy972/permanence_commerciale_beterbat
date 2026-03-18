'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Commercial, Agency } from '@/lib/types'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  UserCheck,
  UserX,
  Loader2,
  Phone,
  Mail,
  Building,
  StickyNote,
} from 'lucide-react'

export default function CommercialsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [commercials, setCommercials] = useState<Commercial[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'prospect'>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Commercial>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCommercial, setNewCommercial] = useState<Partial<Commercial>>({
    name: '', agency: '', phone: '', email: '', is_active_in_planning: true, is_prospect: false, notes: '',
  })
  const [status, setStatus] = useState('')

  const loadCommercials = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('commercials')
      .select('*')
      .order('position', { ascending: true })

    if (data) setCommercials(data)
    if (error) console.error(error)

    const { data: agencyData } = await supabase
      .from('agencies')
      .select('*')
      .order('name', { ascending: true })

    if (agencyData) setAgencies(agencyData)

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadCommercials()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = commercials.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.agency.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())

    if (!matchSearch) return false
    if (filter === 'active') return c.is_active_in_planning !== false
    if (filter === 'inactive') return c.is_active_in_planning === false
    if (filter === 'prospect') return c.is_prospect === true
    return true
  })

  const addCommercial = async () => {
    if (!newCommercial.name?.trim()) {
      setStatus('Le nom est obligatoire.')
      return
    }

    const position = commercials.length
    const { error } = await supabase.from('commercials').insert({
      name: newCommercial.name!.trim(),
      agency: newCommercial.agency || '',
      phone: newCommercial.phone || '',
      email: newCommercial.email || '',
      is_active_in_planning: newCommercial.is_active_in_planning ?? true,
      is_prospect: newCommercial.is_prospect ?? false,
      notes: newCommercial.notes || '',
      position,
    })

    if (error) {
      setStatus('Erreur lors de l\'ajout.')
      console.error(error)
      return
    }

    setNewCommercial({ name: '', agency: '', phone: '', email: '', is_active_in_planning: true, is_prospect: false, notes: '' })
    setShowAddForm(false)
    setStatus('Commercial ajouté.')
    loadCommercials()
  }

  const startEdit = (c: Commercial) => {
    setEditingId(c.id!)
    setEditData({ ...c })
  }

  const saveEdit = async () => {
    if (!editData.name?.trim()) {
      setStatus('Le nom est obligatoire.')
      return
    }

    const { error } = await supabase.from('commercials').update({
      name: editData.name!.trim(),
      agency: editData.agency || '',
      phone: editData.phone || '',
      email: editData.email || '',
      is_active_in_planning: editData.is_active_in_planning ?? true,
      is_prospect: editData.is_prospect ?? false,
      notes: editData.notes || '',
    }).eq('id', editingId)

    if (error) {
      setStatus('Erreur lors de la mise à jour.')
      console.error(error)
      return
    }

    setEditingId(null)
    setEditData({})
    setStatus('Commercial mis à jour.')
    loadCommercials()
  }

  const deleteCommercial = async (id: number) => {
    if (!confirm('Supprimer ce commercial ?')) return

    const { error } = await supabase.from('commercials').delete().eq('id', id)
    if (error) {
      setStatus('Erreur lors de la suppression.')
      console.error(error)
      return
    }

    setStatus('Commercial supprimé.')
    loadCommercials()
  }

  const togglePlanning = async (c: Commercial) => {
    const newValue = !(c.is_active_in_planning !== false)
    const { error } = await supabase
      .from('commercials')
      .update({ is_active_in_planning: newValue })
      .eq('id', c.id)

    if (error) {
      console.error(error)
      return
    }
    loadCommercials()
  }

  const toggleProspect = async (c: Commercial) => {
    const newValue = !(c.is_prospect === true)
    const { error } = await supabase
      .from('commercials')
      .update({ is_prospect: newValue })
      .eq('id', c.id)

    if (error) {
      console.error(error)
      return
    }
    loadCommercials()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    )
  }

  const activeCount = commercials.filter(c => c.is_active_in_planning !== false).length
  const prospectCount = commercials.filter(c => c.is_prospect === true).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Users className="h-7 w-7 text-blue-500" />
            Gestion des commerciaux
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {commercials.length} commerciaux • {activeCount} actifs au planning • {prospectCount} prospects
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
        >
          <Plus className="h-4 w-4" />
          Ajouter un commercial
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
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Nouveau commercial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nom *</label>
              <input
                type="text"
                value={newCommercial.name || ''}
                onChange={(e) => setNewCommercial({ ...newCommercial, name: e.target.value })}
                className="input-field"
                placeholder="Nom du commercial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Agence</label>
              <select
                value={newCommercial.agency || ''}
                onChange={(e) => setNewCommercial({ ...newCommercial, agency: e.target.value })}
                className="input-field"
              >
                <option value="">— Aucune agence —</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Téléphone</label>
              <input
                type="tel"
                value={newCommercial.phone || ''}
                onChange={(e) => setNewCommercial({ ...newCommercial, phone: e.target.value })}
                className="input-field"
                placeholder="0696 XX XX XX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
              <input
                type="email"
                value={newCommercial.email || ''}
                onChange={(e) => setNewCommercial({ ...newCommercial, email: e.target.value })}
                className="input-field"
                placeholder="email@exemple.com"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Notes</label>
            <textarea
              value={newCommercial.notes || ''}
              onChange={(e) => setNewCommercial({ ...newCommercial, notes: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="Notes, commentaires..."
            />
          </div>
          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newCommercial.is_active_in_planning ?? true}
                onChange={(e) => setNewCommercial({ ...newCommercial, is_active_in_planning: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>Actif dans le planning</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newCommercial.is_prospect ?? false}
                onChange={(e) => setNewCommercial({ ...newCommercial, is_prospect: e.target.checked })}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>Prospect</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addCommercial}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
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

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Rechercher un commercial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'prospect'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? '' : ''}`}
              style={filter === f
                ? { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }
                : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
              }
            >
              {f === 'all' && 'Tous'}
              {f === 'active' && 'Actifs'}
              {f === 'inactive' && 'Inactifs'}
              {f === 'prospect' && 'Prospects'}
            </button>
          ))}
        </div>
      </div>

      {/* Commercial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const isEditing = editingId === c.id

          if (isEditing) {
            return (
              <div key={c.id} className="card p-5" style={{ borderColor: '#3b82f6', borderWidth: '2px' }}>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="input-field"
                    placeholder="Nom"
                  />
                  <select
                    value={editData.agency || ''}
                    onChange={(e) => setEditData({ ...editData, agency: e.target.value })}
                    className="input-field"
                  >
                    <option value="">— Aucune agence —</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="input-field"
                    placeholder="Téléphone"
                  />
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="input-field"
                    placeholder="Email"
                  />
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="Notes"
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editData.is_active_in_planning ?? true}
                        onChange={(e) => setEditData({ ...editData, is_active_in_planning: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Actif</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editData.is_prospect ?? false}
                        onChange={(e) => setEditData({ ...editData, is_prospect: e.target.checked })}
                        className="rounded border-slate-300 text-orange-600"
                      />
                      <span>Prospect</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="btn-primary text-xs !px-3 !py-1.5"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
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
            <div key={c.id} className="card p-5 transition-all hover:scale-[1.01]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.name}</h3>
                  {c.agency && (
                    <div className="flex items-center gap-1 text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      <Building className="h-3 w-3" />
                      {c.agency}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCommercial(c.id!)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {c.phone && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                    {c.phone}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Mail className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                    {c.email}
                  </div>
                )}
                {c.notes && (
                  <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    <StickyNote className="h-3.5 w-3.5 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
                    <span className="line-clamp-2">{c.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => togglePlanning(c)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    c.is_active_in_planning !== false
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {c.is_active_in_planning !== false ? (
                    <UserCheck className="h-3 w-3" />
                  ) : (
                    <UserX className="h-3 w-3" />
                  )}
                  {c.is_active_in_planning !== false ? 'Actif planning' : 'Inactif planning'}
                </button>
                <button
                  onClick={() => toggleProspect(c)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    c.is_prospect
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {c.is_prospect ? 'Prospect' : 'Non prospect'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>Aucun commercial trouvé</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Ajoutez un commercial ou modifiez vos filtres.</p>
        </div>
      )}
    </div>
  )
}
