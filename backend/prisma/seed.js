const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function rand(min, max) {
  return min + Math.random() * (max - min)
}
function addDays(d, n) {
  return new Date(d.getTime() + n * 86_400_000)
}
function addHours(d, h) {
  return new Date(d.getTime() + h * 3_600_000)
}

// Approximate XAUUSD price at a given date (piecewise linear)
function getGoldPrice(date) {
  const t = (date - new Date('2021-01-01')) / (365.25 * 86_400_000)
  const nodes = [
    [0.0, 1900], [0.5, 1800], [1.0, 1800],
    [1.5, 1650], [2.0, 1950], [2.5, 2150],
    [3.0, 2300], [3.5, 2500], [4.0, 2600],
    [4.5, 2700], [5.0, 2950]
  ]
  let lo = nodes[0]
  let hi = nodes[nodes.length - 1]
  for (let i = 0; i < nodes.length - 1; i++) {
    if (t >= nodes[i][0] && t <= nodes[i + 1][0]) {
      lo = nodes[i]; hi = nodes[i + 1]; break
    }
  }
  const frac = (t - lo[0]) / (hi[0] - lo[0])
  return lo[1] + (hi[1] - lo[1]) * frac + rand(-15, 15)
}

async function main() {
  console.log('🌱 Clearing old data...')
  await prisma.dailyStat.deleteMany()
  await prisma.trade.deleteMany()

  const INITIAL_BALANCE = 10_000
  let balance = INITIAL_BALANCE
  const trades = []
  const dailyMap = new Map()

  let d = new Date('2021-01-04')
  const end = new Date()

  while (d < end) {
    const dow = d.getDay()
    if (dow === 0 || dow === 6) { d = addDays(d, 1); continue }

    // ~45% chance of having signals on a given trading day
    if (Math.random() > 0.45) { d = addDays(d, 1); continue }

    const tradesPerDay = Math.random() < 0.15 ? 2 : 1
    const dayKey = d.toISOString().slice(0, 10)
    let dayProfit = 0
    let dayWins = 0
    let dayLosses = 0

    for (let t = 0; t < tradesPerDay; t++) {
      const isLondon = Math.random() < 0.5
      const hour = isLondon ? rand(8, 11.5) : rand(13.5, 17)

      const openTime = new Date(d)
      openTime.setUTCHours(Math.floor(hour), Math.floor((hour % 1) * 60), 0, 0)

      const type  = Math.random() < 0.53 ? 'BUY' : 'SELL'
      const isWin = Math.random() < 0.52
      const openPrice = parseFloat(getGoldPrice(d).toFixed(2))
      const atr     = rand(12, 28)
      const slDist  = atr * 1.5
      const tpDist  = atr * 3.0

      let closePrice, pips
      if (type === 'BUY') {
        closePrice = isWin ? openPrice + tpDist : openPrice - slDist
        pips = isWin ? tpDist : -slDist
      } else {
        closePrice = isWin ? openPrice - tpDist : openPrice + slDist
        pips = isWin ? tpDist : -slDist
      }

      const lotSize = 0.05
      // XAUUSD: 1 lot = 100 oz. profit = pips ($ move) × lotSize × 100
      const profit = parseFloat((pips * lotSize * 100).toFixed(2))
      balance += profit
      dayProfit += profit
      if (profit > 0) dayWins++; else dayLosses++

      const duration = isWin ? rand(0.75, 4) : rand(0.25, 2)

      trades.push({
        symbol: 'XAUUSD',
        type,
        openTime,
        closeTime: addHours(openTime, duration),
        openPrice,
        closePrice: parseFloat(closePrice.toFixed(2)),
        lotSize,
        stopLoss:   parseFloat((type === 'BUY' ? openPrice - slDist : openPrice + slDist).toFixed(2)),
        takeProfit: parseFloat((type === 'BUY' ? openPrice + tpDist : openPrice - tpDist).toFixed(2)),
        profit,
        pips: parseFloat(pips.toFixed(1)),
        status: 'CLOSED',
        comment: `XAU BOS Retest ${type}`,
        magicNumber: 20260305
      })
    }

    dailyMap.set(dayKey, {
      date:        new Date(dayKey + 'T00:00:00.000Z'),
      totalTrades: tradesPerDay,
      wins:        dayWins,
      losses:      dayLosses,
      grossProfit: dayProfit > 0 ? parseFloat(dayProfit.toFixed(2)) : 0,
      grossLoss:   dayProfit < 0 ? parseFloat(Math.abs(dayProfit).toFixed(2)) : 0,
      netProfit:   parseFloat(dayProfit.toFixed(2)),
      equity:      parseFloat(balance.toFixed(2)),
      drawdown:    0
    })

    d = addDays(d, 1)
  }

  // Calculate rolling drawdown
  let peak = INITIAL_BALANCE
  const dailyArr = [...dailyMap.values()].sort((a, b) => a.date - b.date)
  for (const stat of dailyArr) {
    if (stat.equity > peak) peak = stat.equity
    stat.drawdown = parseFloat(((peak - stat.equity) / peak * 100).toFixed(2))
  }

  await prisma.trade.createMany({ data: trades })
  await prisma.dailyStat.createMany({ data: dailyArr })

  console.log(`✅ Seeded ${trades.length} trades and ${dailyArr.length} daily stats`)
  console.log(`   Initial balance : $${INITIAL_BALANCE.toLocaleString()}`)
  console.log(`   Final balance   : $${balance.toFixed(2)}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
