const prisma = require('../prisma')

const getTrades = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 25 } = req.query

    const where = {}
    if (type && ['BUY', 'SELL'].includes(type)) where.type = type
    if (status && ['OPEN', 'CLOSED'].includes(status)) where.status = status

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { openTime: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.trade.count({ where })
    ])

    res.json({
      data: trades,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (err) {
    next(err)
  }
}

const getTradeById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade) return res.status(404).json({ error: 'Trade not found' })

    res.json(trade)
  } catch (err) {
    next(err)
  }
}

const createTrade = async (req, res, next) => {
  try {
    const trade = await prisma.trade.create({ data: req.body })
    res.status(201).json(trade)
  } catch (err) {
    next(err)
  }
}

const updateTrade = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

    const trade = await prisma.trade.update({ where: { id }, data: req.body })
    res.json(trade)
  } catch (err) {
    next(err)
  }
}

const deleteTrade = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

    await prisma.trade.delete({ where: { id } })
    res.json({ message: 'Trade deleted' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getTrades, getTradeById, createTrade, updateTrade, deleteTrade }
