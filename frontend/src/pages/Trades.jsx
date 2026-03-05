import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { getTrades }  from '../api/trades'

function Badge({ children, green, red }) {
  const cls = green ? 'bg-emerald-500/20 text-emerald-400'
            : red   ? 'bg-red-500/20 text-red-400'
            : 'bg-slate-700 text-slate-300'
  return <span className={`text-xs px-2 py-0.5 rounded font-semibold ${cls}`}>{children}</span>
}

export default function Trades() {
  const [trades,     setTrades]     = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters,    setFilters]    = useState({ type: '', status: 'CLOSED', page: 1, limit: 25 })
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const fetchTrades = useCallback(() => {
    setLoading(true)
    const params = { ...filters }
    if (!params.type) delete params.type
    getTrades(params)
      .then(res => { setTrades(res.data || []); setPagination(res.pagination) })
      .catch(() => setError('Impossible de charger les trades.'))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const setFilter = (key, value) =>
    setFilters(f => ({ ...f, [key]: value, page: 1 }))

  const setPage = (p) =>
    setFilters(f => ({ ...f, page: p }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Historique des trades</h1>
        <span className="text-slate-400 text-sm">{pagination.total?.toLocaleString()} trade(s)</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['', 'BUY', 'SELL'].map(t => (
          <button key={t || 'ALL'} onClick={() => setFilter('type', t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.type === t
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}>
            {t || 'Tous'}
          </button>
        ))}
        <div className="flex-1" />
        {['CLOSED', 'OPEN'].map(s => (
          <button key={s} onClick={() => setFilter('status', s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === s
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
            }`}>
            {s === 'CLOSED' ? 'Fermés' : 'Ouverts'}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 bg-slate-900 border-b border-slate-700 text-left">
                    {['#', 'Date ouv.', 'Date ferm.', 'Type', 'Ouv.', 'Ferm.', 'Lot', 'SL', 'TP', 'Pips', 'Profit', 'Statut'].map(h => (
                      <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-slate-500">
                        Aucun trade trouvé
                      </td>
                    </tr>
                  ) : trades.map(tr => {
                    const profit = tr.profit ?? 0
                    const pips   = tr.pips   ?? 0
                    return (
                      <tr key={tr.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-500">#{tr.id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {new Date(tr.openTime).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {tr.closeTime
                            ? new Date(tr.closeTime).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge green={tr.type === 'BUY'} red={tr.type === 'SELL'}>{tr.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{tr.openPrice?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-300">{tr.closePrice?.toFixed(2) ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{tr.lotSize}</td>
                        <td className="px-4 py-3 text-red-400/70">{tr.stopLoss?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-emerald-400/70">{tr.takeProfit?.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={pips >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {pips >= 0 ? '+' : ''}{pips.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge green={tr.status === 'OPEN'}>{tr.status === 'CLOSED' ? 'Fermé' : 'Ouvert'}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage(Math.max(1, filters.page - 1))}
                disabled={filters.page <= 1}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                ← Précédent
              </button>
              <span className="text-slate-400 text-sm">
                Page {pagination.page} / {pagination.pages}
              </span>
              <button onClick={() => setPage(Math.min(pagination.pages, filters.page + 1))}
                disabled={filters.page >= pagination.pages}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
