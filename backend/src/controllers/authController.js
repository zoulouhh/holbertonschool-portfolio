const prisma    = require('../prisma')
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')

const JWT_SECRET  = process.env.JWT_SECRET  || 'changeme_in_production'
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password)
      return res.status(400).json({ error: 'Username et mot de passe requis.' })

    const user = await prisma.user.findUnique({
      where: { username: username.trim() }
    })

    if (!user)
      return res.status(401).json({ error: 'Identifiants invalides.' })

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid)
      return res.status(401).json({ error: 'Identifiants invalides.' })

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    res.json({ token, username: user.username })
  } catch (err) {
    next(err)
  }
}

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, createdAt: true }
    })

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' })

    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { login, me }
