/** 安全读写 storage，避免 invoke too early 导致渲染层崩溃 */
function safeRemove(key) {
  try {
    wx.removeStorageSync(key)
  } catch (e) {
    console.warn('[storage] remove failed:', key, e.message || e)
  }
}

function safeSet(key, val) {
  try {
    wx.setStorageSync(key, val)
  } catch (e) {
    console.warn('[storage] set failed:', key, e.message || e)
  }
}

function safeGet(key, def) {
  try {
    const v = wx.getStorageSync(key)
    return v === '' || v === undefined ? def : v
  } catch (e) {
    return def
  }
}

module.exports = { safeRemove, safeSet, safeGet }
