import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Accueil'   },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/trades',    label: 'Trades'    }
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-amber-400 text-2xl">⬡</span>
            <span className="text-white font-bold text-lg group-hover:text-amber-400 transition-colors">
              XAUUSD Robot
            </span>
          </Link>
          <div className="flex gap-6">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'text-amber-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
