const prisma = require('../prisma')

const getReferral = async (req, res, next) => {
  try {
    const userId = req.user.id
    const user   = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
    const code   = user.username.toUpperCase() + '-REF'

    const referrals = await prisma.referral.findMany({
      where:   { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    })

    const totalCommissions = referrals.reduce((s, r) => s + r.commission, 0)

    res.json({
      stats: {
        referralCode:      code,
        totalCommissions,
        totalReferred:     referrals.length,
        activeReferred:    referrals.filter(r => r.status === 'ACTIVE').length,
      },
      referrals,
    })
  } catch (err) { next(err) }
}

module.exports = { getReferral }
