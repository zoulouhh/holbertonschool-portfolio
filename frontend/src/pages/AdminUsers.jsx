import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function AdminUsers() {
  const { user: me }                         = useAuth()
  const [users,       setUsers]              = useState([])
  const [loading,     setLoading]            = useState(true)
  const [toast,       setToast]              = useState(null)
  // Create form
  const [newUser,     setNewUser]            = useState({ username: '', password: '' })
  const [creating,    setCreating]           = useState(false)
  const [showPass,    setShowPass]           = useState(false)
  // Change password modal
  const [pwdModal,    setPwdModal]           = useState(null) // { id, username }
  const [newPwd,      setNewPwd]             = useState('')
  const [savingPwd,   setSavingPwd]          = useState(false)
  // Delete confirm
  const [delConfirm,  setDelConfirm]         = useState(null) // id

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/api/users')
      setUsers(data)
    } catch {
      showToast('Impossible de charger les utilisateurs.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Create ── */
  const handleCreate = async e => {
    e.preventDefault()
    setCreating(true)
    try {
      await client.post('/api/users', newUser)
      setNewUser({ username: '', password: '' })
      showToast(`✅ Compte « ${newUser.username} » créé !`)
      load()
    } catch (err) {
      showToast(err?.response?.data?.error || 'Erreur création.', 'error')
    } finally {
      setCreating(false)
    }
  }

  /* ── Change password ── */
  const handleChangePwd = async () => {
    if (!newPwd || newPwd.length < 6) return showToast('Min 6 caractères.', 'error')
    setSavingPwd(true)
    try {
      await client.patch(`/api/users/${pwdModal.id}/password`, { password: newPwd })
      showToast('Mot de passe mis à jour !')
      setPwdModal(null)
      setNewPwd('')
    } catch (err) {
      showToast(err?.response?.data?.error || 'Erreur.', 'error')
    } finally {
      setSavingPwd(false)
    }
  }

  /* ── Delete ── */
  const handleDelete = async id => {
    try {
      await client.delete(`/api/users/${id}`)
      showToast('Utilisateur supprimé.')
      setDelConfirm(null)
      load()
    } catch (err) {
      showToast(err?.response?.data?.error || 'Erreur suppression.', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border text-sm font-medium shadow-xl ${
          toast.type === 'error'
            ? 'bg-red-900/90 text-red-300 border-red-700'
            : 'bg-emerald-900/90 text-emerald-300 border-emerald-700'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">⚙️ Administration</h1>
          <p className="text-slate-400 text-sm mt-1">Gestion des comptes utilisateurs</p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          Connecté en tant que <span className="text-amber-400 font-medium">{me?.username}</span>
        </div>
      </div>

      {/* Prisma Studio link */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-blue-300 font-semibold text-sm">🗄️ Prisma Studio — Accès direct à la base de données</p>
          <p className="text-blue-400/70 text-xs mt-1">Visualiser et modifier toutes les tables directement</p>
        </div>
        <a
          href="http://localhost:5555"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          Ouvrir Prisma Studio →
        </a>
      </div>

      {/* Create user form */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-5">➕ Créer un compte</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Nom d'utilisateur</label>
              <input
                type="text"
                placeholder="ex: alice"
                value={newUser.username}
                onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 caractères"
                  value={newUser.password}
                  onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit" disabled={creating}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {creating ? 'Création…' : '✅ Créer le compte'}
          </button>
        </form>
      </div>

      {/* Users table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">👥 Comptes ({users.length})</h2>
          <button onClick={load} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">↻ Actualiser</button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['ID','Nom d\'utilisateur','Créé le','Modifié le','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-700/30 transition-colors ${u.id === me?.id ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">#{u.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{u.username}</span>
                        {u.id === me?.id && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">vous</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.updatedAt).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setPwdModal({ id: u.id, username: u.username }); setNewPwd('') }}
                          className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/60 rounded-lg px-2.5 py-1.5 transition-colors"
                        >
                          🔑 Pwd
                        </button>
                        {u.id !== me?.id && (
                          <button
                            onClick={() => setDelConfirm(u.id)}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/60 rounded-lg px-2.5 py-1.5 transition-colors"
                          >
                            🗑️ Suppr
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change password modal */}
      {pwdModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold">🔑 Changer le mot de passe</h3>
            <p className="text-slate-400 text-sm">Compte : <span className="text-amber-400 font-medium">{pwdModal.username}</span></p>
            <input
              type="password"
              placeholder="Nouveau mot de passe (min 6)"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleChangePwd}
                disabled={savingPwd}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {savingPwd ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setPwdModal(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold">🗑️ Confirmer la suppression</h3>
            <p className="text-slate-400 text-sm">Cette action est <span className="text-red-400 font-medium">irréversible</span>. L'utilisateur sera définitivement supprimé.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(delConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={() => setDelConfirm(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
