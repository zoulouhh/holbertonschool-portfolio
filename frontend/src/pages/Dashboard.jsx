import { useState, useEffect } from 'react'
import StatsCard      from '../components/StatsCard'
import EquityChart    from '../components/EquityChart'
import WinrateChart   from '../components/WinrateChart'
import MonthlyBarChart from '../components/MonthlyBarChart'
import LoadingSpinner from '../components/LoadingSpinner'
import { getSummary, getEquityCurve, getMonthlyPnL } from '../api/stats'
import { getTrades } from '../api/trades'

function ErrorBox({ message }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <p className="text-red-400 text-lg mb-2">{message}</p>
      <p className="text-slate-400 text-sm">
        Lancer{' '}
        <code className="bg-slate-800 px-2 py-0.5 rounded text-amber-400">npm run dev</code>
        {' '}dans le dossier{' '}
        <code className="bg-slate-800 px-2 py-0.5 rounded">backend/</code>
      </p>
    </div>
  )
}

function TradeRow({ trade }) {
  const profit = trade.profit ?? 0
  const pips   = trade.pips   ?? 0
  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
      <td className="py-3 pr-4 text-slate-400">
        {new Date(trade.openTime).toLocaleDateString('fr-FR')}
      </td>
      <td className="py-3 pr-4">
        <span className={`font-semibold text-xs px-2 py-0.5 rounded ${
          trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {trade.type}
        </span>
      </td>
      <td className="py-3 pr-4 text-slate-300">{trade.openPrice?.toFixed(2)}</td>
      <td className="py-3 pr-4 text-slate-300">{trade.closePrice?.toFixed(2) ?? '—'}</td>
      <td className="py-3 pr-4 text-slate-400">{trade.lotSize}</td>
      <td className="py-3 pr-4">
        <span className={pips >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {pips >= 0 ? '+' : ''}{pips.toFixed(1)}
        </span>
      </td>
      <td className="py-3">
        <span className={`font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
        </span>
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const [summary,      setSummary]      = useState(null)
  const [equityCurve,  setEquityCurve]  = useState([])
  const [monthlyPnL,   setMonthlyPnL]   = useState([])
  const [recentTrades, setRecentTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    Promise.all([
      getSummary(),
      getEquityCurve(),
      getMonthlyPnL(),
      getTrades({ status: 'CLOSED', limit: 10, page: 1 })
    ])
      .then(([s, eq, mn, t]) => {
        setSummary(s)
        setEquityCurve(eq)
        setMonthlyPnL(mn)
        setRecentTrades(t.data || [])
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error)   return <ErrorBox message={error} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard de performance</h1>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Trades"    value={summary.totalTrades.toLocaleString()} icon="📊" />
        <StatsCard title="Winrate"         value={`${summary.winrate}%`}
          color={summary.winrate >= 45 ? 'text-emerald-400' : 'text-red-400'} icon="🎯"
          subtitle={`${summary.wins}W / ${summary.losses}L`} />
        <StatsCard title="Profit Factor"   value={summary.profitFactor}
          color={summary.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'} icon="⚖️" />
        <StatsCard title="Profit net"      value={`$${Number(summary.netProfit).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`}
          color={summary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} icon="💰" />
        <StatsCard title="Drawdown max"    value={`${summary.maxDrawdown}%`}
          color={summary.maxDrawdown < 20 ? 'text-emerald-400' : 'text-red-400'} icon="📉" />
        <StatsCard title="Meilleur trade"  value={`+$${summary.bestTrade}`}  color="text-emerald-400" icon="🏆" />
        <StatsCard title="Pire trade"      value={`$${summary.worstTrade}`}  color="text-red-400"     icon="💥" />
        <StatsCard title="Équité actuelle" value={`$${Number(summary.currentEquity).toLocaleString('fr-FR')}`}
          color="text-amber-400" icon="💼" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-slate-200 font-semibold mb-4">Courbe d'équité</h2>
          <div className="h-64"><EquityChart data={equityCurve} /></div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-slate-200 font-semibold mb-4">Gains / Pertes</h2>
          <div className="h-64"><WinrateChart wins={summary.wins} losses={summary.losses} /></div>
        </div>
      </div>

      {/* Chart row 2 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-slate-200 font-semibold mb-4">P&amp;L mensuel (24 derniers mois)</h2>
        <div className="h-56"><MonthlyBarChart data={monthlyPnL} /></div>
      </div>

      {/* Recent trades */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-slate-200 font-semibold mb-4">10 derniers trades</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-700">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Ouverture</th>
                <th className="pb-3 pr-4">Fermeture</th>
                <th className="pb-3 pr-4">Lot</th>
                <th className="pb-3 pr-4">Pips</th>
                <th className="pb-3">Profit</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map(t => <TradeRow key={t.id} trade={t} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
