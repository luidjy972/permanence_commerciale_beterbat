'use client'

import { User, Moon, Sun, Menu } from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface DashboardHeaderProps {
  userEmail?: string
  onMenuToggle?: () => void
}

export default function DashboardHeader({ userEmail, onMenuToggle }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header
      className="px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: 'var(--color-header-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2 text-sm">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span style={{ color: 'var(--color-text-tertiary)' }}>Outil interne</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="relative flex items-center justify-center h-9 w-9 rounded-lg transition-all"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
        {userEmail && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:inline">{userEmail}</span>
          </div>
        )}
      </div>
    </header>
  )
}
