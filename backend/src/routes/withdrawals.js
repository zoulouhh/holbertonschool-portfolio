const express = require('express')
const router  = express.Router()
const { getWithdrawals, createWithdrawal, updateWithdrawalStatus } = require('../controllers/withdrawalsController')

router.get('/',       getWithdrawals)
router.post('/',      createWithdrawal)
router.patch('/:id',  updateWithdrawalStatus)

module.exports = router
