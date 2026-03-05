import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/',            label: 'Accueil',       icon: '🏠', public: true  },
  { to: '/dashboard',   label: 'Dashboard',     icon: '📊', public: false },
  { to: '/trades',      label: 'Trades',        icon: '📈', public: false },
  { to: '/deposits',    label: 'Dépôts',        icon: '💰', public: false },
  { to: '/withdrawals', label: 'Retraits',      icon: '🏧', public: false },
  { to: '/referral',    label: 'Referral',      icon: '🤝', public: false },
  { to: '/admin/users', label: 'Admin',         icon: '⚙️', public: false },
]

export default function Navbar() {
  const { pathname }         = useLocation()
  const { user, logout }     = useAuth()
  const navigate              = useNavigate()
  const [open, setOpen]       = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    setOpen(false)
  }

  const visibleLinks = NAV_LINKS.filter(l => l.public || user)

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0" onClick={() => setOpen(false)}>
            <span className="text-amber-400 text-2xl">⬡</span>
            <span className="text-white font-bold text-base group-hover:text-amber-400 transition-colors whitespace-nowrap">
              XAUUSD Robot
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {visibleLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  pathname === l.to
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span className="text-base">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side: user info + login/logout */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-400 border border-slate-700 rounded-lg px-3 py-1.5">
                  <span>👤</span>
                  <span className="text-slate-200 font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-lg px-3 py-2 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                🔐 Connexion
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(p => !p)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
            aria-label="Menu"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-700 px-4 py-3 space-y-1">
          {visibleLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                pathname === l.to
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-700 mt-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                  <span>👤</span>
                  <span className="text-slate-200 font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  🚪 Déconnexion
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                🔐 Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
