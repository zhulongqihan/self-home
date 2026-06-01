// Express 应用入口
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const config = require('./config')
const db = require('./config/db')
const seed = require('./config/seed')
const { assertProductionSecrets } = require('./config/validate')
const { authLimiter } = require('./middlewares/rateLimit')

const healthRouter = require('./routes/health')
const authRouter = require('./routes/auth')
const categoriesRouter = require('./routes/categories')
const productsRouter = require('./routes/products')
const ordersRouter = require('./routes/orders')
const configRouter = require('./routes/config')
const coinsRouter = require('./routes/coins')
const signInRouter = require('./routes/signIn')
const messagesRouter = require('./routes/messages')
const festivalsRouter = require('./routes/festivals')

const { notFound, errorHandler } = require('./middlewares/errorHandler')

const app = express()

// ===== 基础中间件 =====
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.nodeEnv !== 'production') return callback(null, true)
    const ok = ['https://api.cyruszhang.online', 'https://servicewechat.com'].some(
      prefix => origin === prefix || origin.startsWith(prefix)
    )
    callback(ok ? null : new Error('CORS not allowed'), ok)
  },
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// ===== 信任反向代理（取真实 IP / HTTPS scheme）=====
app.set('trust proxy', 1)

// ===== 路由 =====
app.use('/api', healthRouter)
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/config', configRouter)
app.use('/api/coins', coinsRouter)
app.use('/api/sign-in', signInRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/festivals', festivalsRouter)

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'couple-app-server',
    version: '0.3.6',
    endpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/login-password',
      'GET /api/config/owner',
      'PUT /api/config/owner',
      'POST /api/auth/change-password',
      'GET /api/auth/me',
      'GET /api/categories/owner/all',
      'POST /api/categories',
      'PUT /api/categories/:id',
      'PATCH /api/categories/:id/status',
      'DELETE /api/categories/:id',
      'GET /api/festivals/active',
      'GET /api/festivals/owner/all',
      'POST /api/festivals',
      'PUT /api/festivals/:id',
      'PATCH /api/festivals/:id/status',
      'DELETE /api/festivals/:id',
      'GET /api/products',
      'GET /api/products/owner/all',
      'POST /api/products',
      'GET /api/products/:id',
      'PUT /api/products/:id',
      'PATCH /api/products/:id/status',
      'DELETE /api/products/:id',
      'POST /api/orders',
      'GET /api/orders/my',
      'GET /api/orders/owner/all',
      'GET /api/orders/:id',
      'PATCH /api/orders/:id/status',
      'POST /api/orders/:id/review',
      'PATCH /api/orders/:id/reply',
      'GET /api/config/subscribe',
      'GET /api/config/customer',
      'GET /api/config/countdowns',
      'GET /api/config/countdowns/owner',
      'PUT /api/config/countdowns',
      'GET /api/config/welcome',
      'PUT /api/config/welcome',
      'GET /api/coins/me',
      'POST /api/coins/kiss',
      'GET /api/coins/owner/kiss-stats',
      'POST /api/sign-in',
      'GET /api/messages/latest',
      'GET /api/messages/owner',
      'POST /api/messages',
      'DELETE /api/messages/:id'
    ]
  })
})

// ===== 错误处理 =====
app.use(notFound)
app.use(errorHandler)

// ===== 启动 =====
async function start() {
  try {
    assertProductionSecrets()
    await db.connect()
    await seed.runAll()
    app.listen(config.port, config.host, () => {
      console.log(`[App] Server listening on http://${config.host}:${config.port}`)
      console.log(`[App] NODE_ENV: ${config.nodeEnv}`)
    })
  } catch (err) {
    console.error('[App] Failed to start:', err)
    process.exit(1)
  }
}

start()