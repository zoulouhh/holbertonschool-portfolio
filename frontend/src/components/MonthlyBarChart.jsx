import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function MonthlyBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500">Aucune donnée</div>
  }

  const sliced = data.slice(-24)

  const chartData = {
    labels: sliced.map(d => {
      const [y, m] = d.month.split('-')
      return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    }),
    datasets: [{
      label: 'P&L mensuel',
      data: sliced.map(d => d.profit),
      backgroundColor: sliced.map(d => d.profit >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
      borderColor:     sliced.map(d => d.profit >= 0 ? '#10b981' : '#ef4444'),
      borderWidth: 1,
      borderRadius: 4
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: { label: ctx => `${ctx.parsed.y >= 0 ? '+' : ''}$${ctx.parsed.y.toFixed(2)}` }
      }
    },
    scales: {
      x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', maxTicksLimit: 12 } },
      y: {
        grid: { color: '#1e293b' },
        ticks: { color: '#64748b', callback: v => `$${v >= 0 ? '+' : ''}${Number(v).toFixed(0)}` }
      }
    }
  }

  return <Bar data={chartData} options={options} />
}
