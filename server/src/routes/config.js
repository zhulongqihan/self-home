const express = require('express')
const Config = require('../models/Config')
const env = require('../config')
const { requireAuth, requireRole } = require('../middlewares/auth')

const { buildCountdownItems } = require('../services/countdown')
const { EGG_SWITCH_META, normalizeEggsForOwner } = require('../constants/eggSwitches')

const router = express.Router()

function pickCustomerConfig(cfg) {
  if (!cfg) return null
  return {
    store_name: cfg.store_name,
    store_status: cfg.store_status,
    owner_nickname: cfg.owner_nickname,
    customer_nickname: cfg.customer_nickname,
    currency_name: cfg.currency_name,
    currency_emoji: cfg.currency_emoji,
    default_theme: cfg.default_theme,
    welcome: cfg.welcome || {},
    tab_bar: cfg.tab_bar || {},
    discover_placeholder: cfg.discover_placeholder || {}
  }
}

function pickOwnerConfig(cfg) {
  if (!cfg) return null
  const tab = cfg.tab_bar || {}
  const discover = cfg.discover_placeholder || {}
  return {
    store_name: cfg.store_name || '',
    owner_nickname: cfg.owner_nickname || '',
    customer_nickname: cfg.customer_nickname || '',
    currency_name: cfg.currency_name || '',
    currency_emoji: cfg.currency_emoji || '',
    store_status: cfg.store_status || 'open',
    default_theme: cfg.default_theme || 'default',
    welcome: cfg.welcome || {},
    tab_bar: {
      kitchen: tab.kitchen || '',
      orders: tab.orders || '',
      discover: tab.discover || '',
      profile: tab.profile || ''
    },
    discover_placeholder: {
      title: discover.title || '',
      desc: discover.desc || ''
    },
    relationship_start: cfg.relationship_start || '',
    anniversary_date: cfg.anniversary_date || '',
    customer_birthday: cfg.customer_birthday || '',
    eggs_switch: normalizeEggsForOwner(cfg.eggs_switch),
    egg_meta: EGG_SWITCH_META
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

/** GET /api/config/owner - 店长：全局配置 */
router.get('/owner', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    res.json({ status: 'ok', data: pickOwnerConfig(cfg) })
  } catch (err) {
    next(err)
  }
})

function applyOwnerConfigPatch(cfg, body) {
  const b = body || {}
  if (b.store_name !== undefined) cfg.store_name = String(b.store_name).trim().slice(0, 40)
  if (b.owner_nickname !== undefined) cfg.owner_nickname = String(b.owner_nickname).trim().slice(0, 20)
  if (b.customer_nickname !== undefined) cfg.customer_nickname = String(b.customer_nickname).trim().slice(0, 20)
  if (b.currency_name !== undefined) cfg.currency_name = String(b.currency_name).trim().slice(0, 12)
  if (b.currency_emoji !== undefined) cfg.currency_emoji = String(b.currency_emoji).trim().slice(0, 4)
  if (b.store_status === 'open' || b.store_status === 'closed') cfg.store_status = b.store_status
  if (b.default_theme === 'default' || b.default_theme === 'cloud') cfg.default_theme = b.default_theme

  if (b.welcome && typeof b.welcome === 'object') {
    if (b.welcome.text !== undefined) cfg.welcome.text = String(b.welcome.text)
    if (b.welcome.image_url !== undefined) cfg.welcome.image_url = String(b.welcome.image_url)
  }
  if (b.tab_bar && typeof b.tab_bar === 'object') {
    for (const key of ['kitchen', 'orders', 'discover', 'profile']) {
      if (b.tab_bar[key] !== undefined) cfg.tab_bar[key] = String(b.tab_bar[key]).trim().slice(0, 8)
    }
  }
  if (b.discover_placeholder && typeof b.discover_placeholder === 'object') {
    if (b.discover_placeholder.title !== undefined) {
      cfg.discover_placeholder.title = String(b.discover_placeholder.title).trim().slice(0, 20)
    }
    if (b.discover_placeholder.desc !== undefined) {
      cfg.discover_placeholder.desc = String(b.discover_placeholder.desc).trim().slice(0, 80)
    }
  }
  if (b.relationship_start !== undefined) {
    const v = String(b.relationship_start).trim()
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const err = new Error('在一起日期请用 YYYY-MM-DD')
      err.status = 400
      err.code = 'INVALID_DATE'
      throw err
    }
    cfg.relationship_start = v
  }
  if (b.anniversary_date !== undefined) {
    const v = String(b.anniversary_date).trim()
    if (v && !/^\d{2}-\d{2}$/.test(v)) {
      const err = new Error('纪念日请用 MM-DD')
      err.status = 400
      err.code = 'INVALID_DATE'
      throw err
    }
    cfg.anniversary_date = v
  }
  if (b.customer_birthday !== undefined) {
    const v = String(b.customer_birthday).trim()
    if (v && !/^\d{2}-\d{2}$/.test(v)) {
      const err = new Error('生日请用 MM-DD')
      err.status = 400
      err.code = 'INVALID_DATE'
      throw err
    }
    cfg.customer_birthday = v
  }
  if (b.eggs_switch && typeof b.eggs_switch === 'object') {
    if (!cfg.eggs_switch) cfg.eggs_switch = new Map()
    for (const item of EGG_SWITCH_META) {
      if (b.eggs_switch[item.key] !== undefined) {
        cfg.eggs_switch.set(item.key, !!b.eggs_switch[item.key])
      }
    }
  }
}

/** PUT /api/config/owner - 店长：更新全局配置（部分字段） */
router.put('/owner', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({ status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化' })
    }
    applyOwnerConfigPatch(cfg, req.body)
    await cfg.save()
    res.json({ status: 'ok', data: pickOwnerConfig(cfg) })
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ status: 'error', code: err.code || 'INVALID', message: err.message })
    }
    next(err)
  }
})

module.exports = router
