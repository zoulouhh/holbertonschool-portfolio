const prisma = require('../prisma')

const MIN_AMOUNT = 50

const getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json(withdrawals)
  } catch (err) { next(err) }
}

const createWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, address, note } = req.body
    if (!amount || parseFloat(amount) < MIN_AMOUNT)
      return res.status(400).json({ error: `Montant minimum : $${MIN_AMOUNT}` })
    const allowed = ['BANK','CRYPTO_USDT','CRYPTO_BTC']
    if (!allowed.includes(method))
      return res.status(400).json({ error: 'Méthode invalide.' })
    if (!address || !address.trim())
      return res.status(400).json({ error: 'Adresse / IBAN requis.' })

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId:  req.user.id,
        amount:  parseFloat(amount),
        method,
        address: address.trim(),
        note:    note || null,
      }
    })
    res.status(201).json(withdrawal)
  } catch (err) { next(err) }
}

const updateWithdrawalStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body
    const allowed = ['PENDING','PROCESSING','COMPLETED','REJECTED']
    if (!allowed.includes(status))
      return res.status(400).json({ error: 'Statut invalide.' })

    const withdrawal = await prisma.withdrawal.update({ where: { id }, data: { status } })
    res.json(withdrawal)
  } catch (err) { next(err) }
}

module.exports = { getWithdrawals, createWithdrawal, updateWithdrawalStatus }
