// Express 应用入口
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const config = require('./config')
const db = require('./config/db')
const { seedConfig } = require('./config/seed')

const healthRouter = require('./routes/health')
const authRouter = require('./routes/auth')

const { notFound, errorHandler } = require('./middlewares/errorHandler')

const app = express()

// ===== 基础中间件 =====
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// ===== 信任反向代理（取真实 IP / HTTPS scheme）=====
app.set('trust proxy', 1)

// ===== 路由 =====
app.use('/api', healthRouter)
app.use('/api/auth', authRouter)

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'couple-app-server',
    version: '0.1.3',
    endpoints: ['GET /api/health', 'POST /api/auth/login', 'GET /api/auth/me']
  })
})

// ===== 错误处理 =====
app.use(notFound)
app.use(errorHandler)

// ===== 启动 =====
async function start() {
  try {
    await db.connect()
    await seedConfig()
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