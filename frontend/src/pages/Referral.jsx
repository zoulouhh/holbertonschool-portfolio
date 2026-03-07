import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Referral() {
  const { user }                        = useAuth()
  const [stats,     setStats]           = useState(null)
  const [referrals, setReferrals]       = useState([])
  const [loading,   setLoading]         = useState(true)
  const [copied,    setCopied]          = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/referral')
      setStats(data.stats)
      setReferrals(data.referrals)
    } catch {
      /* silently fail */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const refCode = stats?.referralCode || (user?.username?.toUpperCase() + '-REF')
  const refLink = `${window.location.origin}/register?ref=${refCode}`

  const copyLink = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const totalCommissions = stats?.totalCommissions ?? 0
  const totalReferred    = referrals.length
  const activeReferred   = referrals.filter(r => r.status === 'ACTIVE').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">🤝 Programme Referral</h1>
        <p className="text-slate-400 text-sm mt-1">Invitez des amis et gagnez des commissions sur leurs performances</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Commissions gagnées" value={`$${totalCommissions.toFixed(2)}`} color="emerald" icon="🏆" />
        <StatCard label="Filleuls actifs"      value={activeReferred}                    color="blue"    icon="👥" />
        <StatCard label="Total invités"        value={totalReferred}                     color="amber"   icon="📨" />
      </div>

      {/* Referral link card */}
      <div className="bg-slate-800 rounded-2xl border border-amber-500/20 p-6">
        <h2 className="text-white font-semibold mb-4">Votre lien de parrainage</h2>
        <div className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Code referral</label>
            <div className="flex items-center gap-3">
              <span className="bg-slate-900 text-amber-400 font-mono text-lg font-bold px-4 py-2.5 rounded-xl border border-amber-500/30 tracking-widest">
                {refCode}
              </span>
            </div>
          </div>
          {/* Link */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Lien d'invitation</label>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={refLink}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-mono focus:outline-none"
              />
              <button
                onClick={copyLink}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500 text-slate-900 border-amber-500 hover:bg-amber-400'
                }`}
              >
                {copied ? '✅ Copié !' : '📋 Copier'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-4">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', icon: '🔗', title: 'Partagez', desc: 'Envoyez votre lien à vos contacts ou sur les réseaux sociaux.' },
            { step: '2', icon: '📝', title: 'Inscription', desc: 'Vos filleuls s\'inscrivent via votre lien et déposent des fonds.' },
            { step: '3', icon: '💰', title: 'Commissions', desc: 'Vous gagnez 10% des bénéfices réalisés par chaque filleul.' },
          ].map(s => (
            <div key={s.step} className="bg-slate-900 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-slate-900 text-xs font-bold rounded-full mb-2">{s.step}</div>
              <p className="text-white font-medium text-sm">{s.title}</p>
              <p className="text-slate-400 text-xs mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals list */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Mes filleuls</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement…</div>
        ) : referrals.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-slate-400 text-sm">Vous n'avez pas encore de filleuls.</p>
            <p className="text-slate-500 text-xs mt-1">Partagez votre lien pour commencer à gagner des commissions !</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Utilisateur','Date d\'inscription','Dépôt total','Commissions','Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">👤 {r.referredUsername || `User #${r.id}`}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-emerald-400">${(r.depositTotal ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-amber-400 font-medium">${r.commission.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        r.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}>
                        {r.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
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
