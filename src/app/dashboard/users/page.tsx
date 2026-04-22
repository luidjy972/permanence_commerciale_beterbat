'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppUser } from '@/lib/types'
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Key,
  Shield,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

export default function UsersPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AppUser[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState({ name: '', email: '', role: 'user' as 'admin' | 'user' })
  const [changingPasswordId, setChangingPasswordId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' as 'admin' | 'user' })
  const [status, setStatus] = useState('')
  const [statusError, setStatusError] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: true })

    if (data) setUsers(data)
    if (error) console.error(error)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const showStatus = (msg: string, isError = false) => {
    setStatus(msg)
    setStatusError(isError)
    setTimeout(() => setStatus(''), 5000)
  }

  const addUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showStatus('Tous les champs sont obligatoires.', true)
      return
    }
    if (newUser.password.length < 6) {
      showStatus('Le mot de passe doit contenir au moins 6 caractères.', true)
      return
    }
    try {
      const { error } = await supabase.rpc('create_app_user', {
        p_email: newUser.email.trim(),
        p_password: newUser.password,
        p_name: newUser.name.trim(),
        p_role: newUser.role,
      })
      if (error) throw error
      setNewUser({ name: '', email: '', password: '', role: 'user' })
      setShowAddForm(false)
      showStatus('Utilisateur créé.')
      loadUsers()
    } catch (err: any) {
      showStatus(err.message || 'Erreur lors de la création.', true)
    }
  }

  const startEdit = (u: AppUser) => {
    setEditingId(u.id)
    setEditData({ name: u.name, email: u.email, role: u.role })
  }

  const saveEdit = async (u: AppUser) => {
    if (!editData.name.trim()) {
      showStatus('Le nom est obligatoire.', true)
      return
    }
    if (!editData.email.trim()) {
      showStatus("L'email est obligatoire.", true)
      return
    }
    try {
      const { error } = await supabase.rpc('update_app_user', {
        p_auth_id: u.auth_id,
        p_name: editData.name.trim(),
        p_role: editData.role,
        p_email: editData.email.trim() !== u.email ? editData.email.trim() : null,
      })
      if (error) throw error
      setEditingId(null)
      showStatus('Utilisateur mis à jour.')
      loadUsers()
    } catch (err: any) {
      showStatus(err.message || 'Erreur lors de la mise à jour.', true)
    }
  }

  const startChangePassword = (id: number) => {
    setChangingPasswordId(id)
    setNewPassword('')
  }

  const savePassword = async (u: AppUser) => {
    if (newPassword.length < 6) {
      showStatus('Le mot de passe doit contenir au moins 6 caractères.', true)
      return
    }
    try {
      const { error } = await supabase.rpc('update_user_password', {
        p_auth_id: u.auth_id,
        p_new_password: newPassword,
      })
      if (error) throw error
      setChangingPasswordId(null)
      showStatus('Mot de passe mis à jour.')
    } catch (err: any) {
      showStatus(err.message || 'Erreur lors de la mise à jour du mot de passe.', true)
    }
  }

  const deleteUser = async (u: AppUser) => {
    if (!confirm(`Supprimer l'utilisateur ${u.name || u.email} ?`)) return
    try {
      const { error } = await supabase.rpc('delete_app_user', {
        p_auth_id: u.auth_id,
      })
      if (error) throw error
      showStatus('Utilisateur supprimé.')
      loadUsers()
    } catch (err: any) {
      showStatus(err.message || 'Erreur lors de la suppression.', true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Settings className="h-7 w-7" style={{ color: 'var(--color-text-secondary)' }} />
            Gestion des utilisateurs
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {status && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: statusError ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: statusError ? '#ef4444' : 'var(--color-success)' }}>
          {status}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Nouvel utilisateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nom *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="input-field"
                placeholder="Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="input-field"
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Mot de passe *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="input-field"
                placeholder="Minimum 6 caractères"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rôle</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                className="input-field"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addUser} className="btn-primary">
              <Check className="h-4 w-4" />
              Créer l&apos;utilisateur
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">
              <X className="h-4 w-4" />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-6 py-3 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>Nom</th>
                <th className="px-6 py-3 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>Email</th>
                <th className="px-6 py-3 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>Rôle</th>
                <th className="px-6 py-3 text-right font-medium" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                if (editingId === u.id) {
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-accent-light)' }}>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="input-field !py-1.5"
                          placeholder="Nom"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="input-field !py-1.5"
                          placeholder="email@exemple.com"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={editData.role}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value as 'admin' | 'user' })}
                          className="input-field !py-1.5"
                        >
                          <option value="user">Utilisateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => saveEdit(u)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-success)' }}>
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-tertiary)' }}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                if (changingPasswordId === u.id) {
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-warning-light)' }}>
                      <td className="px-6 py-3 font-medium" colSpan={2} style={{ color: 'var(--color-text-primary)' }}>
                        <span className="text-sm">Nouveau mot de passe pour <strong>{u.name || u.email}</strong></span>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nouveau mot de passe"
                          className="input-field !py-1.5"
                          autoComplete="new-password"
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => savePassword(u)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-success)' }}>
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setChangingPasswordId(null)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-tertiary)' }}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={u.id} className="transition-colors" style={{ borderTop: '1px solid var(--color-border-light)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-table-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td className="px-6 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {u.name || '—'}
                    </td>
                    <td className="px-6 py-3" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={u.role === 'admin'
                          ? { backgroundColor: 'rgba(147, 51, 234, 0.15)', color: '#a855f7' }
                          : { backgroundColor: 'var(--color-accent-light)', color: 'var(--color-text-secondary)' }
                        }>
                        {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                        {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-tertiary)' }}
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startChangePassword(u.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-tertiary)' }}
                          title="Changer le mot de passe"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(u)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-tertiary)' }}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
