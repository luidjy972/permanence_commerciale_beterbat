import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'

/* ─── Computation logic (same as front-end) ─── */

interface RentabiliteInput {
  purchase_price: number
  notary_fees_pct?: number
  renovation_cost?: number
  monthly_rent: number
  monthly_charges?: number
  annual_tax?: number
  annual_insurance?: number
  management_fee_pct?: number
  vacancy_rate_pct?: number
}

export function computeRentabilite(input: RentabiliteInput) {
  const purchasePrice = input.purchase_price
  const notaryFeesPct = input.notary_fees_pct ?? 8
  const renovationCost = input.renovation_cost ?? 0
  const monthlyRent = input.monthly_rent
  const monthlyCharges = input.monthly_charges ?? 0
  const annualTax = input.annual_tax ?? 0
  const annualInsurance = input.annual_insurance ?? 0
  const managementFeePct = input.management_fee_pct ?? 0
  const vacancyRatePct = input.vacancy_rate_pct ?? 0

  const totalInvestment = purchasePrice + (purchasePrice * notaryFeesPct / 100) + renovationCost
  const grossAnnualRent = monthlyRent * 12
  const effectiveAnnualRent = grossAnnualRent * (1 - vacancyRatePct / 100)
  const annualCharges = monthlyCharges * 12
  const managementFees = effectiveAnnualRent * managementFeePct / 100
  const totalAnnualExpenses = annualCharges + annualTax + annualInsurance + managementFees
  const netAnnualIncome = effectiveAnnualRent - totalAnnualExpenses
  const grossYield = totalInvestment > 0 ? (grossAnnualRent / totalInvestment) * 100 : 0
  const netYield = totalInvestment > 0 ? (netAnnualIncome / totalInvestment) * 100 : 0
  const monthlyCashFlow = netAnnualIncome / 12

  return {
    parametres: {
      prix_achat: purchasePrice,
      frais_notaire_pct: notaryFeesPct,
      travaux: renovationCost,
      loyer_mensuel: monthlyRent,
      charges_mensuelles: monthlyCharges,
      taxe_fonciere: annualTax,
      assurance_pno: annualInsurance,
      frais_gestion_pct: managementFeePct,
      taux_vacance_pct: vacancyRatePct,
    },
    resultats: {
      investissement_total: Math.round(totalInvestment),
      loyers_bruts_annuels: Math.round(grossAnnualRent),
      loyers_effectifs_annuels: Math.round(effectiveAnnualRent),
      charges_annuelles_totales: Math.round(totalAnnualExpenses),
      revenu_net_annuel: Math.round(netAnnualIncome),
      rendement_brut_pct: Math.round(grossYield * 100) / 100,
      rendement_net_pct: Math.round(netYield * 100) / 100,
      cash_flow_mensuel: Math.round(monthlyCashFlow),
      frais_gestion_annuels: Math.round(managementFees),
    },
  }
}

/* ─── API Route ─── */

export async function POST(request: Request) {
  try {
    const { valid } = await validateApiKey(request)
    if (!valid) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })

    const body = await request.json()

    if (!body.purchase_price || !body.monthly_rent) {
      return NextResponse.json(
        { error: 'Champs obligatoires: purchase_price, monthly_rent' },
        { status: 400 },
      )
    }

    const result = computeRentabilite(body)
    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
