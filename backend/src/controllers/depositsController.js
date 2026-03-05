const prisma = require('../prisma')

const getDeposits = async (req, res, next) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json(deposits)
  } catch (err) { next(err) }
}

const createDeposit = async (req, res, next) => {
  try {
    const { amount, method, txHash, note } = req.body
    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Montant invalide.' })
    const allowed = ['BANK','CRYPTO_USDT','CRYPTO_BTC','CARD']
    if (!allowed.includes(method))
      return res.status(400).json({ error: 'Méthode invalide.' })

    const deposit = await prisma.deposit.create({
      data: { userId: req.user.id, amount: parseFloat(amount), method, txHash: txHash || null, note: note || null }
    })
    res.status(201).json(deposit)
  } catch (err) { next(err) }
}

const updateDepositStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body
    const allowed = ['PENDING','CONFIRMED','REJECTED']
    if (!allowed.includes(status))
      return res.status(400).json({ error: 'Statut invalide.' })

    const deposit = await prisma.deposit.update({ where: { id }, data: { status } })
    res.json(deposit)
  } catch (err) { next(err) }
}

module.exports = { getDeposits, createDeposit, updateDepositStatus }
