const express = require('express')
const Config = require('../models/Config')
const env = require('../config')
const { requireAuth, requireRole } = require('../middlewares/auth')

const { buildCountdownItems } = require('../services/countdown')

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

function pickCountdownConfig(cfg) {
  if (!cfg) return null
  return {
    relationship_start: cfg.relationship_start || '',
    anniversary_date: cfg.anniversary_date || '',
    customer_birthday: cfg.customer_birthday || '',
    items: buildCountdownItems(cfg)
  }
}

/** GET /api/config/subscribe - 当前角色可用的订阅消息模板 ID（供前端 requestSubscribeMessage） */
router.get('/subscribe', requireAuth, async (req, res) => {
  const { templates } = env.wx
  const tmplIds = req.user.role === 'owner'
    ? [templates.ownerNewOrder].filter(Boolean)
    : [templates.customerOrderStatus].filter(Boolean)
  res.json({ status: 'ok', data: { tmplIds } })
})

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

/** GET /api/config/countdowns - 顾客端展示三大倒计时 */
router.get('/countdowns', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    res.json({ status: 'ok', data: pickCountdownConfig(cfg) })
  } catch (err) {
    next(err)
  }
})

/** GET /api/config/countdowns/owner - 店长读取倒计时配置 */
router.get('/countdowns/owner', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    res.json({
      status: 'ok',
      data: {
        relationship_start: cfg.relationship_start || '',
        anniversary_date: cfg.anniversary_date || '',
        customer_birthday: cfg.customer_birthday || ''
      }
    })
  } catch (err) {
    next(err)
  }
})

/** PUT /api/config/countdowns - 店长修改倒计时日期 */
router.put('/countdowns', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { relationship_start, anniversary_date, customer_birthday } = req.body || {}
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    if (relationship_start !== undefined) {
      const v = String(relationship_start).trim()
      if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_DATE', message: '在一起日期请用 YYYY-MM-DD' })
      }
      cfg.relationship_start = v
    }
    if (anniversary_date !== undefined) {
      const v = String(anniversary_date).trim()
      if (v && !/^\d{2}-\d{2}$/.test(v)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_DATE', message: '纪念日请用 MM-DD' })
      }
      cfg.anniversary_date = v
    }
    if (customer_birthday !== undefined) {
      const v = String(customer_birthday).trim()
      if (v && !/^\d{2}-\d{2}$/.test(v)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_DATE', message: '生日请用 MM-DD' })
      }
      cfg.customer_birthday = v
    }
    await cfg.save()
    res.json({ status: 'ok', data: pickCountdownConfig(cfg) })
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
