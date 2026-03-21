'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Plus, Trash2, Home, TrendingUp, Wallet, PiggyBank } from 'lucide-react'

/* ─── TYPES ─── */

interface Property {
  id: string
  name: string
  purchasePrice: number
  notaryFees: number
  renovationCost: number
  monthlyRent: number
  monthlyCharges: number
  annualTax: number
  annualInsurance: number
  managementFeePct: number
  vacancyRatePct: number
}

/* ─── HELPERS ─── */

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number) => n.toFixed(2) + ' %'

const uid = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_PROPERTY: Omit<Property, 'id'> = {
  name: '',
  purchasePrice: 200000,
  notaryFees: 8,
  renovationCost: 0,
  monthlyRent: 900,
  monthlyCharges: 150,
  annualTax: 800,
  annualInsurance: 300,
  managementFeePct: 0,
  vacancyRatePct: 0,
}

function computeMetrics(p: Property) {
  const totalInvestment = p.purchasePrice + (p.purchasePrice * p.notaryFees / 100) + p.renovationCost
  const grossAnnualRent = p.monthlyRent * 12
  const effectiveAnnualRent = grossAnnualRent * (1 - p.vacancyRatePct / 100)
  const annualCharges = p.monthlyCharges * 12
  const managementFees = effectiveAnnualRent * p.managementFeePct / 100
  const totalAnnualExpenses = annualCharges + p.annualTax + p.annualInsurance + managementFees
  const netAnnualIncome = effectiveAnnualRent - totalAnnualExpenses
  const grossYield = totalInvestment > 0 ? (grossAnnualRent / totalInvestment) * 100 : 0
  const netYield = totalInvestment > 0 ? (netAnnualIncome / totalInvestment) * 100 : 0
  const monthlyCashFlow = netAnnualIncome / 12
  const pricePerSqm = 0 // we don't have surface here

  return {
    totalInvestment,
    grossAnnualRent,
    effectiveAnnualRent,
    totalAnnualExpenses,
    netAnnualIncome,
    grossYield,
    netYield,
    monthlyCashFlow,
    managementFees,
  }
}

/* ─── INPUT FIELD COMPONENT ─── */

function Field({
  label,
  value,
  onChange,
  suffix,
  min,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  step?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          className="input-field pr-10"
          value={value}
          min={min ?? 0}
          step={step ?? 1}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── KPI CARD ─── */

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
  sub?: string
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg shrink-0" style={{ background: color + '18' }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
        <div className="text-lg font-bold mt-0.5 truncate" style={{ color }}>{value}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ─── MAIN COMPONENT ─── */

export default function CalculatriceRentabilitePage() {
  const [properties, setProperties] = useState<Property[]>([
    { ...DEFAULT_PROPERTY, id: uid(), name: 'Bien 1' },
  ])
  const [activeId, setActiveId] = useState(properties[0].id)

  const active = properties.find((p) => p.id === activeId) ?? properties[0]

  const updateActive = (patch: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === active.id ? { ...p, ...patch } : p)))
  }

  const addProperty = () => {
    const newP: Property = { ...DEFAULT_PROPERTY, id: uid(), name: `Bien ${properties.length + 1}` }
    setProperties((prev) => [...prev, newP])
    setActiveId(newP.id)
  }

  const removeProperty = (id: string) => {
    if (properties.length <= 1) return
    const next = properties.filter((p) => p.id !== id)
    setProperties(next)
    if (activeId === id) setActiveId(next[0].id)
  }

  const resetActive = () => {
    updateActive({ ...DEFAULT_PROPERTY, name: active.name })
  }

  const m = useMemo(() => computeMetrics(active), [active])

  // Summary across all properties
  const summary = useMemo(() => {
    return properties.reduce(
      (acc, p) => {
        const pm = computeMetrics(p)
        acc.totalInvestment += pm.totalInvestment
        acc.grossAnnualRent += pm.grossAnnualRent
        acc.netAnnualIncome += pm.netAnnualIncome
        return acc
      },
      { totalInvestment: 0, grossAnnualRent: 0, netAnnualIncome: 0 },
    )
  }, [properties])

  const summaryGrossYield = summary.totalInvestment > 0
    ? (summary.grossAnnualRent / summary.totalInvestment) * 100
    : 0
  const summaryNetYield = summary.totalInvestment > 0
    ? (summary.netAnnualIncome / summary.totalInvestment) * 100
    : 0

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
              BETERBAT · CALCULATRICE
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Rentabilité Locative
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Calculez la rentabilité brute et nette de vos biens immobiliers
            </p>
          </div>
        </div>
      </div>

      {/* Property Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {properties.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
            style={
              activeId === p.id
                ? { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', borderColor: '#3b82f6' }
                : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
            }
          >
            <Home className="h-3.5 w-3.5" />
            {p.name || 'Sans nom'}
            {properties.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); removeProperty(p.id) }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
        <button
          onClick={addProperty}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
          style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>

      {/* Portfolio Summary (if multiple) */}
      {properties.length > 1 && (
        <div className="card p-4 mb-5">
          <div className="text-[11px] font-medium tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            SYNTHÈSE DU PORTEFEUILLE ({properties.length} biens)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>INVESTISSEMENT TOTAL</div>
              <div className="text-base font-bold text-amber-500">{fmt(summary.totalInvestment)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>REVENUS BRUTS / AN</div>
              <div className="text-base font-bold" style={{ color: '#3b82f6' }}>{fmt(summary.grossAnnualRent)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>RENDEMENT BRUT</div>
              <div className="text-base font-bold" style={{ color: '#3b82f6' }}>{fmtPct(summaryGrossYield)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>RENDEMENT NET</div>
              <div className="text-base font-bold" style={{ color: summaryNetYield >= 5 ? '#22c55e' : summaryNetYield >= 3 ? '#f59e0b' : '#ef4444' }}>
                {fmtPct(summaryNetYield)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Input Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Property Name */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-medium tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                INFORMATIONS DU BIEN
              </div>
              <button onClick={resetActive} className="btn-secondary text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Nom du bien
              </label>
              <input
                type="text"
                className="input-field"
                value={active.name}
                onChange={(e) => updateActive({ name: e.target.value })}
                placeholder="Ex: Appartement T2 Trois-Îlets"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Prix d'achat" value={active.purchasePrice} onChange={(v) => updateActive({ purchasePrice: v })} suffix="€" />
              <Field label="Frais de notaire" value={active.notaryFees} onChange={(v) => updateActive({ notaryFees: v })} suffix="%" step={0.5} />
              <Field label="Travaux / Rénovation" value={active.renovationCost} onChange={(v) => updateActive({ renovationCost: v })} suffix="€" />
            </div>
          </div>

          {/* Revenues */}
          <div className="card p-5">
            <div className="text-xs font-medium tracking-wider mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              REVENUS LOCATIFS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Loyer mensuel" value={active.monthlyRent} onChange={(v) => updateActive({ monthlyRent: v })} suffix="€" />
              <Field label="Taux de vacance" value={active.vacancyRatePct} onChange={(v) => updateActive({ vacancyRatePct: v })} suffix="%" step={0.5} />
            </div>
          </div>

          {/* Expenses */}
          <div className="card p-5">
            <div className="text-xs font-medium tracking-wider mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              CHARGES ET DÉPENSES
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Charges mensuelles" value={active.monthlyCharges} onChange={(v) => updateActive({ monthlyCharges: v })} suffix="€" />
              <Field label="Taxe foncière / an" value={active.annualTax} onChange={(v) => updateActive({ annualTax: v })} suffix="€" />
              <Field label="Assurance PNO / an" value={active.annualInsurance} onChange={(v) => updateActive({ annualInsurance: v })} suffix="€" />
              <Field label="Frais de gestion" value={active.managementFeePct} onChange={(v) => updateActive({ managementFeePct: v })} suffix="%" step={0.5} />
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {/* KPIs */}
          <KpiCard
            icon={TrendingUp}
            label="RENDEMENT BRUT"
            value={fmtPct(m.grossYield)}
            color="#3b82f6"
            sub={`${fmt(m.grossAnnualRent)} / an`}
          />
          <KpiCard
            icon={PiggyBank}
            label="RENDEMENT NET"
            value={fmtPct(m.netYield)}
            color={m.netYield >= 5 ? '#22c55e' : m.netYield >= 3 ? '#f59e0b' : '#ef4444'}
            sub={`${fmt(m.netAnnualIncome)} / an`}
          />
          <KpiCard
            icon={Wallet}
            label="CASH-FLOW MENSUEL"
            value={fmt(m.monthlyCashFlow)}
            color={m.monthlyCashFlow >= 0 ? '#22c55e' : '#ef4444'}
          />
          <KpiCard
            icon={Home}
            label="INVESTISSEMENT TOTAL"
            value={fmt(m.totalInvestment)}
            color="#f59e0b"
            sub={`Acquisition + Notaire + Travaux`}
          />

          {/* Breakdown */}
          <div className="card p-4">
            <div className="text-[11px] font-medium tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              DÉTAIL ANNUEL
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Loyers bruts', value: m.grossAnnualRent, color: '#3b82f6' },
                { label: 'Loyers effectifs (− vacance)', value: m.effectiveAnnualRent, color: '#60a5fa' },
                { label: 'Charges', value: -(active.monthlyCharges * 12), color: '#ef4444' },
                { label: 'Taxe foncière', value: -active.annualTax, color: '#ef4444' },
                { label: 'Assurance PNO', value: -active.annualInsurance, color: '#ef4444' },
                { label: 'Frais de gestion', value: -m.managementFees, color: '#ef4444' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                  <span className="font-medium" style={{ color: row.color }}>
                    {row.value >= 0 ? '' : '−'} {fmt(Math.abs(row.value))}
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 flex justify-between items-center font-bold" style={{ borderTop: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-primary)' }}>Revenu net annuel</span>
                <span style={{ color: m.netAnnualIncome >= 0 ? '#22c55e' : '#ef4444' }}>
                  {fmt(m.netAnnualIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Yield gauge visual */}
          <div className="card p-4">
            <div className="text-[11px] font-medium tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              INDICATEUR DE RENDEMENT NET
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(m.netYield / 10 * 100, 0), 100)}%`,
                  background: m.netYield >= 5
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : m.netYield >= 3
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              <span>0%</span>
              <span className="font-medium" style={{
                color: m.netYield >= 5 ? '#22c55e' : m.netYield >= 3 ? '#f59e0b' : '#ef4444'
              }}>
                {m.netYield >= 7 ? 'Excellent' : m.netYield >= 5 ? 'Bon' : m.netYield >= 3 ? 'Moyen' : 'Faible'}
              </span>
              <span>10%+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 text-[10px] text-center tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
        Rendement brut = Loyers bruts / Investissement total · Rendement net = (Loyers effectifs − Charges) / Investissement total
        · Les calculs sont indicatifs et ne constituent pas un conseil en investissement
      </div>
    </div>
  )
}
