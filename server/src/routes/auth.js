// 鉴权路由
const express = require('express')
const bcrypt = require('bcryptjs')
const { code2session, signToken } = require('../services/wxAuth')
const User = require('../models/User')
const Config = require('../models/Config')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

/** 统一响应构造：成功登录后返回 token + 用户 + 店铺 */
async function buildLoginResponse(user) {
  const cfg = await Config.findById('global')
  const token = signToken({
    sub: user._id.toString(),
    openid: user.openid || null,
    username: user.username || null,
    role: user.role
  })
  return {
    status: 'ok',
    data: {
      token,
      role: user.role,
      user: {
        id: user._id,
        openid: user.openid,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar,
        coins: user.coins
      },
      store: {
        name: cfg ? cfg.store_name : '',
        status: cfg ? cfg.store_status : 'open',
        theme: cfg ? cfg.default_theme : 'default'
      }
    }
  }
}

/**
 * POST /api/auth/login
 * body: { code }
 *
 * openid 路径（小程序无感登录）
 */
router.post('/login', async (req, res, next) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.status(400).json({
        status: 'error', code: 'MISSING_CODE', message: '缺少 code'
      })
    }

    const { openid } = await code2session(code)
    console.log('[Auth] openid login attempt:', openid)

    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({
        status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化'
      })
    }

    let role = null
    if (openid === cfg.whitelist.owner_openid) role = 'owner'
    else if (openid === cfg.whitelist.customer_openid) role = 'customer'

    if (!role) {
      return res.status(403).json({
        status: 'error',
        code: 'NOT_WHITELISTED',
        message: 'openid 不在白名单',
        debug_openid: openid
      })
    }

    const user = await User.findOneAndUpdate(
      { openid },
      {
        openid, role,
        last_login_at: new Date(),
        last_login_method: 'openid'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json(await buildLoginResponse(user))
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/login-password
 * body: { username, password }
 *
 * 账号密码登录路径
 */
router.post('/login-password', async (req, res, next) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({
        status: 'error', code: 'MISSING_CREDENTIALS', message: '请输入账号和密码'
      })
    }

    // 注意：password_hash 默认 select:false，需要显式 select
    const user = await User.findOne({ username }).select('+password_hash')
    if (!user || !user.password_hash) {
      return res.status(401).json({
        status: 'error', code: 'INVALID_CREDENTIALS', message: '账号或密码错误'
      })
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return res.status(401).json({
        status: 'error', code: 'INVALID_CREDENTIALS', message: '账号或密码错误'
      })
    }

    user.last_login_at = new Date()
    user.last_login_method = 'password'
    await user.save()
    console.log(`[Auth] password login ok: ${username} (${user.role})`)

    res.json(await buildLoginResponse(user))
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/auth/me - 校验 token，返回当前用户
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { sub, openid, username } = req.user
    let user = null
    if (sub) user = await User.findById(sub)
    else if (openid) user = await User.findOne({ openid })
    else if (username) user = await User.findOne({ username })

    if (!user) {
      return res.status(404).json({
        status: 'error', code: 'USER_NOT_FOUND', message: '用户不存在'
      })
    }

    res.json({
      status: 'ok',
      data: {
        id: user._id,
        openid: user.openid,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar,
        coins: user.coins
      }
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router