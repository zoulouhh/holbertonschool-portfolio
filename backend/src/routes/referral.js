const express = require('express')
const router  = express.Router()
const { getReferral } = require('../controllers/referralController')

router.get('/', getReferral)

module.exports = router
