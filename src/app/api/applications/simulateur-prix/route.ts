import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'

/* ─── Lot data (same as front-end) ─── */

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

/* ─── Simulation logic ─── */

export function simulatePricing(coeffs: Partial<Record<Floor, number>>, bat?: string) {
  const mergedCoeffs: Record<Floor, number> = {
    'R-1': coeffs['R-1'] ?? 1.0,
    'RDC': coeffs['RDC'] ?? 1.0,
    'R+1': coeffs['R+1'] ?? 1.0,
    'R+2': coeffs['R+2'] ?? 1.0,
  }

  const totalGlobal = ALL_LOTS.reduce((s, l) => s + l.prix, 0)
  const standardLots = ALL_LOTS.filter(l => l.etage !== 'DUPLEX')
  const totalStandard = standardLots.reduce((s, l) => s + l.prix, 0)
  const weightedSum = standardLots.reduce((s, l) => s + l.prix * (mergedCoeffs[l.etage as Floor] || 1), 0)
  const lambda = totalStandard / weightedSum

  const computedLots = ALL_LOTS.map((lot) => {
    if (lot.etage === 'DUPLEX') return { ...lot, newPrix: lot.prix, delta: 0, coeff: null as number | null }
    const coeff = mergedCoeffs[lot.etage as Floor] || 1
    const newPrix = Math.round((lot.prix * coeff * lambda) / 500) * 500
    return { ...lot, newPrix, delta: newPrix - lot.prix, coeff }
  })

  let displayLots = bat && bat !== 'all' ? computedLots.filter(l => l.bat === bat) : computedLots
  const totalNew = computedLots.reduce((s, l) => s + l.newPrix, 0)

  const impliedRates: Record<string, { original: number; nouveau: number }> = {}
  for (const f of FLOORS) {
    const lotsFloor = standardLots.filter(l => l.etage === f)
    const avgPrixM2 = lotsFloor.length > 0
      ? lotsFloor.reduce((s, l) => s + l.prix / l.habitable, 0) / lotsFloor.length
      : 0
    impliedRates[f] = { original: Math.round(avgPrixM2), nouveau: Math.round(avgPrixM2 * (mergedCoeffs[f] || 1) * lambda) }
  }

  return {
    totalProgramme: totalGlobal,
    totalSimule: totalNew,
    ecart: totalNew - totalGlobal,
    coefficients: mergedCoeffs,
    lambda: Math.round(lambda * 100000) / 100000,
    prixMoyenParEtage: impliedRates,
    lots: displayLots.map(l => ({
      id: l.id,
      bat: l.bat,
      etage: l.etage,
      type: l.type,
      habitable: l.habitable,
      prixActuel: l.prix,
      nouveauPrix: l.newPrix,
      ecart: l.delta,
      coeff: l.coeff,
    })),
    nombreLots: displayLots.length,
  }
}

/* ─── API Route ─── */

export async function POST(request: Request) {
  try {
    const { valid } = await validateApiKey(request)
    if (!valid) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })

    const body = await request.json()
    const coeffs = body.coefficients || {}
    const bat = body.batiment as string | undefined

    const result = simulatePricing(coeffs, bat)
    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { valid } = await validateApiKey(request)
    if (!valid) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })

    const result = simulatePricing({})
    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
