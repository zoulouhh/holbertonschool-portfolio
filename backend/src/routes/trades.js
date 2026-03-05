const express = require('express')
const router = express.Router()
const {
  getTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade
} = require('../controllers/tradesController')

router.get('/', getTrades)
router.get('/:id', getTradeById)
router.post('/', createTrade)
router.patch('/:id', updateTrade)
router.delete('/:id', deleteTrade)

module.exports = router
