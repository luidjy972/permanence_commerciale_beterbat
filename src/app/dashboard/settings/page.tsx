'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  BookOpen,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { getApiDocumentation } from '@/lib/api-docs'

interface ApiKey {
  id: number
  name: string
  key_prefix: string
  created_by: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState('')

  const loadKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/keys')
      if (res.ok) {
        const json = await res.json()
        if (json.data) setKeys(json.data)
      }
    } catch (err) {
      console.error('Erreur chargement clés:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadKeys()
    setBaseUrl(window.location.origin)
  }, [loadKeys])

  const createKey = async () => {
    if (!newKeyName.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data?.key) {
          setCreatedKey(json.data.key)
          setNewKeyName('')
          loadKeys()
        }
      }
    } catch (err) {
      console.error('Erreur création clé:', err)
    }
    setCreating(false)
  }

  const deleteKey = async (id: number) => {
    if (!confirm('Supprimer cette clé API ? Cette action est irréversible.')) return
    try {
      await fetch(`/api/keys/${id}`, { method: 'DELETE' })
      loadKeys()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2500)
  }

  const copyDocsForAgent = async () => {
    const docs = getApiDocumentation(baseUrl)
    await copyText(docs, 'docs')
  }

  const formatDate = (d: string | null) => {
    if (!d) return 'Jamais'
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(d))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
          <KeyRound className="h-7 w-7" style={{ color: 'var(--color-accent)' }} />
          Paramètres API
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Gérez vos clés API et consultez la documentation pour connecter vos agents IA
        </p>
      </div>

      {/* ============ API Keys Section ============ */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4" style={{ backgroundColor: 'var(--color-table-header)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <KeyRound className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            Clés API
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Créez des clés pour permettre à vos agents IA d&apos;accéder au planning et aux commerciaux
          </p>
        </div>

        {/* Create form */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createKey()}
              placeholder="Nom de la clé (ex: Mon agent IA)"
              className="input-field flex-1"
            />
            <button
              onClick={createKey}
              disabled={!newKeyName.trim() || creating}
              className="btn-primary flex-shrink-0"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Créer une clé
            </button>
          </div>
        </div>

        {/* New key alert */}
        {createdKey && (
          <div className="mx-6 my-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-warning-light)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-500">
                  Copiez cette clé maintenant — elle ne sera plus affichée
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded text-sm font-mono break-all" style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--color-text-primary)' }}>
                    {createdKey}
                  </code>
                  <button
                    onClick={() => copyText(createdKey, 'newkey')}
                    className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 flex items-center gap-1.5 flex-shrink-0 transition-colors"
                  >
                    {copied === 'newkey' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === 'newkey' ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="text-amber-400 hover:text-amber-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8" style={{ color: 'var(--color-text-tertiary)' }}>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Chargement...
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-tertiary)' }}>
              <KeyRound className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Aucune clé API créée</p>
              <p className="text-sm mt-1">Créez votre première clé pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Clé</th>
                    <th className="pb-3 font-medium">Créée par</th>
                    <th className="pb-3 font-medium">Créée le</th>
                    <th className="pb-3 font-medium">Dernière utilisation</th>
                    <th className="pb-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border-light)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-table-row-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{key.name}</td>
                      <td className="py-3">
                        <code className="text-xs px-2 py-1 rounded font-mono" style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>
                          {key.key_prefix}
                        </code>
                      </td>
                      <td className="py-3" style={{ color: 'var(--color-text-secondary)' }}>{key.created_by}</td>
                      <td className="py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(key.created_at)}</td>
                      <td className="py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(key.last_used_at)}</td>
                      <td className="py-3">
                        <button
                          onClick={() => deleteKey(key.id)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--color-text-tertiary)' }}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============ API Documentation Section ============ */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: 'var(--color-table-header)', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <BookOpen className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              Documentation API
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Référence complète pour intégrer l&apos;API avec vos agents IA
            </p>
          </div>
          <button
            onClick={copyDocsForAgent}
            className="btn-primary"
          >
            {copied === 'docs' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied === 'docs' ? 'Copié !' : 'Copier pour agent'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Auth + Base URL */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Authentification
              </h3>
              <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-2 overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
                <code className="text-sm text-green-400 truncate min-w-0">
                  Authorization: Bearer <span className="text-amber-300">VOTRE_CLE</span>
                </code>
                <button
                  onClick={() => copyText('Authorization: Bearer VOTRE_CLE_API', 'auth')}
                  className="p-1 text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors"
                >
                  {copied === 'auth' ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                URL de base
              </h3>
              <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-2 overflow-hidden" style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}>
                <code className="text-sm font-mono truncate min-w-0" style={{ color: 'var(--color-text-primary)' }}>{baseUrl}/api</code>
                <button
                  onClick={() => copyText(`${baseUrl}/api`, 'baseurl')}
                  className="p-1 flex-shrink-0 transition-colors" style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {copied === 'baseurl' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Planning Endpoints */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400" />
              Planning
            </h3>
            <div className="space-y-3">
              <EndpointCard
                method="GET"
                path="/api/planning"
                description="Obtenir le planning actuel avec tous les paramètres et semaines générées"
                baseUrl={baseUrl}
                copied={copied}
                onCopy={copyText}
                example={`curl -X GET ${baseUrl || 'https://votre-domaine.com'}/api/planning \\
  -H "Authorization: Bearer VOTRE_CLE_API"`}
                response={`{
  "data": {
    "id": 1,
    "week_start": "2026-03-16",
    "planning_weeks": 12,
    "start_index": 0,
    "rotation_mode": "weekly",
    "planning_data": [
      {
        "weekIndex": 0,
        "weekNumber": 12,
        "weekStart": "2026-03-16",
        "weekEnd": "2026-03-20",
        "offPerson": "Jean Dupont",
        "activePeople": ["Marie Martin", "Pierre Bernard"],
        "entries": [
          {
            "dayLabel": "Lundi",
            "date": "2026-03-16",
            "shiftLabel": "Matin",
            "timeRange": "8H00 - 13H00",
            "assignee": "Marie Martin"
          }
        ]
      }
    ]
  }
}`}
              />
              <EndpointCard
                method="POST"
                path="/api/planning/generate"
                description="Générer un nouveau planning de rotation et l'enregistrer"
                baseUrl={baseUrl}
                copied={copied}
                onCopy={copyText}
                example={`curl -X POST ${baseUrl || 'https://votre-domaine.com'}/api/planning/generate \\
  -H "Authorization: Bearer VOTRE_CLE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "week_start": "2026-03-23",
    "planning_weeks": 12,
    "start_index": 0,
    "rotation_mode": "weekly"
  }'`}
                response={`{
  "message": "Planning généré avec succès.",
  "parameters": {
    "week_start": "2026-03-23",
    "planning_weeks": 12,
    "start_index": 0,
    "rotation_mode": "weekly"
  },
  "commercials_count": 6,
  "weeks_generated": 12,
  "data": [ ... ]
}`}
                params={[
                  { name: 'week_start', type: 'string (YYYY-MM-DD)', desc: 'Date du lundi de début' },
                  { name: 'planning_weeks', type: 'number (1-52)', desc: 'Nombre de semaines à planifier' },
                  { name: 'start_index', type: 'number', desc: 'Index du commercial commençant les repos' },
                  { name: 'rotation_mode', type: '"weekly" | "monthly"', desc: 'Mode de rotation des repos' },
                ]}
              />
            </div>
          </div>

          {/* Commercials Endpoints */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
              Commerciaux
            </h3>
            <div className="space-y-3">
              <EndpointCard
                method="GET"
                path="/api/commercials"
                description="Lister tous les commerciaux (filtrer avec ?active=true)"
                baseUrl={baseUrl}
                copied={copied}
                onCopy={copyText}
                example={`curl -X GET "${baseUrl || 'https://votre-domaine.com'}/api/commercials?active=true" \\
  -H "Authorization: Bearer VOTRE_CLE_API"`}
                response={`{
  "data": [
    {
      "id": 1,
      "name": "Jean Dupont",
      "agency": "Agence Nord",
      "phone": "0601020304",
      "email": "jean@example.com",
      "is_active_in_planning": true,
      "is_prospect": false,
      "notes": "",
      "position": 0
    }
  ]
}`}
              />
              <EndpointCard
                method="POST"
                path="/api/commercials"
                description="Ajouter un nouveau commercial"
                baseUrl={baseUrl}
                copied={copied}
                onCopy={copyText}
                example={`curl -X POST ${baseUrl || 'https://votre-domaine.com'}/api/commercials \\
  -H "Authorization: Bearer VOTRE_CLE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Nouveau Commercial",
    "agency": "Agence Sud",
    "phone": "0601020304",
    "email": "nouveau@example.com",
    "is_active_in_planning": true
  }'`}
                response={`{
  "data": {
    "id": 7,
    "name": "Nouveau Commercial",
    "agency": "Agence Sud",
    "phone": "0601020304",
    "email": "nouveau@example.com",
    "is_active_in_planning": true,
    "is_prospect": false,
    "notes": "",
    "position": 0
  }
}`}
                params={[
                  { name: 'name', type: 'string', desc: 'Nom du commercial (obligatoire)' },
                  { name: 'agency', type: 'string', desc: 'Agence' },
                  { name: 'phone', type: 'string', desc: 'Téléphone' },
                  { name: 'email', type: 'string', desc: 'Email' },
                  { name: 'is_active_in_planning', type: 'boolean', desc: 'Actif au planning (défaut: true)' },
                  { name: 'is_prospect', type: 'boolean', desc: 'Est prospect (défaut: false)' },
                  { name: 'notes', type: 'string', desc: 'Notes libres' },
                  { name: 'position', type: 'number', desc: "Ordre d'affichage (défaut: 0)" },
                ]}
              />
              <EndpointCard
                method="GET"
                path="/api/commercials/{id}"
                description="Obtenir un commercial par son ID"
                baseUrl={baseUrl}
                copied={copied}
                onCopy={copyText}
                example={`curl -X GET ${baseUrl || 'https://votre-domaine.com'}/api/commercials/1 \\
  -H "Authorization: Bearer VOTRE_CLE_API"`}
                response={`{
  "data": {
    "id": 1,
    "name": "Jean Dupont",
    "agency": "Agence Nord",
    "phone": "0601020304",
    "email": "jean@example.com",
    "is_active_in_planning": true,
    "is_prospect": false,
    "notes": "",
    "position": 0
  }
}`}
              />
              <EndpointCard
                method="PATCH"
                path="/api/commercials/{id}"
                description="Modifier un commercial (envoyer uniquement les champs à modifier)"
                baseUrl={baseUrl}
                copied={copied}
                onCopy={copyText}
                example={`curl -X PATCH ${baseUrl || 'https://votre-domaine.com'}/api/commercials/1 \\
  -H "Authorization: Bearer VOTRE_CLE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "is_active_in_planning": false,
    "notes": "En congé jusqu'\\''au 01/04"
  }'`}
                response={`{
  "data": {
    "id": 1,
    "name": "Jean Dupont",
    "agency": "Agence Nord",
    "is_active_in_planning": false,
    "notes": "En congé jusqu'au 01/04",
    ...
  }
}`}
              />
              <EndpointCard
                method="DELETE"
                path="/api/commercials/{id}"
                description="Supprimer un commercial"
                baseUrl={baseUrl}
                copied={copied}
                onCopy={copyText}
                example={`curl -X DELETE ${baseUrl || 'https://votre-domaine.com'}/api/commercials/3 \\
  -H "Authorization: Bearer VOTRE_CLE_API"`}
                response={`{
  "message": "Commercial supprimé."
}`}
              />
            </div>
          </div>

          {/* Response codes */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
              Codes de réponse
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { code: '200', label: 'Succès', color: 'rgba(16,185,129,0.15)', textColor: '#10b981' },
                { code: '201', label: 'Création réussie', color: 'rgba(16,185,129,0.15)', textColor: '#10b981' },
                { code: '400', label: 'Requête invalide', color: 'rgba(245,158,11,0.15)', textColor: '#f59e0b' },
                { code: '401', label: 'Clé API invalide', color: 'rgba(239,68,68,0.15)', textColor: '#ef4444' },
                { code: '404', label: 'Non trouvé', color: 'var(--color-bg-input)', textColor: 'var(--color-text-secondary)' },
                { code: '500', label: 'Erreur serveur', color: 'rgba(239,68,68,0.15)', textColor: '#ef4444' },
              ].map((r) => (
                <div key={r.code} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: r.color, color: r.textColor, border: '1px solid var(--color-border)' }}>
                  <span className="font-bold">{r.code}</span>{' '}
                  <span className="opacity-80">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Environment notice */}
      <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}>
        <p className="font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Note de configuration</p>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          La variable d&apos;environnement <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-card-hover)', color: 'var(--color-text-secondary)' }}>SUPABASE_SERVICE_ROLE_KEY</code> doit
          être définie dans votre fichier <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-card-hover)', color: 'var(--color-text-secondary)' }}>.env.local</code> pour que
          les endpoints API fonctionnent correctement.
        </p>
      </div>
    </div>
  )
}

function EndpointCard({
  method,
  path,
  description,
  baseUrl,
  copied,
  onCopy,
  example,
  response,
  params,
}: {
  method: string
  path: string
  description: string
  baseUrl: string
  copied: string | null
  onCopy: (text: string, id: string) => Promise<void>
  example: string
  response: string
  params?: { name: string; type: string; desc: string }[]
}) {
  const [open, setOpen] = useState(false)
  const endpointId = `${method}-${path}`

  const methodColors: Record<string, { bg: string; text: string }> = {
    GET: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
    POST: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
    PATCH: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    PUT: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    DELETE: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  }

  const methodBorder: Record<string, string> = {
    GET: '#34d399',
    POST: '#60a5fa',
    PATCH: '#fbbf24',
    PUT: '#fbbf24',
    DELETE: '#f87171',
  }

  const mc = methodColors[method] || { bg: 'var(--color-bg-input)', text: 'var(--color-text-secondary)' }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)', borderLeft: `4px solid ${methodBorder[method] || 'var(--color-text-tertiary)'}` }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-card-hover)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span
          className="px-2.5 py-0.5 rounded text-xs font-bold"
          style={{ backgroundColor: mc.bg, color: mc.text }}
        >
          {method}
        </span>
        <code className="text-sm font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{path}</code>
        <span className="text-sm ml-auto hidden sm:block" style={{ color: 'var(--color-text-tertiary)' }}>{description}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-tertiary)' }} />
      </button>

      {/* Expanded details */}
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card-hover)' }}>
          <p className="px-4 pt-3 pb-2 text-sm sm:hidden" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>

          {/* Params table */}
          {params && params.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Paramètres</p>
              <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th className="px-3 py-1.5 font-medium text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Champ</th>
                      <th className="px-3 py-1.5 font-medium text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Type</th>
                      <th className="px-3 py-1.5 font-medium text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((p) => (
                      <tr key={p.name} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td className="px-3 py-1.5 font-mono text-xs" style={{ color: 'var(--color-text-primary)' }}>{p.name}</td>
                        <td className="px-3 py-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.type}</td>
                        <td className="px-3 py-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Example */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Exemple</p>
              <button
                onClick={(e) => { e.stopPropagation(); onCopy(example, `ex-${endpointId}`) }}
                className="flex items-center gap-1 text-xs transition-colors" style={{ color: 'var(--color-text-tertiary)' }}
              >
                {copied === `ex-${endpointId}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied === `ex-${endpointId}` ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="rounded-lg px-4 py-3 text-xs overflow-x-auto whitespace-pre font-mono leading-relaxed" style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}>
              {example}
            </pre>
          </div>

          {/* Response */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Réponse</p>
              <button
                onClick={(e) => { e.stopPropagation(); onCopy(response, `res-${endpointId}`) }}
                className="flex items-center gap-1 text-xs transition-colors" style={{ color: 'var(--color-text-tertiary)' }}
              >
                {copied === `res-${endpointId}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied === `res-${endpointId}` ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="rounded-lg px-4 py-3 text-xs overflow-x-auto whitespace-pre font-mono leading-relaxed" style={{ backgroundColor: '#0f172a', color: '#6ee7b7' }}>
              {response}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
