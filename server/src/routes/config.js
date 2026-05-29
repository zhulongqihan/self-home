const express = require('express')
const Config = require('../models/Config')
const { requireAuth, requireRole } = require('../middlewares/auth')

const router = express.Router()

function pickCustomerConfig(cfg) {
  if (!cfg) return null
  return {
    store_name: cfg.store_name,
    store_status: cfg.store_status,
    currency_name: cfg.currency_name,
    currency_emoji: cfg.currency_emoji,
    welcome: cfg.welcome || {},
    tab_bar: cfg.tab_bar || {},
    discover_placeholder: cfg.discover_placeholder || {}
  }
}

/** GET /api/config/customer - 顾客端 UI 配置 */
router.get('/customer', requireAuth, async (req, res, next) => {
  try {
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    res.json({ status: 'ok', data: pickCustomerConfig(cfg) })
  } catch (err) {
    next(err)
  }
})

/** GET /api/config/welcome - 店长读取欢迎页配置 */
router.get('/welcome', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    res.json({ status: 'ok', data: cfg.welcome || {} })
  } catch (err) {
    next(err)
  }
})

/** PUT /api/config/welcome - 店长修改欢迎页 */
router.put('/welcome', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { text, image_url } = req.body || {}
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    if (text !== undefined) cfg.welcome.text = String(text)
    if (image_url !== undefined) cfg.welcome.image_url = String(image_url)
    await cfg.save()
    res.json({ status: 'ok', data: cfg.welcome })
  } catch (err) {
    next(err)
  }
})

module.exports = router
