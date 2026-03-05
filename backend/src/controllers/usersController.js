const prisma  = require('../prisma')
const bcrypt  = require('bcryptjs')

// List all users
const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (err) { next(err) }
}

// Create user
const createUser = async (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username?.trim() || !password)
      return res.status(400).json({ error: 'Username et mot de passe requis.' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères).' })

    const exists = await prisma.user.findUnique({ where: { username: username.trim() } })
    if (exists)
      return res.status(409).json({ error: 'Ce username est déjà pris.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username: username.trim(), passwordHash },
      select: { id: true, username: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (err) { next(err) }
}

// Change password
const changePassword = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { password } = req.body
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères).' })

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id }, data: { passwordHash } })
    res.json({ message: 'Mot de passe mis à jour.' })
  } catch (err) { next(err) }
}

// Delete user (cannot delete yourself)
const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (id === req.user.id)
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte.' })

    await prisma.user.delete({ where: { id } })
    res.json({ message: 'Utilisateur supprimé.' })
  } catch (err) { next(err) }
}

module.exports = { getUsers, createUser, changePassword, deleteUser }
