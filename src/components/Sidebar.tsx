'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  TrendingUp,
  Settings,
  KeyRound,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Planning', href: '/dashboard/planning', icon: CalendarDays },
  { name: 'Commerciaux', href: '/dashboard/commercials', icon: Users },
  { name: 'Prospection', href: '/dashboard/prospection', icon: TrendingUp },
  { name: 'Utilisateurs', href: '/dashboard/users', icon: Settings },
  { name: 'Paramètres API', href: '/dashboard/settings', icon: KeyRound },
]

interface SidebarProps {
  isOpen: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export default function Sidebar({ isOpen, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        transition-all duration-300 ease-in-out
        lg:relative lg:z-auto lg:translate-x-0 lg:shrink-0 lg:h-full
        print:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}
      style={{ backgroundColor: 'var(--color-bg-sidebar)' }}
    >
      {/* Logo header */}
      <div className="flex items-center justify-between px-4 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <img
            src="https://www.beterbat.com/front/theme/images/logos/logo-beterbat.gif"
            alt="Beterbat"
            className="h-10"
          />
        )}
        {collapsed && (
          <img
            src="https://www.beterbat.com/front/theme/images/logos/logo-beterbat.gif"
            alt="Beterbat"
            className="h-8 mx-auto"
            style={{ objectFit: 'contain', maxWidth: '40px' }}
          />
        )}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              } : {}}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-sidebar-hover)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onClick={onClose}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-full py-3 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
        {!collapsed && (
          <div className="px-6 py-3">
            <p className="text-xs text-slate-500">© Beterbat {new Date().getFullYear()}</p>
            <p className="text-xs text-slate-600 mt-0.5">Gestion Commerciale v2.0</p>
          </div>
        )}
      </div>
    </aside>
  )
}
