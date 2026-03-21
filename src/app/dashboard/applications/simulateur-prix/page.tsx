'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw } from 'lucide-react'

/* ─── DATA ─── */

interface Lot {
  id: string
  bat: string
  etage: string
  type: string
  habitable: number
  terrasse: number
  prix: number
  statut: string
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
type Floor = (typeof FLOORS)[number]

const FLOOR_LABELS: Record<Floor, string> = {
  'R-1': 'Sous-sol',
  'RDC': 'Rez-de-chaussée',
  'R+1': '1er étage',
  'R+2': '2ème étage',
}

const FLOOR_COLORS: Record<string, string> = {
  'R-1': '#94a3b8',
  'RDC': '#60a5fa',
  'R+1': '#34d399',
  'R+2': '#fbbf24',
  'DUPLEX': '#c084fc',
}

/* ─── FORMATTERS ─── */

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number) => (n >= 0 ? '+' : '') + (n * 100).toFixed(1) + '%'

/* ─── COMPONENT ─── */

export default function SimulateurPrixPage() {
  const [coeffs, setCoeffs] = useState<Record<Floor, number>>({ 'R-1': 1.0, 'RDC': 1.0, 'R+1': 1.0, 'R+2': 1.0 })
  const [activeBat, setActiveBat] = useState<string>('all')
  const [showDuplex, setShowDuplex] = useState(true)

  const TOTAL_GLOBAL = useMemo(() => ALL_LOTS.reduce((s, l) => s + l.prix, 0), [])

  const standardLots = useMemo(() => ALL_LOTS.filter(l => l.etage !== 'DUPLEX'), [])
  const totalStandard = useMemo(() => standardLots.reduce((s, l) => s + l.prix, 0), [standardLots])

  const weightedSum = useMemo(
    () => standardLots.reduce((s, l) => s + l.prix * (coeffs[l.etage as Floor] || 1), 0),
    [standardLots, coeffs],
  )

  const lambda = totalStandard / weightedSum

  const computedLots = useMemo(
    () =>
      ALL_LOTS.map((lot) => {
        if (lot.etage === 'DUPLEX') return { ...lot, newPrix: lot.prix, delta: 0, coeff: null as number | null }
        const coeff = coeffs[lot.etage as Floor] || 1
        const newPrix = Math.round((lot.prix * coeff * lambda) / 500) * 500
        return { ...lot, newPrix, delta: newPrix - lot.prix, coeff }
      }),
    [coeffs, lambda],
  )

  const displayLots = useMemo(() => {
    let lots = activeBat === 'all' ? computedLots : computedLots.filter((l) => l.bat === activeBat)
    if (!showDuplex) lots = lots.filter((l) => l.etage !== 'DUPLEX')
    return lots
  }, [computedLots, activeBat, showDuplex])

  const totalNew = computedLots.reduce((s, l) => s + l.newPrix, 0)

  const impliedRates = useMemo(() => {
    const acc: Record<string, { original: number; nouveau: number }> = {}
    for (const f of FLOORS) {
      const lotsFloor = standardLots.filter((l) => l.etage === f)
      const avgPrixM2 = lotsFloor.length > 0
        ? lotsFloor.reduce((s, l) => s + l.prix / l.habitable, 0) / lotsFloor.length
        : 0
      const newAvgPrixM2 = avgPrixM2 * (coeffs[f] || 1) * lambda
      acc[f] = { original: avgPrixM2, nouveau: newAvgPrixM2 }
    }
    return acc
  }, [standardLots, coeffs, lambda])

  const resetCoeffs = () => setCoeffs({ 'R-1': 1.0, 'RDC': 1.0, 'R+1': 1.0, 'R+2': 1.0 })

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Applications
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: 'var(--color-accent)' }}>
              BETERBAT · SIMULATEUR TARIFAIRE
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Résidence <span className="text-amber-500">Vue des Îlets</span>
              <span className="text-base font-normal ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                · Trois-Îlets
              </span>
            </h1>
          </div>
        </div>

        {/* KPI Bar */}
        <div className="flex flex-wrap gap-6 mt-5">
          {[
            { label: 'TOTAL PROGRAMME', val: TOTAL_GLOBAL, color: '#fbbf24' },
            { label: 'TOTAL SIMULÉ', val: totalNew, color: Math.abs(totalNew - TOTAL_GLOBAL) < 10000 ? '#34d399' : '#f87171' },
            { label: 'ÉCART', val: totalNew - TOTAL_GLOBAL, color: 'var(--color-text-tertiary)' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>{item.label}</div>
              <div className="text-xl font-bold mt-0.5" style={{ color: item.color }}>{fmt(item.val)}</div>
            </div>
          ))}
          <div>
            <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>LOTS</div>
            <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{ALL_LOTS.length} lots</div>
          </div>
        </div>
      </div>

      {/* Coefficient Panel */}
      <div className="card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="text-xs tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            COEFFICIENTS PAR ÉTAGE — le total global reste verrouillé à{' '}
            <span className="font-semibold text-amber-500">{fmt(TOTAL_GLOBAL)}</span>
          </div>
          <button onClick={resetCoeffs} className="btn-secondary text-xs gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        </div>

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
                      className="text-xs font-bold tracking-wide px-2.5 py-0.5 rounded-full"
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
                      style={{ color: coeff > 1 ? '#34d399' : coeff < 1 ? '#f87171' : 'var(--color-text-tertiary)' }}
                    >
                      {coeff.toFixed(3)}
                    </div>
                    <div
                      className="text-[11px]"
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
                  onChange={(e) => setCoeffs((p) => ({ ...p, [floor]: parseFloat(e.target.value) }))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: color }}
                />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>−20%</span>
                  <span>+20%</span>
                </div>

                {rate && (
                  <div
                    className="mt-2.5 rounded-lg p-2 text-[11px]"
                    style={{ backgroundColor: 'var(--color-bg-card-hover)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Prix moyen / m² hab.</div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {Math.round(rate.original).toLocaleString('fr-FR')} €
                      </span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
                      <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {Math.round(rate.nouveau).toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {['all', 'A', 'B', 'C'].map((b) => (
          <button
            key={b}
            onClick={() => setActiveBat(b)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
              activeBat === b ? 'text-white border-amber-500' : 'border-transparent'
            }`}
            style={
              activeBat === b
                ? { background: '#fbbf24', color: '#0f172a', borderColor: '#fbbf24' }
                : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
            }
          >
            {b === 'all' ? 'Tous' : `Bât. ${b}`}
          </button>
        ))}
        <button
          onClick={() => setShowDuplex((v) => !v)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
          style={
            showDuplex
              ? { background: '#c084fc22', color: '#c084fc', borderColor: '#c084fc' }
              : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }
          }
        >
          {showDuplex ? '◉' : '○'} Duplex
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 700 }}>
          <thead>
            <tr
              className="text-[10px] uppercase tracking-wider"
              style={{ backgroundColor: 'var(--color-table-header)', color: 'var(--color-text-tertiary)' }}
            >
              {['Lot', 'Bât.', 'Étage', 'Type', 'Hab.', 'Coeff.', 'Prix actuel', 'Nouveau prix', 'Écart €', 'Écart %'].map((h) => (
                <th
                  key={h}
                  className={`px-3 py-2.5 font-medium ${
                    ['Lot', 'Bât.', 'Étage', 'Type'].includes(h) ? 'text-left' : 'text-right'
                  }`}
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
                  className="transition-colors"
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-table-row-hover)',
                  }}
                >
                  <td className="px-3 py-2 font-bold" style={{ color: 'var(--color-text-primary)' }}>{lot.id}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>{lot.bat}</td>
                  <td className="px-3 py-2">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: (FLOOR_COLORS[lot.etage] || '#334155') + '28',
                        color: FLOOR_COLORS[lot.etage] || 'var(--color-text-tertiary)',
                      }}
                    >
                      {lot.etage}
                    </span>
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>{lot.type}</td>
                  <td className="px-3 py-2 text-right" style={{ color: 'var(--color-text-tertiary)' }}>{lot.habitable} m²</td>
                  <td
                    className="px-3 py-2 text-right font-bold"
                    style={{
                      color: isDuplex
                        ? 'var(--color-text-tertiary)'
                        : lot.coeff! > 1
                        ? '#34d399'
                        : lot.coeff! < 1
                        ? '#f87171'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {isDuplex ? '—' : lot.coeff?.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right" style={{ color: 'var(--color-text-tertiary)' }}>{fmt(lot.prix)}</td>
                  <td className="px-3 py-2 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>{fmt(lot.newPrix)}</td>
                  <td
                    className="px-3 py-2 text-right font-bold"
                    style={{ color: lot.delta > 0 ? '#34d399' : lot.delta < 0 ? '#f87171' : 'var(--color-text-tertiary)' }}
                  >
                    {lot.delta > 0 ? '+' : ''}{fmt(lot.delta)}
                  </td>
                  <td
                    className="px-3 py-2 text-right text-xs"
                    style={{ color: pct > 0 ? '#34d39988' : pct < 0 ? '#f8717188' : 'var(--color-text-tertiary)' }}
                  >
                    {isDuplex ? '—' : fmtPct(pct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-table-header)' }}>
              <td colSpan={5} className="px-3 py-3 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                {displayLots.length} lots affichés
              </td>
              <td className="px-3 py-3 text-right text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>TOTAL</td>
              <td className="px-3 py-3 text-right font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {fmt(displayLots.reduce((s, l) => s + l.prix, 0))}
              </td>
              <td className="px-3 py-3 text-right font-bold text-[15px] text-amber-500">
                {fmt(displayLots.reduce((s, l) => s + l.newPrix, 0))}
              </td>
              <td
                className="px-3 py-3 text-right font-bold"
                style={{
                  color:
                    displayLots.reduce((s, l) => s + l.delta, 0) > 0
                      ? '#34d399'
                      : displayLots.reduce((s, l) => s + l.delta, 0) < 0
                      ? '#f87171'
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

      {/* Footer note */}
      <div className="mt-3 text-[10px] text-center tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
        Prix arrondis à la tranche de 500 € · Duplexes D01 &amp; D02 exclus de la modulation
        · Formule : Prix nouveau = Prix actuel × Coeff × λ (facteur de normalisation)
      </div>
    </div>
  )
}
