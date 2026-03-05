import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function EquityChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500">Aucune donnée</div>
  }

  // Down-sample to max 250 points for performance
  const step = Math.max(1, Math.floor(data.length / 250))
  const sampled = data.filter((_, i) => i % step === 0)

  const chartData = {
    labels: sampled.map(d =>
      new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    ),
    datasets: [{
      label: 'Équité ($)',
      data: sampled.map(d => d.equity),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4
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
        callbacks: { label: ctx => `$${ctx.parsed.y.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}` }
      }
    },
    scales: {
      x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', maxTicksLimit: 10 } },
      y: {
        grid: { color: '#1e293b' },
        ticks: { color: '#64748b', callback: v => `$${Number(v).toLocaleString()}` }
      }
    }
  }

  return <Line data={chartData} options={options} />
}
