const prisma = require('../prisma')

const getSummary = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { status: 'CLOSED' },
      select: { profit: true, type: true }
    })

    const wins   = trades.filter(t => (t.profit ?? 0) > 0)
    const losses = trades.filter(t => (t.profit ?? 0) <= 0)

    const grossProfit = wins.reduce((s, t) => s + (t.profit ?? 0), 0)
    const grossLoss   = Math.abs(losses.reduce((s, t) => s + (t.profit ?? 0), 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : wins.length > 0 ? 99 : 0
    const winrate      = trades.length > 0 ? (wins.length / trades.length) * 100 : 0

    const [worstDd, lastStat, openCount] = await Promise.all([
      prisma.dailyStat.findFirst({
        orderBy: { drawdown: 'desc' },
        select: { drawdown: true }
      }),
      prisma.dailyStat.findFirst({
        orderBy: { date: 'desc' },
        select: { equity: true }
      }),
      prisma.trade.count({ where: { status: 'OPEN' } })
    ])

    res.json({
      totalTrades:    trades.length,
      wins:           wins.length,
      losses:         losses.length,
      openTrades:     openCount,
      winrate:        parseFloat(winrate.toFixed(2)),
      profitFactor:   parseFloat(profitFactor.toFixed(2)),
      netProfit:      parseFloat((grossProfit - grossLoss).toFixed(2)),
      grossProfit:    parseFloat(grossProfit.toFixed(2)),
      grossLoss:      parseFloat(grossLoss.toFixed(2)),
      maxDrawdown:    worstDd?.drawdown ?? 0,
      currentEquity:  lastStat?.equity ?? 10000,
      bestTrade:      wins.length   > 0 ? parseFloat(Math.max(...wins.map(t => t.profit ?? 0)).toFixed(2))   : 0,
      worstTrade:     losses.length > 0 ? parseFloat(Math.min(...losses.map(t => t.profit ?? 0)).toFixed(2)) : 0
    })
  } catch (err) {
    next(err)
  }
}

const getEquityCurve = async (req, res, next) => {
  try {
    const stats = await prisma.dailyStat.findMany({
      orderBy: { date: 'asc' },
      select: { date: true, equity: true, drawdown: true }
    })
    res.json(stats)
  } catch (err) {
    next(err)
  }
}

const getMonthlyPnL = async (req, res, next) => {
  try {
    const stats = await prisma.dailyStat.findMany({
      orderBy: { date: 'asc' },
      select: { date: true, netProfit: true }
    })

    const monthly = {}
    stats.forEach(s => {
      const key = new Date(s.date).toISOString().slice(0, 7)
      monthly[key] = (monthly[key] || 0) + s.netProfit
    })

    res.json(
      Object.entries(monthly).map(([month, profit]) => ({
        month,
        profit: parseFloat(profit.toFixed(2))
      }))
    )
  } catch (err) {
    next(err)
  }
}

module.exports = { getSummary, getEquityCurve, getMonthlyPnL }
