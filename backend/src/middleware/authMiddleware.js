const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_in_production'

module.exports = (req, res, next) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentification requise.' })

  const token = header.slice(7)

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' })
  }
}
