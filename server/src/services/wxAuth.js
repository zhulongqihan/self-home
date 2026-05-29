// 微信小程序鉴权服务
const axios = require('axios')
const jwt = require('jsonwebtoken')
const env = require('../config')

/**
 * 用 code 调微信 code2session 拿 openid
 * https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
 */
async function code2session(code) {
  if (!env.wx.appid || !env.wx.appsecret) {
    throw Object.assign(new Error('服务端未配置 WX_APPID / WX_APPSECRET'), {
      status: 500,
      code: 'WX_CREDENTIALS_MISSING'
    })
  }

  const url = 'https://api.weixin.qq.com/sns/jscode2session'
  const { data } = await axios.get(url, {
    params: {
      appid: env.wx.appid,
      secret: env.wx.appsecret,
      js_code: code,
      grant_type: 'authorization_code'
    },
    timeout: 8000
  })

  if (data.errcode) {
    throw Object.assign(new Error(`微信登录失败：${data.errmsg}`), {
      status: 400,
      code: 'WX_LOGIN_FAILED'
    })
  }
  return { openid: data.openid, session_key: data.session_key }
}

/** 签发 JWT */
function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
    algorithm: 'HS256'
  })
}

/** 验证 JWT */
function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] })
}

module.exports = { code2session, signToken, verifyToken }