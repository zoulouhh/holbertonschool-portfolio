import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const METHODS = [
  { value: 'BANK',         label: 'Virement bancaire',    icon: '🏦' },
  { value: 'CRYPTO_USDT',  label: 'Crypto — USDT (TRC20)', icon: '💠' },
  { value: 'CRYPTO_BTC',   label: 'Crypto — Bitcoin',      icon: '₿'  },
  { value: 'CARD',         label: 'Carte bancaire',         icon: '💳' },
]

const STATUS_BADGE = {
  PENDING:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED:  'bg-red-500/20 text-red-400 border-red-500/30',
}
const STATUS_LABEL = { PENDING: 'En attente', CONFIRMED: 'Confirmé', REJECTED: 'Refusé' }

export default function Deposits() {
  const [deposits, setDeposits]   = useState([])
  const [loading,  setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ amount: '', method: 'BANK', txHash: '' })
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/deposits')
      setDeposits(data)
    } catch {
      showToast('Impossible de charger les dépôts.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const total     = deposits.reduce((s, d) => d.status === 'CONFIRMED' ? s + d.amount : s, 0)
  const pending   = deposits.filter(d => d.status === 'PENDING').length
  const totalDeps = deposits.length

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.amount || isFloat(form.amount) === false) return showToast('Montant invalide.', 'error')
    setSubmitting(true)
    try {
      await client.post('/deposits', {
        amount: parseFloat(form.amount),
        method: form.method,
        txHash: form.txHash || null,
      })
      setForm({ amount: '', method: 'BANK', txHash: '' })
      showToast('Demande de dépôt envoyée !')
      load()
    } catch (err) {
      showToast(err?.response?.data?.error || 'Erreur lors de la demande.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border text-sm font-medium shadow-xl transition-all ${
          toast.type === 'error'
            ? 'bg-red-900/80 text-red-300 border-red-700'
            : 'bg-emerald-900/80 text-emerald-300 border-emerald-700'
        }`}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">💰 Dépôts</h1>
        <p className="text-slate-400 text-sm mt-1">Alimentez votre compte de trading</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total déposé" value={`$${total.toFixed(2)}`}  color="emerald" icon="💵" />
        <StatCard label="En attente"   value={pending}                  color="amber"   icon="⏳" />
        <StatCard label="Nb dépôts"    value={totalDeps}                color="blue"    icon="📋" />
      </div>

      {/* Form */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-5">Nouvelle demande de dépôt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Montant (USD)</label>
              <input
                type="number" min="10" step="0.01"
                placeholder="ex: 500"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Méthode</label>
              <select
                value={form.method}
                onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
              >
                {METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>
          </div>
          {(form.method === 'CRYPTO_USDT' || form.method === 'CRYPTO_BTC') && (
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Hash de transaction (optionnel)</label>
              <input
                type="text" placeholder="0x..."
                value={form.txHash}
                onChange={e => setForm(p => ({ ...p, txHash: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-mono"
              />
            </div>
          )}
          {form.method === 'BANK' && (
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 text-xs text-slate-400 space-y-1">
              <p className="text-slate-300 font-medium">Coordonnées bancaires</p>
              <p>IBAN : <span className="text-white font-mono">FR76 1234 5678 9012 3456 7890 123</span></p>
              <p>BIC : <span className="text-white font-mono">BNPAFRPPXXX</span></p>
              <p>Référence : <span className="text-amber-400 font-mono">XAUUSD-DEPOSIT</span></p>
            </div>
          )}
          <button
            type="submit" disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-2.5 rounded-xl transition-colors text-sm"
          >
            {submitting ? 'Envoi en cours…' : '✅ Soumettre le dépôt'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Historique des dépôts</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement…</div>
        ) : deposits.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucun dépôt pour l'instant</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Date','Montant','Méthode','Hash TX','Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {deposits.map(d => (
                  <tr key={d.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">+${d.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{METHODS.find(m => m.value === d.method)?.icon} {METHODS.find(m => m.value === d.method)?.label}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{d.txHash ? d.txHash.slice(0,14)+'…' : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_BADGE[d.status]}`}>
                        {STATUS_LABEL[d.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  const colors = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    amber:   'border-amber-500/30   bg-amber-500/5   text-amber-400',
    blue:    'border-blue-500/30    bg-blue-500/5    text-blue-400',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}

function isFloat(v) { return !isNaN(parseFloat(v)) && parseFloat(v) > 0 }
