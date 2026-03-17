'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Commercial, ProspectProject, ProspectionObjectives, ProjectStatus, ProjectPriority } from '@/lib/types'
import {
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
  BarChart3,
  Plus,
  MoreHorizontal,
  User,
  Loader2,
  Edit2,
  Trash2,
  Check,
  X,
  ArrowRight,
  Save,
  PauseCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building,
  Phone,
  Mail,
} from 'lucide-react'

const PIPELINE_STAGES: { key: ProjectStatus; name: string; color: string; lightColor: string; textColor: string }[] = [
  { key: 'nouveau', name: 'Nouveau', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { key: 'contact', name: 'Contact établi', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
  { key: 'devis', name: 'Devis envoyé', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  { key: 'negociation', name: 'Négociation', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-700' },
  { key: 'gagne', name: 'Gagné', color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-700' },
]

const SECONDARY_STATUSES: { key: ProjectStatus; name: string; icon: any; color: string; lightColor: string; textColor: string }[] = [
  { key: 'reporte', name: 'Reporté', icon: Clock, color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
  { key: 'en_attente', name: 'En attente', icon: PauseCircle, color: 'bg-slate-500', lightColor: 'bg-slate-100', textColor: 'text-slate-700' },
  { key: 'annule', name: 'Annulé', icon: XCircle, color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700' },
]

const ALL_STATUSES: { key: ProjectStatus; name: string }[] = [
  ...PIPELINE_STAGES.map(s => ({ key: s.key, name: s.name })),
  ...SECONDARY_STATUSES.map(s => ({ key: s.key, name: s.name })),
]

function formatMoney(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))
}

export default function ProspectionPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<ProspectProject[]>([])
  const [commercials, setCommercials] = useState<Commercial[]>([])
  const [objectives, setObjectives] = useState<ProspectionObjectives | null>(null)

  // Forms
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<ProspectProject>>({})
  const [showObjectivesForm, setShowObjectivesForm] = useState(false)
  const [objForm, setObjForm] = useState<Partial<ProspectionObjectives>>({})
  const [newProject, setNewProject] = useState<Partial<ProspectProject>>({
    name: '', contact_name: '', contact_phone: '', contact_email: '', description: '',
    amount: 0, status: 'nouveau', priority: 'medium', commercial_id: null, due_date: null,
  })
  const [status, setStatus] = useState('')
  const [statusError, setStatusError] = useState(false)
  const [showSecondary, setShowSecondary] = useState(true)

  const showMsg = (msg: string, isError = false) => {
    setStatus(msg)
    setStatusError(isError)
    setTimeout(() => setStatus(''), 4000)
  }

  const prospectCommercials = commercials.filter(c => c.is_prospect === true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: projs }, { data: coms }, { data: objs }] = await Promise.all([
        supabase.from('prospect_projects').select('*, commercials(id, name, agency)').order('created_at', { ascending: false }),
        supabase.from('commercials').select('*').order('position', { ascending: true }),
        supabase.from('prospection_objectives').select('*').eq('id', 1).maybeSingle(),
      ])
      if (projs) setProjects(projs)
      if (coms) setCommercials(coms)
      if (objs) setObjectives(objs)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- CRUD ----

  const addProject = async () => {
    if (!newProject.name?.trim()) { showMsg('Le nom du projet est obligatoire.', true); return }
    const { error } = await supabase.from('prospect_projects').insert({
      name: newProject.name!.trim(),
      contact_name: newProject.contact_name || '',
      contact_phone: newProject.contact_phone || '',
      contact_email: newProject.contact_email || '',
      description: newProject.description || '',
      amount: newProject.amount || 0,
      status: newProject.status || 'nouveau',
      priority: newProject.priority || 'medium',
      commercial_id: newProject.commercial_id || null,
      due_date: newProject.due_date || null,
    })
    if (error) { showMsg('Erreur lors de l\'ajout.', true); console.error(error); return }
    setNewProject({ name: '', contact_name: '', contact_phone: '', contact_email: '', description: '', amount: 0, status: 'nouveau', priority: 'medium', commercial_id: null, due_date: null })
    setShowAddForm(false)
    showMsg('Projet ajouté.')
    loadData()
  }

  const startEdit = (p: ProspectProject) => {
    setEditingId(p.id!)
    setEditData({ ...p })
  }

  const saveEdit = async () => {
    if (!editData.name?.trim()) { showMsg('Le nom est obligatoire.', true); return }
    const { error } = await supabase.from('prospect_projects').update({
      name: editData.name!.trim(),
      contact_name: editData.contact_name || '',
      contact_phone: editData.contact_phone || '',
      contact_email: editData.contact_email || '',
      description: editData.description || '',
      amount: editData.amount || 0,
      status: editData.status || 'nouveau',
      priority: editData.priority || 'medium',
      commercial_id: editData.commercial_id || null,
      due_date: editData.due_date || null,
      closed_at: editData.status === 'gagne' ? new Date().toISOString() : null,
    }).eq('id', editingId)
    if (error) { showMsg('Erreur lors de la mise à jour.', true); console.error(error); return }
    setEditingId(null)
    setEditData({})
    showMsg('Projet mis à jour.')
    loadData()
  }

  const deleteProject = async (id: number) => {
    if (!confirm('Supprimer ce projet ?')) return
    const { error } = await supabase.from('prospect_projects').delete().eq('id', id)
    if (error) { showMsg('Erreur.', true); return }
    showMsg('Projet supprimé.')
    loadData()
  }

  const changeStatus = async (id: number, newStatus: ProjectStatus) => {
    const update: any = { status: newStatus }
    if (newStatus === 'gagne') update.closed_at = new Date().toISOString()
    else update.closed_at = null
    const { error } = await supabase.from('prospect_projects').update(update).eq('id', id)
    if (error) { console.error(error); return }
    loadData()
  }

  // ---- Objectives ----

  const openObjectives = () => {
    setObjForm(objectives ? { ...objectives } : {})
    setShowObjectivesForm(true)
  }

  const saveObjectives = async () => {
    const { error } = await supabase.from('prospection_objectives').upsert({
      id: 1,
      target_closed_contracts: objForm.target_closed_contracts || 0,
      target_revenue: objForm.target_revenue || 0,
      target_total_contract_price: objForm.target_total_contract_price || 0,
      contract_amount_1: objForm.contract_amount_1 ?? null,
      contract_amount_2: objForm.contract_amount_2 ?? null,
      contract_amount_3: objForm.contract_amount_3 ?? null,
      contract_amount_4: objForm.contract_amount_4 ?? null,
    }, { onConflict: 'id' })
    if (error) { showMsg('Erreur.', true); console.error(error); return }
    setShowObjectivesForm(false)
    showMsg('Objectifs enregistrés.')
    loadData()
  }

  // ---- Computed ----

  const activeProjects = projects.filter(p => !['gagne', 'annule'].includes(p.status))
  const wonProjects = projects.filter(p => p.status === 'gagne')
  const pipelineValue = activeProjects.reduce((s, p) => s + (p.amount || 0), 0)
  const wonValue = wonProjects.reduce((s, p) => s + (p.amount || 0), 0)
  const totalProjects = projects.filter(p => p.status !== 'annule').length
  const conversionRate = totalProjects > 0 ? Math.round((wonProjects.length / totalProjects) * 100) : 0

  const projectsByStage = (stageKey: ProjectStatus) => projects.filter(p => p.status === stageKey)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-success)' }} />
      </div>
    )
  }

  const renderProjectCard = (p: ProspectProject) => {
    if (editingId === p.id) {
      return (
        <div key={p.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid #3b82f6', boxShadow: 'var(--shadow-card)' }}>
          <div className="space-y-2">
            <input value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="input-field" placeholder="Nom du projet" />
            <input value={editData.contact_name || ''} onChange={e => setEditData({ ...editData, contact_name: e.target.value })}
              className="input-field" placeholder="Contact" />
            <div className="grid grid-cols-2 gap-2">
              <input value={editData.contact_phone || ''} onChange={e => setEditData({ ...editData, contact_phone: e.target.value })}
                className="input-field" placeholder="Téléphone" />
              <input value={editData.contact_email || ''} onChange={e => setEditData({ ...editData, contact_email: e.target.value })}
                className="input-field" placeholder="Email" />
            </div>
            <textarea value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })}
              className="input-field" rows={2} placeholder="Description" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={editData.amount || ''} onChange={e => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                className="input-field" placeholder="Montant €" />
              <input type="date" value={editData.due_date || ''} onChange={e => setEditData({ ...editData, due_date: e.target.value || null })}
                className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={editData.status || 'nouveau'} onChange={e => setEditData({ ...editData, status: e.target.value as ProjectStatus })}
                className="input-field">
                {ALL_STATUSES.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
              <select value={editData.priority || 'medium'} onChange={e => setEditData({ ...editData, priority: e.target.value as ProjectPriority })}
                className="input-field">
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            <select value={editData.commercial_id || ''} onChange={e => setEditData({ ...editData, commercial_id: e.target.value ? parseInt(e.target.value) : null })}
              className="input-field">
              <option value="">Aucun commercial assigné</option>
              {prospectCommercials.map(c => <option key={c.id} value={c.id}>{c.name} — {c.agency}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={saveEdit} className="btn-primary text-xs !px-3 !py-1.5" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              <Check className="h-3 w-3" /> Enregistrer
            </button>
            <button onClick={() => { setEditingId(null); setEditData({}) }} className="btn-secondary text-xs !px-3 !py-1.5">
              <X className="h-3 w-3" /> Annuler
            </button>
          </div>
        </div>
      )
    }

    const commercial = p.commercials as Commercial | undefined
    return (
      <div key={p.id} className="rounded-lg p-3 transition-shadow group" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-start justify-between mb-1.5">
          <h4 className="text-sm font-medium leading-tight pr-2" style={{ color: 'var(--color-text-primary)' }}>{p.name}</h4>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => startEdit(p)} className="p-1 text-slate-400 hover:text-blue-600 rounded"><Edit2 className="h-3.5 w-3.5" /></button>
            <button onClick={() => deleteProject(p.id!)} className="p-1 text-slate-400 hover:text-red-600 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {p.contact_name && (
          <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            <User className="h-3 w-3" /> {p.contact_name}
          </div>
        )}
        {commercial && (
          <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            <Building className="h-3 w-3" /> {commercial.name}
          </div>
        )}
        {p.description && (
          <p className="text-xs line-clamp-2 mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>{p.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatMoney(p.amount)}</span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{formatDate(p.due_date || p.created_at || null)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
            p.priority === 'high' ? 'bg-red-100 text-red-700' :
            p.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {p.priority === 'high' ? 'Haute' : p.priority === 'medium' ? 'Moyenne' : 'Basse'}
          </span>
          {/* Quick status actions */}
          <div className="flex gap-1">
            {p.status !== 'gagne' && p.status !== 'annule' && (
              <select
                value=""
                onChange={e => { if (e.target.value) changeStatus(p.id!, e.target.value as ProjectStatus) }}
                className="text-[10px] px-1 py-0.5 rounded outline-none" style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}
              >
                <option value="">Déplacer →</option>
                {ALL_STATUSES.filter(s => s.key !== p.status).map(s => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Objective progress
  const closedCount = wonProjects.length
  const objClosedTarget = objectives?.target_closed_contracts || 0
  const objRevenueTarget = objectives?.target_revenue || 0
  const objTotalPriceTarget = objectives?.target_total_contract_price || 0
  const closedProgress = objClosedTarget > 0 ? Math.min(100, Math.round((closedCount / objClosedTarget) * 100)) : 0
  const revenueProgress = objRevenueTarget > 0 ? Math.min(100, Math.round((wonValue / objRevenueTarget) * 100)) : 0
  const totalPipelineAndWon = pipelineValue + wonValue
  const totalPriceProgress = objTotalPriceTarget > 0 ? Math.min(100, Math.round((totalPipelineAndWon / objTotalPriceTarget) * 100)) : 0

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <TrendingUp className="h-7 w-7 text-green-500 shrink-0" />
            <span className="truncate">Prospection</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {prospectCommercials.length} commercial(aux) prospect(s) • {activeProjects.length} projets actifs
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={openObjectives}
            className="btn-secondary">
            <Target className="h-4 w-4" /> Objectifs
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 2px 8px rgba(34,197,94,0.25)' }}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nouveau</span> projet
          </button>
        </div>
      </div>

      {status && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm`}
          style={statusError
            ? { backgroundColor: 'var(--color-danger-light)', color: '#ef4444' }
            : { backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)' }
          }>
          {status}
        </div>
      )}

      {/* Objectives Form Modal */}
      {showObjectivesForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Target className="h-5 w-5 text-green-500" /> Définir les objectifs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Objectif contrats signés</label>
              <input type="number" min={0} value={objForm.target_closed_contracts || ''} onChange={e => setObjForm({ ...objForm, target_closed_contracts: parseInt(e.target.value) || 0 })}
                className="input-field" placeholder="Nombre" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Objectif chiffre d&apos;affaires (€)</label>
              <input type="number" min={0} value={objForm.target_revenue || ''} onChange={e => setObjForm({ ...objForm, target_revenue: parseFloat(e.target.value) || 0 })}
                className="input-field" placeholder="Montant €" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Objectif prix total contrats (€)</label>
              <input type="number" min={0} value={objForm.target_total_contract_price || ''} onChange={e => setObjForm({ ...objForm, target_total_contract_price: parseFloat(e.target.value) || 0 })}
                className="input-field" placeholder="Montant €" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Montants contrats (4 valeurs prédéfinies)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([1, 2, 3, 4] as const).map(n => (
                <input key={n} type="number" min={0}
                  value={(objForm as any)[`contract_amount_${n}`] ?? ''}
                  onChange={e => setObjForm({ ...objForm, [`contract_amount_${n}`]: e.target.value ? parseFloat(e.target.value) : null })}
                  className="input-field"
                  placeholder={`Montant ${n}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveObjectives} className="btn-primary" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 2px 8px rgba(34,197,94,0.25)' }}>
              <Save className="h-4 w-4" /> Enregistrer
            </button>
            <button onClick={() => setShowObjectivesForm(false)} className="btn-secondary">
              <X className="h-4 w-4" /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Add Project Form */}
      {showAddForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Nouveau projet de prospection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nom du projet *</label>
              <input type="text" value={newProject.name || ''} onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                className="input-field" placeholder="Ex: Résidence Les Palmiers" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Contact</label>
              <input type="text" value={newProject.contact_name || ''} onChange={e => setNewProject({ ...newProject, contact_name: e.target.value })}
                className="input-field" placeholder="Nom du contact" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Téléphone du contact</label>
              <input type="tel" value={newProject.contact_phone || ''} onChange={e => setNewProject({ ...newProject, contact_phone: e.target.value })}
                className="input-field" placeholder="0696 XX XX XX" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email du contact</label>
              <input type="email" value={newProject.contact_email || ''} onChange={e => setNewProject({ ...newProject, contact_email: e.target.value })}
                className="input-field" placeholder="contact@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Montant (€)</label>
              <div className="space-y-2">
                <input type="number" min={0} value={newProject.amount || ''} onChange={e => setNewProject({ ...newProject, amount: parseFloat(e.target.value) || 0 })}
                  className="input-field" placeholder="Montant" />
                {objectives && (objectives.contract_amount_1 || objectives.contract_amount_2 || objectives.contract_amount_3 || objectives.contract_amount_4) && (
                  <div className="flex flex-wrap gap-1">
                    {([1, 2, 3, 4] as const).map(n => {
                      const val = (objectives as any)[`contract_amount_${n}`]
                      return val ? (
                        <button key={n} type="button" onClick={() => setNewProject({ ...newProject, amount: val })}
                          className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 transition-colors border border-green-200">
                          {formatMoney(val)}
                        </button>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Date échéance</label>
              <input type="date" value={newProject.due_date || ''} onChange={e => setNewProject({ ...newProject, due_date: e.target.value || null })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Priorité</label>
              <select value={newProject.priority || 'medium'} onChange={e => setNewProject({ ...newProject, priority: e.target.value as ProjectPriority })}
                className="input-field">
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Commercial assigné</label>
              <select value={newProject.commercial_id || ''} onChange={e => setNewProject({ ...newProject, commercial_id: e.target.value ? parseInt(e.target.value) : null })}
                className="input-field">
                <option value="">Aucun</option>
                {prospectCommercials.map(c => <option key={c.id} value={c.id}>{c.name} — {c.agency}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea value={newProject.description || ''} onChange={e => setNewProject({ ...newProject, description: e.target.value })}
              className="input-field" rows={2} placeholder="Détails du projet..." />
          </div>
          <div className="flex gap-3">
            <button onClick={addProject} className="btn-primary" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 2px 8px rgba(34,197,94,0.25)' }}>
              <Check className="h-4 w-4" /> Ajouter
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">
              <X className="h-4 w-4" /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-500 p-2 rounded-lg"><Target className="h-5 w-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{activeProjects.length}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Projets actifs</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-500 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatMoney(pipelineValue)}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Valeur pipeline</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }} className="p-2 rounded-lg"><BarChart3 className="h-5 w-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{conversionRate}%</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Taux de conversion</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-emerald-500 p-2 rounded-lg"><CheckCircle2 className="h-5 w-5 text-white" /></div>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{wonProjects.length}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Contrats gagnés • {formatMoney(wonValue)}</p>
        </div>
      </div>

      {/* Objectives Progress */}
      {objectives && (objClosedTarget > 0 || objRevenueTarget > 0 || objTotalPriceTarget > 0) && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Target className="h-5 w-5 text-green-500" /> Progression des objectifs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {objClosedTarget > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Contrats signés</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{closedCount} / {objClosedTarget}</span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${closedProgress}%` }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{closedProgress}% atteint</p>
              </div>
            )}
            {objRevenueTarget > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Chiffre d&apos;affaires</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatMoney(wonValue)} / {formatMoney(objRevenueTarget)}</span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${revenueProgress}%` }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{revenueProgress}% atteint</p>
              </div>
            )}
            {objTotalPriceTarget > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Prix total contrats</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatMoney(totalPipelineAndWon)} / {formatMoney(objTotalPriceTarget)}</span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', width: `${totalPriceProgress}%` }} className="h-2.5 rounded-full transition-all" />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{totalPriceProgress}% atteint</p>
              </div>
            )}
          </div>

          {/* Contract amounts */}
          {(objectives.contract_amount_1 || objectives.contract_amount_2 || objectives.contract_amount_3 || objectives.contract_amount_4) && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Montants contrats prédéfinis</p>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 4] as const).map(n => {
                  const val = (objectives as any)[`contract_amount_${n}`]
                  return val ? (
                    <span key={n} className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--color-bg-card-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                      {formatMoney(val)}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Board */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>Pipeline</h2>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>{activeProjects.length} actifs</span>
            <span>•</span>
            <span>{formatMoney(pipelineValue)}</span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map(stage => {
            const stageProjects = projectsByStage(stage.key)
            const stageValue = stageProjects.reduce((s, p) => s + (p.amount || 0), 0)
            return (
              <div key={stage.key} className="flex-shrink-0 w-72">
                <div className={`${stage.lightColor} rounded-t-xl p-3 border border-b-0 border-slate-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                      <h3 className={`text-sm font-semibold ${stage.textColor}`}>{stage.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stage.lightColor} ${stage.textColor}`}>
                      {stageProjects.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{formatMoney(stageValue)}</p>
                  )}
                </div>
                <div className="border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[120px]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card-hover)' }}>
                  {stageProjects.map(p => renderProjectCard(p))}
                  {stageProjects.length === 0 && (
                    <div className="text-center py-6 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Aucun projet
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Secondary statuses: Reporté, En attente, Annulé */}
      <div className="card p-6 mb-6">
        <button onClick={() => setShowSecondary(!showSecondary)} className="flex items-center justify-between w-full">
          <h2 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            Reporté / En attente / Annulé
            <span className="text-sm font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
              ({projects.filter(p => ['reporte', 'en_attente', 'annule'].includes(p.status)).length})
            </span>
          </h2>
          {showSecondary ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {showSecondary && (
          <div className="flex gap-4 overflow-x-auto pb-4 mt-4">
            {SECONDARY_STATUSES.map(stage => {
              const stageProjects = projectsByStage(stage.key)
              return (
                <div key={stage.key} className="flex-shrink-0 w-72">
                  <div className={`${stage.lightColor} rounded-t-xl p-3 border border-b-0 border-slate-200`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stage.icon className={`h-4 w-4 ${stage.textColor}`} />
                        <h3 className={`text-sm font-semibold ${stage.textColor}`}>{stage.name}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stage.lightColor} ${stage.textColor}`}>
                        {stageProjects.length}
                      </span>
                    </div>
                  </div>
                  <div className="border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[80px]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card-hover)' }}>
                    {stageProjects.map(p => renderProjectCard(p))}
                    {stageProjects.length === 0 && (
                      <div className="text-center py-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Aucun projet</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Prospect Commercials overview */}
      {prospectCommercials.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Commerciaux en prospection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prospectCommercials.map(c => {
              const cProjects = projects.filter(p => p.commercial_id === c.id)
              const cWon = cProjects.filter(p => p.status === 'gagne')
              const cActive = cProjects.filter(p => !['gagne', 'annule'].includes(p.status))
              const cWonValue = cWon.reduce((s, p) => s + (p.amount || 0), 0)
              return (
                <div key={c.id} className="p-4 rounded-lg transition-shadow" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">
                      {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                      {c.agency && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{c.agency}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{cActive.length}</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>Actifs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-500">{cWon.length}</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>Gagnés</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatMoney(cWonValue)}</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>CA gagné</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {prospectCommercials.length === 0 && (
        <div className="card p-8 text-center mb-6">
          <User className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Aucun commercial marqué comme prospect</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Allez dans Gestion des commerciaux et activez le statut &quot;Prospect&quot; pour voir vos commerciaux ici.
          </p>
        </div>
      )}
    </div>
  )
}
