const { get } = require('./request.js')
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
  if (!force) {
    const c = getCached()
    if (c) return c
  }
  const resp = await get('/api/config/customer')
  return setCached(resp.data)
}

function clearCached() {
  safeRemove(STORAGE_KEY)
  const app = getApp()
  if (app) app.globalData.uiConfig = null
}

module.exports = { loadCustomerConfig, getCached, setCached, clearCached, STORAGE_KEY }
