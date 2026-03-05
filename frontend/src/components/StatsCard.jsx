export default function StatsCard({ title, value, subtitle, color = 'text-white', icon }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-slate-400 text-sm font-medium truncate">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl opacity-50 flex-shrink-0 ml-2">{icon}</span>}
      </div>
    </div>
  )
}
