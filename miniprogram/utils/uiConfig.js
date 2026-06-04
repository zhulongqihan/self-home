const { get } = require('./request.js')
const { getToken } = require('./auth.js')
const { safeGet, safeSet, safeRemove } = require('./storage.js')

const STORAGE_KEY = 'customer_ui_config'

function getCached() {
  return safeGet(STORAGE_KEY, null)
}

function setCached(data) {
  safeSet(STORAGE_KEY, data)
  const app = getApp()
  if (app) app.globalData.uiConfig = data
  return data
}

async function loadCustomerConfig(force) {
  if (!getToken()) {
    const cached = getCached()
    if (cached) return cached
    const err = new Error('未登录')
    err.code = 'NO_TOKEN'
    throw err
  }
  if (!force) {
    const c = getCached()
    if (c) return c
  }
  const resp = await get('/api/config/customer')
  return setCached(resp.data)
}

/** 欢迎图：后端默认 /assets/... 在小程序包内不存在，避免渲染层 500 */
function resolveWelcomeImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const u = url.trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return `https:${u}`
  if (u.startsWith('/assets/') || u.startsWith('/assets')) return ''
  return u
}

function clearCached() {
  safeRemove(STORAGE_KEY)
  const app = getApp()
  if (app) app.globalData.uiConfig = null
}

module.exports = {
  loadCustomerConfig,
  getCached,
  setCached,
  clearCached,
  resolveWelcomeImageUrl,
  STORAGE_KEY
}
