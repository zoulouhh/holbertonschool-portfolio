import { Link } from 'react-router-dom'

const features = [
  { icon: '📈', title: 'Multi-Timeframe',    desc: 'Analyse H1 + signaux M15 + entrée M5 pour un timing précis.' },
  { icon: '🛡️', title: 'Gestion du risque',  desc: 'Calcul automatique du lot, SL/TP ATR, risque fixe 1% par trade.' },
  { icon: '⚡',  title: 'Sessions ciblées',   desc: 'Trading uniquement lors des sessions London et New York.' },
  { icon: '📰', title: 'Filtre news',        desc: 'Pause automatique avant/après Fed, CPI, NFP sur MT5.' },
  { icon: '🔄', title: 'Break-even + Trail', desc: 'Protection du capital dès le 1er R atteint, trailing ATR dynamique.' },
  { icon: '🧱', title: 'BOS + Retest',       desc: 'Entrées uniquement sur cassure de structure avec confirmation retest.' }
]

const steps = [
  { n: '1', title: 'Analyse de tendance',       desc: "Sur H1, le robot vérifie l'alignement des EMA 50 et 200. Seule la direction dominante est tradée." },
  { n: '2', title: 'Détection BOS + Momentum',  desc: 'Sur M15, la cassure d\'un plus haut/bas récent est validée par RSI > 55 ou < 45 et ATR suffisant.' },
  { n: '3', title: 'Entrée au retest',           desc: 'Sur M5, le robot attend le retest du niveau cassé puis entre avec SL 1.5×ATR et TP 3×ATR.' }
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-full px-4 py-1 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-medium">Expert Advisor MQL5 &amp; MQL4</span>
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Robot de trading<br />
              <span className="text-amber-400">XAUUSD</span> automatique
            </h1>
            <p className="text-slate-400 text-lg mb-8 max-w-xl">
              Stratégie algorithmique multi-timeframe basée sur le Break of Structure,
              les EMA dynamiques et la gestion ATR. Compatible MetaTrader 5 et 4.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-lg transition-colors">
                Voir le Dashboard →
              </Link>
              <Link to="/trades" className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-lg transition-colors">
                Historique des trades
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI bar */}
      <section className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Winrate cible',    value: '≥ 45%', color: 'text-emerald-400' },
              { label: 'Profit Factor',    value: '> 1.5', color: 'text-amber-400'   },
              { label: 'Drawdown max',     value: '< 20%', color: 'text-red-400'     },
              { label: 'Données backtest', value: '5 ans', color: 'text-sky-400'     }
            ].map((s, i) => (
              <div key={i}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-slate-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Fonctionnalités</h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          Un EA complet avec tous les filtres nécessaires pour trader l'or de manière disciplinée.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-amber-500/50 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-800 border-y border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Comment ça fonctionne</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Analyser les performances</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Accéder au dashboard pour visualiser les statistiques en temps réel et l'historique complet des trades.
        </p>
        <Link to="/dashboard" className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-4 rounded-lg transition-colors text-lg">
          Ouvrir le Dashboard
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        XAUUSD Algo Robot v1.00 — Expert Advisor MQL5/MQL4
      </footer>
    </div>
  )
}
