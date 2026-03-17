'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #0a0f1a 0%, #141926 50%, #1a0a0a 100%)'
          : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #fef2f2 100%)',
      }}
    >
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 h-10 w-10 rounded-xl flex items-center justify-center transition-all"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          boxShadow: 'var(--shadow-card)',
        }}
        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="w-full max-w-md">
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            boxShadow: theme === 'dark'
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="text-center mb-8">
            <img
              src="https://www.beterbat.com/front/theme/images/logos/logo-beterbat.gif"
              alt="Beterbat"
              className="h-14 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Bienvenue</h1>
            <p style={{ color: 'var(--color-text-secondary)' }} className="mt-1">Connectez-vous pour accéder à l&apos;application</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger-light)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-tertiary)' }}>
          © {new Date().getFullYear()} Beterbat — Outil interne
        </p>
      </div>
    </div>
  )
}
