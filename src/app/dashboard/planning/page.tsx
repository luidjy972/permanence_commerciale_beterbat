'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildPlanning, getDefaultMonday, formatShortDate, formatFrenchDate, getISOWeekNumber, addDays } from '@/lib/planning'
import type { Commercial, PlanningWeek } from '@/lib/types'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Loader2,
  Plus,
} from 'lucide-react'

const COMMERCIAL_COLORS = [
  '#FFD700', '#FFA500', '#FFB6C1', '#90EE90', '#ADD8E6',
  '#DDA0DD', '#F0E68C', '#87CEEB', '#FFC0CB', '#98FB98',
  '#F4A460', '#B0E0E6',
]

export default function PlanningPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [commercials, setCommercials] = useState<Commercial[]>([])
  const [planning, setPlanning] = useState<PlanningWeek[]>([])
  const [weekStart, setWeekStart] = useState(getDefaultMonday())
  const [planningWeeks, setPlanningWeeks] = useState(12)
  const [startIndex, setStartIndex] = useState(0)
  const [rotationMode, setRotationMode] = useState<'weekly' | 'monthly'>('weekly')
  const [viewWeekIndex, setViewWeekIndex] = useState<number | null>(null)
  const [status, setStatus] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: coms } = await supabase
        .from('commercials')
        .select('*')
        .order('position', { ascending: true })

      if (coms) setCommercials(coms)

      const { data: state } = await supabase
        .from('planning_state')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (state) {
        if (state.week_start) setWeekStart(state.week_start)
        if (state.planning_weeks) setPlanningWeeks(state.planning_weeks)
        if (state.start_index !== null) setStartIndex(state.start_index)
        if (state.rotation_mode) setRotationMode(state.rotation_mode)
        if (state.planning_data && Array.isArray(state.planning_data) && state.planning_data.length > 0) {
          setPlanning(state.planning_data)
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activePeople = commercials
    .filter((c) => c.is_active_in_planning !== false)
    .map((c) => c.name)

  const generatePlanning = async () => {
    if (!activePeople.length) {
      setStatus('Aucun commercial actif pour le planning.')
      return
    }
    setGenerating(true)
    const newPlanning = buildPlanning(weekStart, activePeople, startIndex, planningWeeks, rotationMode)
    setPlanning(newPlanning)
    setViewWeekIndex(null)

    try {
      await supabase.from('planning_state').upsert({
        id: 1,
        week_start: weekStart,
        planning_weeks: planningWeeks,
        start_index: startIndex,
        rotation_mode: rotationMode,
        planning_data: newPlanning,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      setStatus('Planning généré et enregistré.')
    } catch (err) {
      console.error('Error saving:', err)
      setStatus('Planning généré (erreur de sauvegarde).')
    }
    setGenerating(false)
  }

  const resetPlanning = async () => {
    setPlanning([])
    setViewWeekIndex(null)
    setWeekStart(getDefaultMonday())
    setPlanningWeeks(12)
    setStartIndex(0)
    setRotationMode('weekly')

    try {
      await supabase.from('planning_state').upsert({
        id: 1,
        week_start: getDefaultMonday(),
        planning_weeks: 12,
        start_index: 0,
        rotation_mode: 'weekly',
        planning_data: [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } catch (err) {
      console.error('Error resetting:', err)
    }
    setStatus('Planning réinitialisé.')
  }

  const addNextWeek = async () => {
    if (!activePeople.length || !planning.length) return
    setGenerating(true)

    const lastWeek = planning[planning.length - 1]
    const nextWeekStart = addDays(lastWeek.weekStart, 7)
    const weekIndexOffset = planning.length

    const newWeeks = buildPlanning(
      nextWeekStart,
      activePeople,
      startIndex,
      1,
      rotationMode,
      weekIndexOffset
    )

    const updatedPlanning = [...planning, ...newWeeks]
    const updatedWeeks = planningWeeks + newWeeks.length
    setPlanning(updatedPlanning)
    setPlanningWeeks(updatedWeeks)

    try {
      await supabase.from('planning_state').upsert({
        id: 1,
        planning_weeks: updatedWeeks,
        planning_data: updatedPlanning,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      const nextOff = newWeeks[0]?.offPerson
      setStatus(`Semaine S${newWeeks[0].weekNumber} ajoutée.${nextOff ? ` Repos : ${nextOff}` : ''}`)
    } catch (err) {
      console.error('Error saving:', err)
      setStatus('Erreur lors de l\'ajout de la semaine.')
    }
    setGenerating(false)
  }

  const allCommercialNames = commercials
    .filter((c) => c.is_active_in_planning !== false)
    .map((c) => c.name)

  const getColor = (name: string) => {
    const idx = allCommercialNames.indexOf(name)
    return idx >= 0 ? COMMERCIAL_COLORS[idx % COMMERCIAL_COLORS.length] : '#f1f5f9'
  }

  const updateEntryAssignee = async (weekIndex: number, entryIndex: number, newAssignee: string) => {
    const updated = planning.map((w) => {
      if (w.weekIndex !== weekIndex) return w
      return {
        ...w,
        entries: w.entries.map((e, i) =>
          i === entryIndex ? { ...e, assignee: newAssignee } : e
        ),
      }
    })
    setPlanning(updated)

    try {
      await supabase.from('planning_state').upsert({
        id: 1,
        planning_data: updated,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } catch (err) {
      console.error('Error saving assignee change:', err)
    }
  }

  const visibleWeeks =
    viewWeekIndex !== null
      ? planning.filter((w) => w.weekIndex === viewWeekIndex)
      : planning

  const exportCSV = () => {
    const entries = visibleWeeks.flatMap((w) => w.entries)
    if (!entries.length) return
    const headers = ['Semaine', 'Jour', 'Date', 'Créneau', 'Horaire', 'Commercial', 'Repos']
    const rows = entries.map((e) => [
      `S${e.weekNumber}`, e.dayLabel, e.date, e.shiftLabel, e.timeRange, e.assignee, e.offPerson,
    ])
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planning-${weekStart}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
      {/* Print-only header — hidden on screen */}
      <div className="print-only" style={{ display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #dc2626', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Planning de Permanence — Beterbat</h1>
            {planning.length > 0 && (
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0' }}>
                Semaines S{planning[0].weekNumber} à S{planning[planning.length - 1].weekNumber} — {formatShortDate(planning[0].weekStart)} au {formatShortDate(planning[planning.length - 1].weekEnd)} — {planning.length} semaines
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
            <div>Imprimé le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div style={{ marginTop: '2px' }}>{activePeople.length} commerciaux actifs</div>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <CalendarDays className="h-7 w-7" style={{ color: 'var(--color-accent)' }} />
              Planning de permanence
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Générez et gérez le planning de rotation des commerciaux</p>
          </div>
        </div>
      </div>

      {/* Parameters Card */}
      <div className="card p-6 mb-6 print:hidden">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Paramètres du planning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Semaine de début</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nombre de semaines</label>
            <input
              type="number"
              min={1}
              max={52}
              value={planningWeeks}
              onChange={(e) => setPlanningWeeks(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Départ rotation</label>
            <select
              value={startIndex}
              onChange={(e) => setStartIndex(Number(e.target.value))}
              className="input-field"
            >
              {activePeople.map((p, i) => (
                <option key={i} value={i}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Mode de rotation</label>
            <select
              value={rotationMode}
              onChange={(e) => setRotationMode(e.target.value as 'weekly' | 'monthly')}
              className="input-field"
            >
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={generatePlanning}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Générer le planning
          </button>
          <button
            onClick={resetPlanning}
            className="btn-secondary"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
          {planning.length > 0 && (
            <>
              <button
                onClick={addNextWeek}
                disabled={generating}
                className="btn-secondary"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Ajouter la semaine suivante
              </button>
              <button
                onClick={exportCSV}
                className="btn-secondary"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </button>
              <button
                onClick={() => window.print()}
                className="btn-secondary"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
            </>
          )}
        </div>

        {status && (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-success)' }}>{status}</p>
        )}
      </div>

      {/* Planning overview */}
      {planning.length > 0 && (
        <div className="card p-4 mb-6 print:hidden">
          <div className="flex items-center gap-3 text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>
              S{planning[0].weekNumber} → S{planning[planning.length - 1].weekNumber}
            </span>
            <span>•</span>
            <span>{formatShortDate(planning[0].weekStart)} — {formatShortDate(planning[planning.length - 1].weekEnd)}</span>
            <span>•</span>
            <span>{planning.length} semaines</span>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      {planning.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
          <button
            onClick={() => setViewWeekIndex(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all`}
            style={viewWeekIndex === null
              ? { background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }
              : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
            }
          >
            <Eye className="h-4 w-4 inline mr-1" />
            Tout voir
          </button>
          <button
            onClick={() => setViewWeekIndex(Math.max(0, (viewWeekIndex ?? 0) - 1))}
            disabled={viewWeekIndex === 0}
            className="btn-ghost !p-1.5 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select
            value={viewWeekIndex ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setViewWeekIndex(v === '' ? null : Number(v))
            }}
            className="input-field !w-auto"
          >
            <option value="">Toutes les semaines</option>
            {planning.map((w) => (
              <option key={w.weekIndex} value={w.weekIndex}>
                Semaine {w.weekNumber} ({formatShortDate(w.weekStart)})
              </option>
            ))}
          </select>
          <button
            onClick={() => setViewWeekIndex(Math.min(planning.length - 1, (viewWeekIndex ?? -1) + 1))}
            disabled={viewWeekIndex === planning.length - 1}
            className="btn-ghost !p-1.5 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Planning Table */}
      {visibleWeeks.map((week) => (
        <div key={week.weekIndex} className="card mb-6 overflow-hidden">
          <div className="px-6 py-3 flex items-center justify-between print-week-header" style={{ backgroundColor: 'var(--color-table-header)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-white rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                S{week.weekNumber}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {formatShortDate(week.weekStart)} — {formatShortDate(week.weekEnd)}
              </span>
            </div>
            {week.offPerson && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--color-danger-light)', color: '#ef4444' }}>
                Repos : {week.offPerson}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-table-header)', color: 'var(--color-text-secondary)' }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ width: '110px' }}>Jour</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ width: '140px' }}>Date</th>
                  <th className="px-4 py-3 text-left font-medium">Créneau</th>
                  <th className="px-4 py-3 text-left font-medium">Horaire</th>
                  <th className="px-4 py-3 text-left font-medium">Commercial</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = []
                  for (let i = 0; i < week.entries.length; i++) {
                    const entry = week.entries[i]
                    const isFirstShift = i % 2 === 0
                    const dayIndex = Math.floor(i / 2)
                    const isOddDay = dayIndex % 2 === 1
                    const dayBg = isOddDay ? 'var(--color-table-header)' : 'transparent'
                    rows.push(
                      <tr
                        key={i}
                        style={{
                          borderTop: isFirstShift ? '2px solid var(--color-border)' : 'none',
                          backgroundColor: dayBg,
                        }}
                      >
                        {isFirstShift && (
                          <>
                            <td
                              rowSpan={2}
                              className="px-4 py-3 font-semibold"
                              style={{
                                color: 'var(--color-text-primary)',
                                verticalAlign: 'middle',
                                borderRight: '1px solid var(--color-border-light)',
                                backgroundColor: dayBg,
                              }}
                            >
                              {entry.dayLabel}
                            </td>
                            <td
                              rowSpan={2}
                              className="px-4 py-3"
                              style={{
                                color: 'var(--color-text-secondary)',
                                verticalAlign: 'middle',
                                borderRight: '1px solid var(--color-border-light)',
                                backgroundColor: dayBg,
                              }}
                            >
                              {formatFrenchDate(entry.date)}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${entry.shiftLabel === 'Matin' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                            {entry.shiftLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--color-text-tertiary)' }}>{entry.timeRange}</td>
                        <td className="px-4 py-2.5">
                          <select
                            value={entry.assignee}
                            onChange={(e) => updateEntryAssignee(week.weekIndex, i, e.target.value)}
                            className="px-3 py-1 rounded-full text-xs font-medium border-none cursor-pointer focus:ring-2 focus:ring-red-300 outline-none"
                            style={{ backgroundColor: getColor(entry.assignee) + '40', color: 'var(--color-text-primary)', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '24px' }}
                          >
                            {allCommercialNames.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  }
                  return rows
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {planning.length === 0 && (
        <div className="card p-12 text-center print:hidden">
          <CalendarDays className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>Aucun planning généré</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Configurez les paramètres ci-dessus puis cliquez sur &quot;Générer le planning&quot;.
          </p>
        </div>
      )}

      {/* Summary */}
      {planning.length > 0 && (
        <div className="card p-6 print-summary">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Récapitulatif</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-4 gap-4 print:gap-2">
            {activePeople.map((person) => {
              const shiftCount = planning.flatMap((w) => w.entries).filter((e) => e.assignee === person).length
              const offCount = planning.filter((w) => w.offPerson === person).length
              return (
                <div key={person} className="flex items-center gap-3 p-3 rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: getColor(person), color: 'var(--color-text-inverse)' }}
                  >
                    {person.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{person}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{shiftCount} créneaux • {offCount} repos</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
