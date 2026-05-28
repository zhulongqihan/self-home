// 鉴权路由
const express = require('express')
const { code2session, signToken } = require('../services/wxAuth')
const User = require('../models/User')
const Config = require('../models/Config')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

/**
 * POST /api/auth/login
 * body: { code }
 *
 * 流程：
 * 1. 用 code 调微信 code2session 拿 openid
 * 2. 比对 config.whitelist 判断角色（owner / customer / 陌生人）
 * 3. 陌生人 → 403
 * 4. owner/customer → upsert users 表 → 签发 JWT 返回
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
    console.log('[Auth] login attempt openid =', openid)

    const cfg = await Config.findById('global')
    if (!cfg) {
      return res.status(500).json({
        status: 'error', code: 'CONFIG_MISSING', message: '服务端未初始化'
      })
    }

    // 判断角色
    let role = null
    if (openid === cfg.whitelist.owner_openid) role = 'owner'
    else if (openid === cfg.whitelist.customer_openid) role = 'customer'

    if (!role) {
      // 陌生人 - 给出兜底响应（前端用此判断切到「店铺暂未营业」页）
      return res.status(403).json({
        status: 'error',
        code: 'NOT_WHITELISTED',
        message: '店铺暂未营业',
        debug_openid: openid  // ⚠️ 仅开发期返回，方便填白名单；上线后可删
      })
    }

    // upsert user
    const user = await User.findOneAndUpdate(
      { openid },
      {
        openid, role,
        last_login_at: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const token = signToken({ openid, role })

    res.json({
      status: 'ok',
      data: {
        token,
        role,
        user: {
          openid: user.openid,
          role: user.role,
          nickname: user.nickname,
          avatar: user.avatar,
          coins: user.coins
        },
        store: {
          name: cfg.store_name,
          status: cfg.store_status,
          theme: cfg.default_theme
        }
      }
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/auth/me
 * 需要 token，返回当前用户信息（用于前端续期/切回应用时验证 token 是否还有效）
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ openid: req.user.openid })
    if (!user) {
      return res.status(404).json({
        status: 'error', code: 'USER_NOT_FOUND', message: '用户不存在'
      })
    }
    res.json({
      status: 'ok',
      data: {
        openid: user.openid,
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