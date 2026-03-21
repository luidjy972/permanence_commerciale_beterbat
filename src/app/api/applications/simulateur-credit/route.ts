import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'

/* ─── Computation logic (same as front-end) ─── */

interface CreditInput {
  loan_amount: number
  annual_rate: number
  duration_years: number
  insurance_rate_pct?: number
  personal_contribution?: number
  monthly_income?: number
}

function computeLoan(amount: number, annualRate: number, durationMonths: number, insuranceRatePct: number) {
  const monthlyRate = annualRate / 100 / 12
  const monthlyInsurance = (amount * insuranceRatePct) / 100 / 12

  let monthlyPayment: number
  let totalInterest: number

  if (monthlyRate === 0) {
    monthlyPayment = durationMonths > 0 ? amount / durationMonths : 0
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

  return { monthlyPayment, monthlyInsurance, totalPaymentWithInsurance, totalInterest, totalInsurance, totalCost }
}

function buildYearlySummary(amount: number, annualRate: number, durationMonths: number, monthlyPayment: number, durationYears: number) {
  const monthlyRate = annualRate / 100 / 12
  const rows: { month: number; principal: number; interest: number; remaining: number }[] = []
  let remaining = amount

  for (let i = 1; i <= durationMonths; i++) {
    const interest = remaining * monthlyRate
    const principal = monthlyPayment - interest
    remaining = Math.max(remaining - principal, 0)
    rows.push({ month: i, principal, interest, remaining })
  }

  const years: { annee: number; capital_rembourse: number; interets_payes: number; capital_restant: number }[] = []
  for (let y = 0; y < durationYears; y++) {
    const slice = rows.slice(y * 12, (y + 1) * 12)
    if (slice.length === 0) break
    years.push({
      annee: y + 1,
      capital_rembourse: Math.round(slice.reduce((s, r) => s + r.principal, 0)),
      interets_payes: Math.round(slice.reduce((s, r) => s + r.interest, 0)),
      capital_restant: Math.round(slice[slice.length - 1].remaining),
    })
  }

  return years
}

export function computeCredit(input: CreditInput) {
  const loanAmount = input.loan_amount
  const annualRate = input.annual_rate
  const durationYears = input.duration_years
  const insuranceRate = input.insurance_rate_pct ?? 0.34
  const personalContribution = input.personal_contribution ?? 0
  const monthlyIncome = input.monthly_income ?? 0
  const durationMonths = durationYears * 12
  const effectiveAmount = Math.max(loanAmount - personalContribution, 0)

  const loan = computeLoan(effectiveAmount, annualRate, durationMonths, insuranceRate)
  const debtRatio = monthlyIncome > 0 ? (loan.totalPaymentWithInsurance / monthlyIncome) * 100 : 0

  const capitalPct = loan.totalCost > 0 ? (effectiveAmount / loan.totalCost) * 100 : 0
  const interestPct = loan.totalCost > 0 ? (loan.totalInterest / loan.totalCost) * 100 : 0
  const insurancePct = loan.totalCost > 0 ? (loan.totalInsurance / loan.totalCost) * 100 : 0

  const amortissement = buildYearlySummary(effectiveAmount, annualRate, durationMonths, loan.monthlyPayment, durationYears)

  return {
    parametres: {
      montant_bien: loanAmount,
      apport_personnel: personalContribution,
      montant_emprunte: effectiveAmount,
      taux_annuel_pct: annualRate,
      duree_annees: durationYears,
      duree_mois: durationMonths,
      taux_assurance_pct: insuranceRate,
      revenus_mensuels: monthlyIncome,
    },
    resultats: {
      mensualite_hors_assurance: Math.round(loan.monthlyPayment * 100) / 100,
      mensualite_assurance: Math.round(loan.monthlyInsurance * 100) / 100,
      mensualite_totale: Math.round(loan.totalPaymentWithInsurance * 100) / 100,
      cout_total_interets: Math.round(loan.totalInterest),
      cout_total_assurance: Math.round(loan.totalInsurance),
      cout_total_credit: Math.round(loan.totalCost),
      taux_endettement_pct: Math.round(debtRatio * 100) / 100,
      endettement_acceptable: debtRatio <= 33,
      repartition_pct: {
        capital: Math.round(capitalPct * 10) / 10,
        interets: Math.round(interestPct * 10) / 10,
        assurance: Math.round(insurancePct * 10) / 10,
      },
    },
    amortissement,
  }
}

/* ─── API Route ─── */

export async function POST(request: Request) {
  try {
    const { valid } = await validateApiKey(request)
    if (!valid) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })

    const body = await request.json()

    if (!body.loan_amount || !body.annual_rate || !body.duration_years) {
      return NextResponse.json(
        { error: 'Champs obligatoires: loan_amount, annual_rate, duration_years' },
        { status: 400 },
      )
    }

    const result = computeCredit(body)
    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
