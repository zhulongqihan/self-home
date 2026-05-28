// 鉴权工具：openid 自动登录 + 账号密码登录 + 登录态管理
const { post, get, TOKEN_KEY } = require('./request.js')

const USER_KEY = 'auth_user'
const STORE_KEY = 'store_info'

/** 内部：登录成功后写缓存和 globalData */
function saveLogin(body) {
  const { token, role, user, store } = body.data
  wx.setStorageSync(TOKEN_KEY, token)
  wx.setStorageSync(USER_KEY, user)
  wx.setStorageSync(STORE_KEY, store)
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
          .then(body => resolve(saveLogin(body)))
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
    .then(body => saveLogin(body))
}

/** 清除本地登录状态 */
function logout() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  wx.removeStorageSync(STORE_KEY)
  const app = getApp()
  if (app) {
    app.globalData.token = null
    app.globalData.userInfo = null
    app.globalData.role = null
  }
}

/** 验证 token 是否还有效（调 /auth/me） */
function verify() {
  return get('/api/auth/me')
}

const getToken = () => wx.getStorageSync(TOKEN_KEY) || null
const getUser = () => wx.getStorageSync(USER_KEY) || null
const getStore = () => wx.getStorageSync(STORE_KEY) || null

module.exports = {
  loginByOpenid,
  loginByPassword,
  logout,
  verify,
  getToken,
  getUser,
  getStore
}