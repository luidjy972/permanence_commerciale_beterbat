'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RotateCcw,
  Banknote,
  Calendar,
  Percent,
  PiggyBank,
  TrendingUp,
  Shield,
  CreditCard,
} from 'lucide-react'

/* ─── HELPERS ─── */

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const fmtFull = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

const fmtPct = (n: number) => n.toFixed(2) + ' %'

/* ─── MATH ─── */

function computeLoan(
  amount: number,
  annualRate: number,
  durationMonths: number,
  insuranceRatePct: number,
) {
  const monthlyRate = annualRate / 100 / 12
  const monthlyInsurance = (amount * insuranceRatePct) / 100 / 12

  let monthlyPayment: number
  let totalInterest: number

  if (monthlyRate === 0) {
    monthlyPayment = amount / durationMonths
    totalInterest = 0
  } else {
    monthlyPayment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
      (Math.pow(1 + monthlyRate, durationMonths) - 1)
    totalInterest = monthlyPayment * durationMonths - amount
  }

  const totalInsurance = monthlyInsurance * durationMonths
  const totalPaymentWithInsurance = monthlyPayment + monthlyInsurance
  const totalCost = amount + totalInterest + totalInsurance

  return {
    monthlyPayment,
    monthlyInsurance,
    totalPaymentWithInsurance,
    totalInterest,
    totalInsurance,
    totalCost,
  }
}

function buildAmortization(
  amount: number,
  annualRate: number,
  durationMonths: number,
  monthlyPayment: number,
) {
  const monthlyRate = annualRate / 100 / 12
  const rows: { month: number; payment: number; principal: number; interest: number; remaining: number }[] = []
  let remaining = amount

  for (let i = 1; i <= durationMonths; i++) {
    const interest = remaining * monthlyRate
    const principal = monthlyPayment - interest
    remaining = Math.max(remaining - principal, 0)
    rows.push({ month: i, payment: monthlyPayment, principal, interest, remaining })
  }

  return rows
}

/* ─── INPUT COMPONENT ─── */

function Field({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  max?: number
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
          max={max}
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

/* ─── MAIN ─── */

export default function SimulateurCreditPage() {
  const [loanAmount, setLoanAmount] = useState(200000)
  const [annualRate, setAnnualRate] = useState(3.5)
  const [durationYears, setDurationYears] = useState(20)
  const [insuranceRate, setInsuranceRate] = useState(0.34)
  const [monthlyIncome, setMonthlyIncome] = useState(3500)
  const [personalContribution, setPersonalContribution] = useState(20000)
  const [showAmortization, setShowAmortization] = useState(false)

  const durationMonths = durationYears * 12
  const totalFinanced = loanAmount - personalContribution
  const effectiveAmount = Math.max(totalFinanced, 0)

  const loan = useMemo(
    () => computeLoan(effectiveAmount, annualRate, durationMonths, insuranceRate),
    [effectiveAmount, annualRate, durationMonths, insuranceRate],
  )

  const debtRatio = monthlyIncome > 0 ? (loan.totalPaymentWithInsurance / monthlyIncome) * 100 : 0

  const amortization = useMemo(
    () => (showAmortization ? buildAmortization(effectiveAmount, annualRate, durationMonths, loan.monthlyPayment) : []),
    [showAmortization, effectiveAmount, annualRate, durationMonths, loan.monthlyPayment],
  )

  // Yearly summary for amortization
  const yearlySummary = useMemo(() => {
    if (!showAmortization) return []
    const years: { year: number; principal: number; interest: number; remaining: number }[] = []
    for (let y = 0; y < durationYears; y++) {
      const slice = amortization.slice(y * 12, (y + 1) * 12)
      if (slice.length === 0) break
      years.push({
        year: y + 1,
        principal: slice.reduce((s, r) => s + r.principal, 0),
        interest: slice.reduce((s, r) => s + r.interest, 0),
        remaining: slice[slice.length - 1].remaining,
      })
    }
    return years
  }, [showAmortization, amortization, durationYears])

  const reset = () => {
    setLoanAmount(200000)
    setAnnualRate(3.5)
    setDurationYears(20)
    setInsuranceRate(0.34)
    setMonthlyIncome(3500)
    setPersonalContribution(20000)
  }

  // Cost distribution for visual bar
  const capitalPct = loan.totalCost > 0 ? (effectiveAmount / loan.totalCost) * 100 : 0
  const interestPct = loan.totalCost > 0 ? (loan.totalInterest / loan.totalCost) * 100 : 0
  const insurancePct = loan.totalCost > 0 ? (loan.totalInsurance / loan.totalCost) * 100 : 0

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

        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: 'var(--color-accent)' }}>
            BETERBAT · SIMULATEUR
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Simulateur de Crédit Immobilier
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Estimez vos mensualités, le coût total et votre taux d&apos;endettement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 space-y-5">
          {/* Loan Parameters */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-medium tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                PARAMÈTRES DU PRÊT
              </div>
              <button onClick={reset} className="btn-secondary text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Montant du bien" value={loanAmount} onChange={setLoanAmount} suffix="€" />
              <Field label="Apport personnel" value={personalContribution} onChange={setPersonalContribution} suffix="€" />
              <Field label="Taux annuel" value={annualRate} onChange={setAnnualRate} suffix="%" step={0.05} />
              <Field label="Durée" value={durationYears} onChange={setDurationYears} suffix="ans" min={1} max={30} />
              <Field label="Assurance emprunteur" value={insuranceRate} onChange={setInsuranceRate} suffix="%" step={0.01} />
              <Field label="Revenus mensuels nets" value={monthlyIncome} onChange={setMonthlyIncome} suffix="€" />
            </div>
          </div>

          {/* Sliders for quick adjustment */}
          <div className="card p-5">
            <div className="text-xs font-medium tracking-wider mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              AJUSTEMENT RAPIDE
            </div>
            <div className="space-y-5">
              {/* Amount slider */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Montant emprunté</span>
                  <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{fmt(effectiveAmount)}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={1000000}
                  step={5000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: '#22c55e' }}
                />
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>10 000 €</span>
                  <span>1 000 000 €</span>
                </div>
              </div>

              {/* Rate slider */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Taux annuel</span>
                  <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>{annualRate.toFixed(2)} %</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={10}
                  step={0.05}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: '#3b82f6' }}
                />
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>0,10 %</span>
                  <span>10,00 %</span>
                </div>
              </div>

              {/* Duration slider */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Durée</span>
                  <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{durationYears} ans</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={durationYears}
                  onChange={(e) => setDurationYears(parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: '#f59e0b' }}
                />
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>1 an</span>
                  <span>30 ans</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Distribution */}
          <div className="card p-5">
            <div className="text-xs font-medium tracking-wider mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              RÉPARTITION DU COÛT TOTAL — {fmt(loan.totalCost)}
            </div>

            {/* Stacked bar */}
            <div className="flex h-6 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="transition-all duration-300"
                style={{ width: `${capitalPct}%`, background: '#22c55e' }}
                title={`Capital: ${fmt(effectiveAmount)}`}
              />
              <div
                className="transition-all duration-300"
                style={{ width: `${interestPct}%`, background: '#3b82f6' }}
                title={`Intérêts: ${fmt(loan.totalInterest)}`}
              />
              <div
                className="transition-all duration-300"
                style={{ width: `${insurancePct}%`, background: '#f59e0b' }}
                title={`Assurance: ${fmt(loan.totalInsurance)}`}
              />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {[
                { label: 'Capital', value: effectiveAmount, color: '#22c55e', pct: capitalPct },
                { label: 'Intérêts', value: loan.totalInterest, color: '#3b82f6', pct: interestPct },
                { label: 'Assurance', value: loan.totalInsurance, color: '#f59e0b', pct: insurancePct },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                  <span className="font-semibold" style={{ color: item.color }}>{fmt(item.value)}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>({item.pct.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amortization Table */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowAmortization((v) => !v)}
              className="w-full px-5 py-3 text-left text-sm font-medium flex items-center justify-between transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span>Tableau d&apos;amortissement annuel</span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {showAmortization ? '▲ Masquer' : '▼ Afficher'}
              </span>
            </button>

            {showAmortization && (
              <div className="overflow-auto">
                <table className="w-full text-[13px]" style={{ minWidth: 500 }}>
                  <thead>
                    <tr
                      className="text-[10px] uppercase tracking-wider"
                      style={{ backgroundColor: 'var(--color-table-header)', color: 'var(--color-text-tertiary)' }}
                    >
                      {['Année', 'Capital remboursé', 'Intérêts payés', 'Capital restant'].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-2.5 font-medium ${h === 'Année' ? 'text-left' : 'text-right'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearlySummary.map((row, i) => (
                      <tr
                        key={row.year}
                        style={{
                          borderTop: '1px solid var(--color-border)',
                          backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-table-row-hover)',
                        }}
                      >
                        <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {row.year}
                        </td>
                        <td className="px-4 py-2 text-right font-medium" style={{ color: '#22c55e' }}>
                          {fmt(row.principal)}
                        </td>
                        <td className="px-4 py-2 text-right" style={{ color: '#3b82f6' }}>
                          {fmt(row.interest)}
                        </td>
                        <td className="px-4 py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                          {fmt(row.remaining)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-table-header)' }}>
                      <td className="px-4 py-3 text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>TOTAL</td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: '#22c55e' }}>
                        {fmt(yearlySummary.reduce((s, r) => s + r.principal, 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: '#3b82f6' }}>
                        {fmt(yearlySummary.reduce((s, r) => s + r.interest, 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text-tertiary)' }}>
                        {fmt(0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          <KpiCard
            icon={Banknote}
            label="MENSUALITÉ (HORS ASSURANCE)"
            value={fmtFull(loan.monthlyPayment)}
            color="#22c55e"
          />
          <KpiCard
            icon={CreditCard}
            label="MENSUALITÉ TOTALE"
            value={fmtFull(loan.totalPaymentWithInsurance)}
            color="#16a34a"
            sub={`dont ${fmtFull(loan.monthlyInsurance)} d'assurance`}
          />
          <KpiCard
            icon={TrendingUp}
            label="COÛT TOTAL DES INTÉRÊTS"
            value={fmt(loan.totalInterest)}
            color="#3b82f6"
            sub={`sur ${durationYears} ans`}
          />
          <KpiCard
            icon={Shield}
            label="COÛT TOTAL ASSURANCE"
            value={fmt(loan.totalInsurance)}
            color="#f59e0b"
            sub={`${insuranceRate} % / an`}
          />
          <KpiCard
            icon={PiggyBank}
            label="COÛT TOTAL DU CRÉDIT"
            value={fmt(loan.totalCost)}
            color="var(--color-text-primary)"
            sub={`Capital + Intérêts + Assurance`}
          />

          {/* Debt ratio gauge */}
          <div className="card p-4">
            <div className="text-[11px] font-medium tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              TAUX D&apos;ENDETTEMENT
            </div>
            <div className="text-center mb-2">
              <span
                className="text-3xl font-bold"
                style={{
                  color: debtRatio <= 33 ? '#22c55e' : debtRatio <= 35 ? '#f59e0b' : '#ef4444',
                }}
              >
                {fmtPct(debtRatio)}
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(debtRatio / 50 * 100, 100)}%`,
                  background:
                    debtRatio <= 33
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : debtRatio <= 35
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                }}
              />
              {/* 33% threshold line */}
              <div
                className="absolute inset-y-0 w-0.5"
                style={{ left: `${(33 / 50) * 100}%`, backgroundColor: 'var(--color-text-tertiary)', opacity: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              <span>0%</span>
              <span style={{ color: 'var(--color-text-tertiary)', left: `${(33 / 50) * 100}%`, position: 'relative' }}>
                Seuil 33%
              </span>
              <span>50%</span>
            </div>
            <div
              className="text-center text-xs font-medium mt-2"
              style={{
                color: debtRatio <= 33 ? '#22c55e' : debtRatio <= 35 ? '#f59e0b' : '#ef4444',
              }}
            >
              {debtRatio <= 33 ? '✓ Endettement acceptable' : debtRatio <= 35 ? '⚠ Limite HCSF atteinte' : '✗ Endettement excessif'}
            </div>
          </div>

          {/* Quick summary */}
          <div className="card p-4">
            <div className="text-[11px] font-medium tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              RÉCAPITULATIF
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Prix du bien', value: fmt(loanAmount) },
                { label: 'Apport personnel', value: fmt(personalContribution) },
                { label: 'Montant emprunté', value: fmt(effectiveAmount) },
                { label: 'Durée', value: `${durationYears} ans (${durationMonths} mois)` },
                { label: 'Taux nominal', value: `${annualRate.toFixed(2)} %` },
                { label: 'Assurance', value: `${insuranceRate.toFixed(2)} %` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-[10px] text-center tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
        Mensualité = [Capital × Taux mensuel × (1 + Taux)^n] / [(1 + Taux)^n − 1]
        · Taux d&apos;endettement recommandé ≤ 33% (HCSF)
        · Simulation indicative, non contractuelle
      </div>
    </div>
  )
}
