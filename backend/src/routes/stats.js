const express = require('express')
const router = express.Router()
const {
  getSummary,
  getEquityCurve,
  getMonthlyPnL
} = require('../controllers/statsController')

router.get('/', getSummary)
router.get('/equity-curve', getEquityCurve)
router.get('/monthly', getMonthlyPnL)

module.exports = router
