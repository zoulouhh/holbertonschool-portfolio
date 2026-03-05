const express = require('express')
const router  = express.Router()
const { getUsers, createUser, changePassword, deleteUser } = require('../controllers/usersController')

router.get('/',                  getUsers)
router.post('/',                 createUser)
router.patch('/:id/password',   changePassword)
router.delete('/:id',           deleteUser)

module.exports = router
