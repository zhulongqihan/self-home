// JWT 鉴权中间件
const { verifyToken } = require('../services/wxAuth')

/**
 * 校验 Authorization: Bearer <token>
 * 通过后将 { openid, role } 挂到 req.user
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({
      status: 'error', code: 'NO_TOKEN', message: '缺少 Authorization 头'
    })
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch (err) {
    return res.status(401).json({
      status: 'error', code: 'INVALID_TOKEN', message: 'Token 无效或已过期'
    })
  }
}

/**
 * 角色限制：requireRole('owner') 或 requireRole('customer', 'owner')
 * 必须放在 requireAuth 之后
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ status: 'error', code: 'NO_TOKEN', message: '未登录' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error', code: 'FORBIDDEN', message: `需要角色：${roles.join('/')}`
      })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole }