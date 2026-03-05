require('dotenv').config()
const express = require('express')
const cors = require('cors')
const tradesRouter      = require('./routes/trades')
const statsRouter       = require('./routes/stats')
const authRouter        = require('./routes/auth')
const depositsRouter    = require('./routes/deposits')
const withdrawalsRouter = require('./routes/withdrawals')
const referralRouter    = require('./routes/referral')
const usersRouter       = require('./routes/users')
const authMiddleware    = require('./middleware/authMiddleware')
const errorHandler      = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth',        authRouter)
app.use('/api/trades',      authMiddleware, tradesRouter)
app.use('/api/stats',       authMiddleware, statsRouter)
app.use('/api/deposits',    authMiddleware, depositsRouter)
app.use('/api/withdrawals', authMiddleware, withdrawalsRouter)
app.use('/api/referral',    authMiddleware, referralRouter)
app.use('/api/users',       authMiddleware, usersRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
