import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await client.post('/auth/login', { username: username.trim(), password })
      login(res.data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (!err.response) {
        setError("Impossible de joindre le serveur. Vérifie que le backend tourne sur le port 3001.")
      } else {
        setError(err.response?.data?.error || 'Erreur de connexion.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mb-4">
            <span className="text-3xl">⬡</span>
          </div>
          <h1 className="text-2xl font-bold text-white">XAUUSD Robot</h1>
          <p className="text-slate-400 text-sm mt-1">Tableau de bord de trading</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">Connexion</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5" htmlFor="username">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 pr-11 text-white placeholder-slate-500
                             focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed
                         text-black font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Hint */}
        <p className="text-center text-slate-500 text-xs mt-4">
          Compte par défaut : <span className="text-slate-400">admin</span> / <span className="text-slate-400">Trading2026!</span>
        </p>
      </div>
    </div>
  )
}
