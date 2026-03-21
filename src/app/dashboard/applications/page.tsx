import Link from 'next/link'
import { Calculator, CreditCard, PieChart, Lock, Plus, Sparkles } from 'lucide-react'

const apps = [
  {
    name: 'Simulateur Prix',
    description: 'Simulateur tarifaire de la Résidence Vue des Îlets. Ajustez les coefficients par étage pour redistribuer les prix tout en gardant le total global constant.',
    href: '/dashboard/applications/simulateur-prix',
    icon: Calculator,
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    available: true,
  },
  {
    name: 'Calculatrice Rentabilité',
    description: 'Calculez la rentabilité locative brute et nette de vos biens immobiliers en quelques clics.',
    href: '/dashboard/applications/calculatrice-rentabilite',
    icon: PieChart,
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    available: true,
  },
  {
    name: 'Simulateur de Crédit',
    description: 'Estimez les mensualités, le coût total et le taux d\'endettement pour vos projets de financement.',
    href: '/dashboard/applications/simulateur-credit',
    icon: CreditCard,
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    available: true,
  },
]

export default function ApplicationsPage() {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Applications
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Accédez aux outils et mini-applications intégrées
          </p>
        </div>
        <Link
          href="/dashboard/applications/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-red-500/20 hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
        >
          <Sparkles className="h-4 w-4" />
          Créer une application
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* New Application card */}
        <Link href="/dashboard/applications/new" className="block">
          <div
            className="card p-6 transition-all h-full flex flex-col items-center justify-center text-center hover:scale-[1.02] cursor-pointer border-2 border-dashed min-h-[200px]"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Nouvelle application
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              L&apos;assistant IA vous guidera pour créer la spécification
            </p>
          </div>
        </Link>

        {apps.map((app) => {
          const content = (
            <div
              className={`card p-6 transition-all h-full flex flex-col ${
                app.available ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={{
                    background: app.gradient,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {app.available ? (
                    <app.icon className="h-5 w-5 text-white" />
                  ) : (
                    <Lock className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
                    {app.name}
                  </h3>
                  {!app.available && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-accent-light)',
                        color: 'var(--color-accent-text)',
                      }}
                    >
                      À venir
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                {app.description}
              </p>
              {app.available && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                    Ouvrir l&apos;application →
                  </span>
                </div>
              )}
            </div>
          )

          if (app.available) {
            return (
              <Link key={app.name} href={app.href} className="block">
                {content}
              </Link>
            )
          }

          return <div key={app.name}>{content}</div>
        })}
      </div>
    </div>
  )
}
