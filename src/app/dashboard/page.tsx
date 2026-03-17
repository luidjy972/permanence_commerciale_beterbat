import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Users, TrendingUp, Clock, DollarSign, CheckCircle2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: commercials }, { data: planningState }, { data: prospectProjects }] = await Promise.all([
    supabase.from('commercials').select('*'),
    supabase.from('planning_state').select('*').eq('id', 1).maybeSingle(),
    supabase.from('prospect_projects').select('id, amount, status'),
  ])

  const totalCommercials = commercials?.length || 0
  const activeCommercials = commercials?.filter((c: any) => c.is_active_in_planning !== false).length || 0
  const prospects = commercials?.filter((c: any) => c.is_prospect === true).length || 0
  const planningWeeks = planningState?.planning_weeks || 0

  const activeProjects = prospectProjects?.filter((p: any) => !['gagne', 'annule'].includes(p.status)).length || 0
  const wonProjects = prospectProjects?.filter((p: any) => p.status === 'gagne') || []
  const pipelineValue = prospectProjects?.filter((p: any) => !['gagne', 'annule'].includes(p.status)).reduce((s: number, p: any) => s + (p.amount || 0), 0) || 0
  const wonValue = wonProjects.reduce((s: number, p: any) => s + (p.amount || 0), 0)

  const formatMoney = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

  const stats = [
    { name: 'Commerciaux', value: totalCommercials.toString(), description: 'Total enregistrés', icon: Users, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { name: 'Actifs au planning', value: activeCommercials.toString(), description: 'Inclus dans la rotation', icon: CalendarDays, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { name: 'Prospects', value: prospects.toString(), description: `${activeProjects} projets actifs`, icon: TrendingUp, gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
    { name: 'Pipeline', value: formatMoney(pipelineValue), description: `${wonProjects.length} gagné(s) • ${formatMoney(wonValue)}`, icon: DollarSign, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { name: 'Semaines planifiées', value: planningWeeks.toString(), description: 'Période configurée', icon: Clock, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Tableau de bord</h1>
        <p style={{ color: 'var(--color-text-secondary)' }} className="mt-1">Vue d&apos;ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-5 hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: stat.gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{stat.name}</p>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/dashboard/planning"
          className="group card p-6 transition-all hover:scale-[1.01]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-accent-light)' }}>
              <CalendarDays className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Planning de permanence</h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Générer et gérer le planning de rotation des commerciaux sur plusieurs semaines.
          </p>
        </Link>

        <Link
          href="/dashboard/commercials"
          className="group card p-6 transition-all hover:scale-[1.01]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Gestion des commerciaux</h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Ajouter, modifier et suivre les informations de vos commerciaux et prospects.
          </p>
        </Link>

        <Link
          href="/dashboard/prospection"
          className="group card p-6 transition-all hover:scale-[1.01]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Prospection</h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Suivi et gestion de la prospection commerciale avec pipeline et KPIs.
          </p>
        </Link>
      </div>
    </div>
  )
}
