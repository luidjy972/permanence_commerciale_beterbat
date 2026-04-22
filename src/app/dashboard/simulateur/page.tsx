'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface Lot {
  id: string
  bat: string
  etage: string
  type: string
  habitable: number
  terrasse: number
  prix: number
  statut?: string
}

interface ComputedLot extends Lot {
  newPrix: number
  delta: number
  coeff: number | null
}

interface Config {
  id: number
  nom: string
  coeff_r1: number
  coeff_rdc: number
  coeff_r1_etage: number
  coeff_r2: number
  created_at: string
}

const ALL_LOTS: Lot[] = [
  { id: 'D01', bat: 'A', etage: 'DUPLEX', type: 'DUPLEX F4', habitable: 82, terrasse: 14, prix: 415000, statut: 'Option' },
  { id: 'D02', bat: 'A', etage: 'DUPLEX', type: 'DUPLEX F4', habitable: 82, terrasse: 14, prix: 415000, statut: '' },
  { id: '101', bat: 'A', etage: 'RDC', type: 'T3', habitable: 70, terrasse: 18, prix: 345000, statut: '' },
  { id: '102', bat: 'A', etage: 'RDC', type: 'T2', habitable: 42, terrasse: 15, prix: 252500, statut: '' },
  { id: '103', bat: 'A', etage: 'RDC', type: 'T2', habitable: 42, terrasse: 15, prix: 252500, statut: '' },
  { id: '104', bat: 'A', etage: 'RDC', type: 'T3', habitable: 70, terrasse: 18, prix: 345000, statut: '' },
  { id: '105', bat: 'A', etage: 'R+1', type: 'T3', habitable: 70, terrasse: 18, prix: 358500, statut: '' },
  { id: '106', bat: 'A', etage: 'R+1', type: 'T2', habitable: 42, terrasse: 15, prix: 264500, statut: '' },
  { id: '107', bat: 'A', etage: 'R+1', type: 'T2', habitable: 42, terrasse: 15, prix: 264500, statut: '' },
  { id: '108', bat: 'A', etage: 'R+1', type: 'T3', habitable: 70, terrasse: 18, prix: 358500, statut: '' },
  { id: '109', bat: 'A', etage: 'R+2', type: 'T3', habitable: 70, terrasse: 18, prix: 362500, statut: '' },
  { id: '110', bat: 'A', etage: 'R+2', type: 'T2', habitable: 42, terrasse: 15, prix: 268500, statut: '' },
  { id: '111', bat: 'A', etage: 'R+2', type: 'T2', habitable: 42, terrasse: 15, prix: 268500, statut: '' },
  { id: '112', bat: 'A', etage: 'R+2', type: 'T3', habitable: 70, terrasse: 18, prix: 362500, statut: '' },
  { id: '201', bat: 'B', etage: 'RDC', type: 'T3', habitable: 70, terrasse: 18, prix: 342000, statut: '' },
  { id: '202', bat: 'B', etage: 'RDC', type: 'T2', habitable: 42, terrasse: 15, prix: 248500, statut: '' },
  { id: '203', bat: 'B', etage: 'RDC', type: 'T2', habitable: 42, terrasse: 15, prix: 248500, statut: '' },
  { id: '204', bat: 'B', etage: 'RDC', type: 'T3', habitable: 70, terrasse: 18, prix: 342000, statut: '' },
  { id: '205', bat: 'B', etage: 'R+1', type: 'T3', habitable: 70, terrasse: 18, prix: 357000, statut: '' },
  { id: '206', bat: 'B', etage: 'R+1', type: 'T2', habitable: 42, terrasse: 15, prix: 262000, statut: '' },
  { id: '207', bat: 'B', etage: 'R+1', type: 'T2', habitable: 42, terrasse: 15, prix: 262000, statut: '' },
  { id: '208', bat: 'B', etage: 'R+1', type: 'T3', habitable: 70, terrasse: 18, prix: 357000, statut: '' },
  { id: '209', bat: 'B', etage: 'R+2', type: 'T3', habitable: 70, terrasse: 18, prix: 360500, statut: '' },
  { id: '210', bat: 'B', etage: 'R+2', type: 'T2', habitable: 42, terrasse: 15, prix: 263500, statut: '' },
  { id: '211', bat: 'B', etage: 'R+2', type: 'T2', habitable: 42, terrasse: 15, prix: 263500, statut: '' },
  { id: '212', bat: 'B', etage: 'R+2', type: 'T3', habitable: 70, terrasse: 18, prix: 360500, statut: '' },
  { id: '301', bat: 'C', etage: 'R-1', type: 'T3', habitable: 70, terrasse: 18, prix: 338000, statut: '' },
  { id: '302', bat: 'C', etage: 'R-1', type: 'T2', habitable: 42, terrasse: 15, prix: 247000, statut: '' },
  { id: '303', bat: 'C', etage: 'R-1', type: 'T2', habitable: 42, terrasse: 15, prix: 247000, statut: '' },
  { id: '304', bat: 'C', etage: 'R-1', type: 'T3', habitable: 70, terrasse: 18, prix: 338000, statut: '' },
  { id: '305', bat: 'C', etage: 'RDC', type: 'T3', habitable: 70, terrasse: 18, prix: 345000, statut: '' },
  { id: '306', bat: 'C', etage: 'RDC', type: 'T2', habitable: 42, terrasse: 15, prix: 249500, statut: '' },
  { id: '307', bat: 'C', etage: 'RDC', type: 'T2', habitable: 42, terrasse: 15, prix: 249500, statut: '' },
  { id: '308', bat: 'C', etage: 'RDC', type: 'T3', habitable: 70, terrasse: 18, prix: 345500, statut: '' },
  { id: '309', bat: 'C', etage: 'R+1', type: 'T3', habitable: 70, terrasse: 18, prix: 345000, statut: '' },
  { id: '310', bat: 'C', etage: 'R+1', type: 'T2', habitable: 42, terrasse: 15, prix: 265500, statut: '' },
  { id: '311', bat: 'C', etage: 'R+1', type: 'T2', habitable: 42, terrasse: 15, prix: 265500, statut: '' },
  { id: '312', bat: 'C', etage: 'R+1', type: 'T3', habitable: 70, terrasse: 18, prix: 352000, statut: 'Libre' },
  { id: '313', bat: 'C', etage: 'R+2', type: 'T3', habitable: 70, terrasse: 18, prix: 352000, statut: '' },
  { id: '314', bat: 'C', etage: 'R+2', type: 'T2', habitable: 42, terrasse: 15, prix: 263500, statut: '' },
  { id: '315', bat: 'C', etage: 'R+2', type: 'T2', habitable: 42, terrasse: 15, prix: 263500, statut: '' },
  { id: '316', bat: 'C', etage: 'R+2', type: 'T3', habitable: 70, terrasse: 18, prix: 352000, statut: 'Option' },
]

const FLOORS = ['R-1', 'RDC', 'R+1', 'R+2'] as const
type Floor = typeof FLOORS[number]

const FLOOR_COLORS: Record<string, string> = {
  'R-1': '#94a3b8',
  'RDC': '#60a5fa',
  'R+1': '#34d399',
  'R+2': '#fbbf24',
  'DUPLEX': '#c084fc',
}

const FLOOR_LABELS: Record<Floor, string> = {
  'R-1': 'Sous-sol',
  'RDC': 'Rez-de-chaussée',
  'R+1': '1er étage',
  'R+2': '2ème étage',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number) => (n >= 0 ? '+' : '') + (n * 100).toFixed(1) + '%'

export default function SimulateurPage() {
  const [coeffs, setCoeffs] = useState<Record<Floor, number>>({ 'R-1': 1.0, 'RDC': 1.0, 'R+1': 1.0, 'R+2': 1.0 })
  const [activeBat, setActiveBat] = useState('all')
  const [showDuplex, setShowDuplex] = useState(true)
  const [configs, setConfigs] = useState<Config[]>([])
  const [nomConfig, setNomConfig] = useState('')
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [showSavePanel, setShowSavePanel] = useState(false)

  const TOTAL_GLOBAL = useMemo(() => ALL_LOTS.reduce((s, l) => s + l.prix, 0), [])
  const standardLots = useMemo(() => ALL_LOTS.filter(l => l.etage !== 'DUPLEX'), [])
  const totalStandard = useMemo(() => standardLots.reduce((s, l) => s + l.prix, 0), [standardLots])
  const weightedSum = useMemo(
    () => standardLots.reduce((s, l) => s + l.prix * (coeffs[l.etage as Floor] || 1), 0),
    [standardLots, coeffs]
  )
  const lambda = totalStandard / weightedSum

  const computedLots: ComputedLot[] = useMemo(
    () =>
      ALL_LOTS.map((lot) => {
        if (lot.etage === 'DUPLEX') return { ...lot, newPrix: lot.prix, delta: 0, coeff: null }
        const coeff = coeffs[lot.etage as Floor] || 1
        const newPrix = Math.round((lot.prix * coeff * lambda) / 500) * 500
        return { ...lot, newPrix, delta: newPrix - lot.prix, coeff }
      }),
    [coeffs, lambda]
  )

  const displayLots = useMemo(() => {
    let lots = activeBat === 'all' ? computedLots : computedLots.filter(l => l.bat === activeBat)
    if (!showDuplex) lots = lots.filter(l => l.etage !== 'DUPLEX')
    return lots
  }, [computedLots, activeBat, showDuplex])

  const totalNew = computedLots.reduce((s, l) => s + l.newPrix, 0)

  const impliedRates = useMemo(() => {
    return FLOORS.reduce((acc, f) => {
      const lotsFloor = standardLots.filter(l => l.etage === f)
      const avgPrixM2 =
        lotsFloor.length > 0
          ? lotsFloor.reduce((s, l) => s + l.prix / l.habitable, 0) / lotsFloor.length
          : 0
      const newAvgPrixM2 = avgPrixM2 * (coeffs[f] || 1) * lambda
      acc[f] = { original: avgPrixM2, nouveau: newAvgPrixM2 }
      return acc
    }, {} as Record<Floor, { original: number; nouveau: number }>)
  }, [standardLots, coeffs, lambda])

  function afficherToast(message: string, type: string) {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const chargerConfigs = useCallback(async () => {
    const { data } = await supabase.from('configurations').select('*').order('created_at', { ascending: false })
    if (data) setConfigs(data as Config[])
  }, [])

  useEffect(() => { chargerConfigs() }, [chargerConfigs])

  async function sauvegarderConfig() {
    if (!nomConfig.trim()) { afficherToast('Donne un nom !', 'warning'); return }
    const { error } = await supabase.from('configurations').insert({
      nom: nomConfig.trim(),
      coeff_r1: coeffs['R-1'],
      coeff_rdc: coeffs['RDC'],
      coeff_r1_etage: coeffs['R+1'],
      coeff_r2: coeffs['R+2'],
    })
    if (!error) {
      afficherToast('✅ Sauvegardé !', 'success')
      setNomConfig('')
      setShowSavePanel(false)
      chargerConfigs()
    }
  }

  function appliquerConfig(c: Config) {
    setCoeffs({ 'R-1': c.coeff_r1, 'RDC': c.coeff_rdc, 'R+1': c.coeff_r1_etage, 'R+2': c.coeff_r2 })
    afficherToast(`📂 "${c.nom}" chargée !`, 'success')
  }

  async function supprimerConfig(id: number) {
    await supabase.from('configurations').delete().eq('id', id)
    afficherToast('Supprimée', 'info')
    chargerConfigs()
  }

  function exporterCSV() {
    const header = 'Lot;Bât.;Étage;Type;Habitable;Terrasse;Prix actuel;Nouveau prix;Écart €;Écart %'
    const rows = computedLots.map(l => {
      const pct = l.prix > 0 ? ((l.delta / l.prix) * 100).toFixed(1) : '0'
      return `${l.id};${l.bat};${l.etage};${l.type};${l.habitable};${l.terrasse};${l.prix};${l.newPrix};${l.delta};${pct}%`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'simulateur-prix-vue-ilets.csv'
    link.click()
    afficherToast('📥 CSV exporté !', 'success')
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-pulse"
          style={{
            background: toast.type === 'success' ? '#059669' : toast.type === 'warning' ? '#d97706' : '#3b82f6',
            color: 'white',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 pb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: '#c084fc' }}>
          BETERBAT · SIMULATEUR TARIFAIRE
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Résidence <span style={{ color: '#fbbf24' }}>Vue des Îlets</span>
          <span className="text-base ml-2" style={{ color: 'var(--color-text-tertiary)' }}>· Trois-Îlets</span>
        </h1>

        <div className="flex gap-8 flex-wrap">
          {[
            { label: 'TOTAL PROGRAMME', val: TOTAL_GLOBAL, color: '#fbbf24' },
            { label: 'TOTAL SIMULÉ', val: totalNew, color: Math.abs(totalNew - TOTAL_GLOBAL) < 10000 ? '#34d399' : '#f87171' },
            { label: 'ÉCART', val: totalNew - TOTAL_GLOBAL, color: 'var(--color-text-secondary)' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>{item.label}</div>
              <div className="text-2xl font-bold mt-0.5" style={{ color: item.color }}>{fmt(item.val)}</div>
            </div>
          ))}
          <div>
            <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>LOTS</div>
            <div className="text-2xl font-bold mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{ALL_LOTS.length} lots</div>
          </div>
        </div>
      </div>

      {/* Coefficient Panel */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <div className="text-xs tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            COEFFICIENTS PAR ÉTAGE — le total global reste verrouillé à{' '}
            <span style={{ color: '#fbbf24' }}>{fmt(TOTAL_GLOBAL)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSavePanel(v => !v)}
              className="px-3 py-1.5 rounded-md text-xs border transition-colors"
              style={{
                background: 'rgba(59,130,246,0.1)',
                color: '#3b82f6',
                borderColor: '#3b82f6',
              }}
            >
              💾 Sauvegarder
            </button>
            <button
              onClick={exporterCSV}
              className="px-3 py-1.5 rounded-md text-xs border transition-colors"
              style={{
                background: 'rgba(34,197,94,0.1)',
                color: '#22c55e',
                borderColor: '#22c55e',
              }}
            >
              📥 Exporter CSV
            </button>
            <button
              onClick={() => setCoeffs({ 'R-1': 1.0, 'RDC': 1.0, 'R+1': 1.0, 'R+2': 1.0 })}
              className="px-3 py-1.5 rounded-md text-xs border transition-colors"
              style={{
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              ↺ Réinitialiser
            </button>
          </div>
        </div>

        {/* Save panel */}
        {showSavePanel && (
          <div className="mb-5 p-4 rounded-lg flex gap-3 items-center" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <input
              type="text"
              placeholder="Nom de la configuration..."
              value={nomConfig}
              onChange={e => setNomConfig(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sauvegarderConfig()}
              className="flex-1 px-3 py-2 rounded-md text-sm"
              style={{
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
            <button
              onClick={sauvegarderConfig}
              className="px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: '#3b82f6' }}
            >
              Enregistrer
            </button>
          </div>
        )}

        {/* Saved configs */}
        {configs.length > 0 && (
          <div className="mb-5 flex gap-2 flex-wrap">
            {configs.map(c => (
              <div key={c.id} className="flex items-center gap-1">
                <button
                  onClick={() => appliquerConfig(c)}
                  className="px-3 py-1 rounded-l-md text-xs border transition-colors"
                  style={{
                    background: 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  📂 {c.nom}
                </button>
                <button
                  onClick={() => supprimerConfig(c.id)}
                  className="px-2 py-1 rounded-r-md text-xs border-t border-r border-b transition-colors hover:bg-red-500/20"
                  style={{
                    color: '#f87171',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FLOORS.map((floor) => {
            const coeff = coeffs[floor]
            const color = FLOOR_COLORS[floor]
            const pct = (coeff - 1) * 100
            const rate = impliedRates[floor]
            return (
              <div key={floor}>
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
                      style={{ background: color + '22', color }}
                    >
                      {floor}
                    </span>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {FLOOR_LABELS[floor]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-lg font-bold"
                      style={{ color: coeff > 1 ? '#34d399' : coeff < 1 ? '#f87171' : 'var(--color-text-secondary)' }}
                    >
                      {coeff.toFixed(3)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: coeff > 1 ? '#34d39988' : coeff < 1 ? '#f8717188' : 'var(--color-text-tertiary)' }}
                    >
                      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.20"
                  step="0.005"
                  value={coeff}
                  onChange={(e) => setCoeffs(p => ({ ...p, [floor]: parseFloat(e.target.value) }))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: color }}
                />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>−20%</span>
                  <span>+20%</span>
                </div>
                {rate && (
                  <div className="mt-2.5 p-2 rounded-md text-xs" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                    <div className="mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Prix moyen / m² hab.</div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>{Math.round(rate.original).toLocaleString('fr-FR')} €</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
                      <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{Math.round(rate.nouveau).toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <div className="flex gap-1.5">
          {['all', 'A', 'B', 'C'].map(b => (
            <button
              key={b}
              onClick={() => setActiveBat(b)}
              className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: activeBat === b ? '#fbbf24' : 'var(--color-bg-card)',
                color: activeBat === b ? '#0f172a' : 'var(--color-text-secondary)',
                border: '1px solid ' + (activeBat === b ? '#fbbf24' : 'var(--color-border)'),
              }}
            >
              {b === 'all' ? 'Tous' : `Bât. ${b}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowDuplex(v => !v)}
          className="px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{
            background: showDuplex ? 'rgba(192,132,252,0.2)' : 'var(--color-bg-card)',
            color: showDuplex ? '#c084fc' : 'var(--color-text-tertiary)',
            border: '1px solid ' + (showDuplex ? '#c084fc' : 'var(--color-border)'),
          }}
        >
          {showDuplex ? '◉' : '○'} Duplex
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
          <thead>
            <tr
              className="text-[10px] tracking-wider uppercase"
              style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-tertiary)' }}
            >
              {['Lot', 'Bât.', 'Étage', 'Type', 'Hab.', 'Coeff.', 'Prix actuel', 'Nouveau prix', 'Écart €', 'Écart %'].map(h => (
                <th
                  key={h}
                  className="py-3 px-3 font-normal"
                  style={{ textAlign: ['Lot', 'Bât.', 'Étage', 'Type'].includes(h) ? 'left' : 'right' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayLots.map((lot, i) => {
              const isDuplex = lot.etage === 'DUPLEX'
              const pct = lot.prix > 0 ? lot.delta / lot.prix : 0
              return (
                <tr
                  key={lot.id}
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--color-bg-primary)',
                  }}
                >
                  <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>{lot.id}</td>
                  <td className="py-2.5 px-3" style={{ color: 'var(--color-text-tertiary)' }}>{lot.bat}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: (FLOOR_COLORS[lot.etage] || '#334155') + '28', color: FLOOR_COLORS[lot.etage] || 'var(--color-text-secondary)' }}
                    >
                      {lot.etage}
                    </span>
                  </td>
                  <td className="py-2.5 px-3" style={{ color: 'var(--color-text-secondary)' }}>{lot.type}</td>
                  <td className="py-2.5 px-3 text-right" style={{ color: 'var(--color-text-tertiary)' }}>{lot.habitable} m²</td>
                  <td
                    className="py-2.5 px-3 text-right font-bold"
                    style={{
                      color: isDuplex ? 'var(--color-text-tertiary)' : lot.coeff! > 1 ? '#34d399' : lot.coeff! < 1 ? '#f87171' : 'var(--color-text-tertiary)',
                    }}
                  >
                    {isDuplex ? '—' : lot.coeff?.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right" style={{ color: 'var(--color-text-tertiary)' }}>{fmt(lot.prix)}</td>
                  <td className="py-2.5 px-3 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>{fmt(lot.newPrix)}</td>
                  <td
                    className="py-2.5 px-3 text-right font-bold"
                    style={{ color: lot.delta > 0 ? '#34d399' : lot.delta < 0 ? '#f87171' : 'var(--color-text-tertiary)' }}
                  >
                    {lot.delta > 0 ? '+' : ''}{fmt(lot.delta)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right text-xs"
                    style={{ color: pct > 0 ? '#34d39988' : pct < 0 ? '#f8717188' : 'var(--color-text-tertiary)' }}
                  >
                    {isDuplex ? '—' : fmtPct(pct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--color-bg-primary)', borderTop: '2px solid var(--color-border)' }}>
              <td colSpan={5} className="py-3 px-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {displayLots.length} lots affichés
              </td>
              <td className="py-3 px-3 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>TOTAL</td>
              <td className="py-3 px-3 text-right font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {fmt(displayLots.reduce((s, l) => s + l.prix, 0))}
              </td>
              <td className="py-3 px-3 text-right font-bold text-base" style={{ color: '#fbbf24' }}>
                {fmt(displayLots.reduce((s, l) => s + l.newPrix, 0))}
              </td>
              <td
                className="py-3 px-3 text-right font-bold"
                style={{
                  color: displayLots.reduce((s, l) => s + l.delta, 0) > 0 ? '#34d399'
                    : displayLots.reduce((s, l) => s + l.delta, 0) < 0 ? '#f87171'
                    : 'var(--color-text-tertiary)',
                }}
              >
                {fmt(displayLots.reduce((s, l) => s + l.delta, 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 text-[10px] text-center tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
        Prix arrondis à la tranche de 500 € · Duplexes D01 &amp; D02 exclus de la modulation · Formule : Prix nouveau = Prix actuel × Coeff × λ (facteur de normalisation)
      </div>
    </div>
  )
}
