const express = require('express')
const router  = express.Router()
const { getDeposits, createDeposit, updateDepositStatus } = require('../controllers/depositsController')

router.get('/',         getDeposits)
router.post('/',        createDeposit)
router.patch('/:id',    updateDepositStatus)

module.exports = router
