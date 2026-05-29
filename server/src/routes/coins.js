const express = require('express')
const User = require('../models/User')
const KissEvent = require('../models/KissEvent')
const Config = require('../models/Config')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { adjustCoins } = require('../services/coinsService')
const { notifyOwnerKiss } = require('../services/orderNotify')

const router = express.Router()

const KISS_COOLDOWN_MS = 2000
const KISS_DAILY_MAX = 200
const kissLastAt = new Map()

function todayKey() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** GET /api/coins/me */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub)
      .select('coins continuous_sign_days last_sign_date role')
      .lean()
    if (!user) {
      return res.status(404).json({ status: 'error', code: 'USER_NOT_FOUND', message: '用户不存在' })
    }
    const today = todayKey()
    const signedToday = user.last_sign_date === today
    let kissToday = 0
    if (user.role === 'customer') {
      kissToday = await KissEvent.countDocuments({
        user_id: user._id,
        created_at: { $gte: startOfToday() }
      })
    }
    const cfg = await Config.findById('global').lean()
    res.json({
      status: 'ok',
      data: {
        coins: user.coins || 0,
        currency_name: cfg ? cfg.currency_name : '爱心币',
        currency_emoji: cfg ? cfg.currency_emoji : '💋',
        continuous_sign_days: user.continuous_sign_days || 0,
        signed_today: signedToday,
        kiss_today: kissToday,
        kiss_daily_max: KISS_DAILY_MAX
      }
    })
  } catch (err) {
    next(err)
  }
})

/** POST /api/coins/kiss */
router.post('/kiss', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const uid = req.user.sub
    const now = Date.now()
    const last = kissLastAt.get(uid) || 0
    if (now - last < KISS_COOLDOWN_MS) {
      return res.status(429).json({
        status: 'error',
        code: 'KISS_TOO_FAST',
        message: '亲亲太快啦，稍等一下～'
      })
    }
    const kissToday = await KissEvent.countDocuments({
      user_id: uid,
      created_at: { $gte: startOfToday() }
    })
    if (kissToday >= KISS_DAILY_MAX) {
      return res.status(429).json({
        status: 'error',
        code: 'KISS_DAILY_LIMIT',
        message: '今日亲亲次数已满，明天再来吧'
      })
    }

    await KissEvent.create({ user_id: uid })
    kissLastAt.set(uid, now)
    const coins = await adjustCoins(uid, 1)
    await User.findByIdAndUpdate(uid, { $inc: { kiss_count_total: 1 } })

    notifyOwnerKiss().catch(err => {
      console.warn('[coins] notifyOwnerKiss:', err.message)
    })

    res.json({
      status: 'ok',
      data: { coins, kiss_today: kissToday + 1 }
    })
  } catch (err) {
    next(err)
  }
})

/** GET /api/coins/owner/kiss-stats */
router.get('/owner/kiss-stats', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const days = Math.min(30, Math.max(1, parseInt(req.query.days || '7', 10)))
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const count = await KissEvent.countDocuments({ created_at: { $gte: since } })
    const last = await KissEvent.findOne({})
      .sort({ created_at: -1 })
      .lean()

    res.json({
      status: 'ok',
      data: {
        days,
        count,
        last_at: last ? last.created_at : null
      }
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
