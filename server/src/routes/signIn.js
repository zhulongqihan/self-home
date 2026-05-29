const express = require('express')
const User = require('../models/User')
const { requireAuth, requireRole } = require('../middlewares/auth')

const router = express.Router()

function todayKey() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function yesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** POST /api/sign-in */
router.post('/', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub)
    if (!user) {
      return res.status(404).json({ status: 'error', code: 'USER_NOT_FOUND', message: '用户不存在' })
    }

    const today = todayKey()
    if (user.last_sign_date === today) {
      return res.status(400).json({
        status: 'error',
        code: 'ALREADY_SIGNED',
        message: '今天已经签到过啦'
      })
    }

    let continuous = 1
    if (user.last_sign_date === yesterdayKey()) {
      continuous = (user.continuous_sign_days || 0) + 1
    }

    let reward = 2
    let bonus = 0
    if (continuous > 0 && continuous % 7 === 0) {
      bonus = 10
      reward += bonus
    }

    user.coins = (user.coins || 0) + reward
    user.continuous_sign_days = continuous
    user.last_sign_date = today
    await user.save()

    res.json({
      status: 'ok',
      data: {
        coins: user.coins,
        reward,
        bonus,
        continuous_sign_days: continuous
      }
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
