// 统一网络请求封装
const { API_BASE } = require('../config/env.js')
const { safeGet } = require('./storage.js')
const TOKEN_KEY = 'auth_token'

let handling401 = false

function handleSessionExpired() {
  if (handling401) return
  handling401 = true
  setTimeout(() => { handling401 = false }, 3000)
  require('./auth.js').logout()
  wx.reLaunch({ url: '/pages/launch/login' })
}

/**
 * @param {Object} opts - { url, method, data, header, noAuth }
 */
function request(opts) {
  const url = opts.url.startsWith('http') ? opts.url : API_BASE + opts.url
  const header = { 'Content-Type': 'application/json', ...(opts.header || {}) }

  if (!opts.noAuth) {
    const token = safeGet(TOKEN_KEY, null)
    if (token) header['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: opts.method || 'GET',
      data: opts.data,
      header,
      timeout: 10000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return resolve(res.data)
        }
        if (res.statusCode === 401 && !opts.noAuth) {
          handleSessionExpired()
          const err = new Error('登录已过期，请重新输入暗号')
          err.code = 'SESSION_EXPIRED'
          return reject(err)
        }
        const err = new Error((res.data && res.data.message) || `HTTP ${res.statusCode}`)
        err.code = (res.data && res.data.code) || 'HTTP_ERROR'
        err.statusCode = res.statusCode
        err.data = res.data
        reject(err)
      },
      fail(err) {
        const e = new Error(err.errMsg || '网络异常')
        e.code = 'NETWORK_ERROR'
        reject(e)
      }
    })
  })
}

const get = (url, opts = {}) => request({ ...opts, url, method: 'GET' })
const post = (url, data, opts = {}) => request({ ...opts, url, method: 'POST', data })
const put = (url, data, opts = {}) => request({ ...opts, url, method: 'PUT', data })
const patch = (url, data, opts = {}) => request({ ...opts, url, method: 'PATCH', data })
const del = (url, opts = {}) => request({ ...opts, url, method: 'DELETE' })

module.exports = { request, get, post, put, patch, del, TOKEN_KEY }
