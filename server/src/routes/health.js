// 健康检查路由
const express = require('express')
const { isConnected } = require('../config/db')

const router = express.Router()

router.get('/health', (req, res) => {
  const dbStatus = isConnected() ? 'connected' : 'disconnected'
  res.json({
    status: 'ok',
    version: '0.1.2',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    db: dbStatus,
    node: process.version
  })
})

module.exports = router