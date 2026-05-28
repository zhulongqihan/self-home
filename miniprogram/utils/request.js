// 统一网络请求封装
// 自动注入 token、统一错误处理、自动跳转启动页（token 失效时）
const { API_BASE } = require('../config/env.js')
const TOKEN_KEY = 'auth_token'

/**
 * 通用请求
 * @param {Object} opts - { url, method, data, header, noAuth }
 *   url 可以是 '/api/xxx' 或完整 URL
 *   noAuth: true 时不自动加 Authorization 头（登录接口用）
 */
function request(opts) {
  const url = opts.url.startsWith('http') ? opts.url : API_BASE + opts.url
  const header = { 'Content-Type': 'application/json', ...(opts.header || {}) }

  if (!opts.noAuth) {
    const token = wx.getStorageSync(TOKEN_KEY)
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
        // 成功：HTTP 2xx
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return resolve(res.data)
        }
        // Token 失效：清掉本地缓存，跳回启动页重新登录
        if (res.statusCode === 401) {
          wx.removeStorageSync(TOKEN_KEY)
          wx.reLaunch({ url: '/pages/launch/index' })
        }
        // 其他业务错误，把 body 当 error 返回
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
const del = (url, opts = {}) => request({ ...opts, url, method: 'DELETE' })

module.exports = { request, get, post, put, del, TOKEN_KEY }