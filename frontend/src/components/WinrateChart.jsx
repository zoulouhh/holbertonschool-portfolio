import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function WinrateChart({ wins, losses }) {
  const chartData = {
    labels: ['Gains', 'Pertes'],
    datasets: [{
      data: [wins, losses],
      backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)'],
      borderColor:     ['#10b981', '#ef4444'],
      borderWidth: 2,
      hoverOffset: 4
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } },
      tooltip: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 }
    }
  }

  const winrate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0'

  return (
    <div className="relative h-full">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '32px' }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{winrate}%</p>
          <p className="text-slate-400 text-xs">winrate</p>
        </div>
      </div>
    </div>
  )
}
