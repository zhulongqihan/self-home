// 鉴权工具：openid 自动登录 + 账号密码登录 + 登录态管理
const { post, get, TOKEN_KEY } = require('./request.js')
const { clearCached } = require('./uiConfig.js')
const { safeRemove, safeSet, safeGet } = require('./storage.js')

const USER_KEY = 'auth_user'
const STORE_KEY = 'store_info'
const LOGIN_METHOD_KEY = 'auth_login_method'

/** 内部：登录成功后写缓存和 globalData */
function saveLogin(body, loginMethod) {
  const { token, role, user, store } = body.data
  safeSet(TOKEN_KEY, token)
  safeSet(USER_KEY, user)
  safeSet(STORE_KEY, store)
  if (loginMethod) safeSet(LOGIN_METHOD_KEY, loginMethod)
  const app = getApp()
  if (app) {
    app.globalData.token = token
    app.globalData.userInfo = user
    app.globalData.role = role
  }
  return { role, user, store }
}

/** openid 路径：wx.login → POST /api/auth/login */
function loginByOpenid() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) {
          return reject(Object.assign(new Error('wx.login 未返回 code'), { code: 'NO_WX_CODE' }))
        }
        post('/api/auth/login', { code: res.code }, { noAuth: true })
          .then(body => resolve(saveLogin(body, 'openid')))
          .catch(reject)
      },
      fail(err) {
        reject(Object.assign(new Error(err.errMsg || 'wx.login 失败'), { code: 'WX_LOGIN_FAIL' }))
      }
    })
  })
}

/** 账号密码路径：POST /api/auth/login-password */
function loginByPassword(username, password) {
  return post('/api/auth/login-password', { username, password }, { noAuth: true })
    .then(body => saveLogin(body, 'password'))
}

/** 清除本地登录状态 */
let loggingOut = false

function logout() {
  if (loggingOut) return
  loggingOut = true
  const app = getApp()
  if (app) {
    app.globalData.token = null
    app.globalData.userInfo = null
    app.globalData.role = null
  }
  const run = () => {
    safeRemove(TOKEN_KEY)
    safeRemove(USER_KEY)
    safeRemove(STORE_KEY)
    safeRemove(LOGIN_METHOD_KEY)
    try {
      clearCached()
    } catch (e) {
      console.warn('[auth] clearCached:', e.message || e)
    }
    loggingOut = false
  }
  if (typeof wx.nextTick === 'function') wx.nextTick(run)
  else setTimeout(run, 0)
}

/** 验证 token 是否还有效（调 /auth/me），并同步本地 user */
function verify() {
  return get('/api/auth/me').then(body => {
    const me = body.data
    if (me) {
      const prev = getUser() || {}
      safeSet(USER_KEY, { ...prev, ...me, role: me.role })
      const app = getApp()
      if (app) {
        app.globalData.userInfo = getUser()
        app.globalData.role = me.role
      }
    }
    return body
  })
}

const getToken = () => safeGet(TOKEN_KEY, null)
const getLoginMethod = () => safeGet(LOGIN_METHOD_KEY, '')
const getUser = () => safeGet(USER_KEY, null)
const getStore = () => safeGet(STORE_KEY, null)

module.exports = {
  loginByOpenid,
  loginByPassword,
  logout,
  verify,
  getToken,
  getUser,
  getStore,
  getLoginMethod,
  LOGIN_METHOD_KEY
}