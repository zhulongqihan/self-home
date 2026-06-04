// 店长端工作台
const { getUser, getStore, getToken, logout } = require('../../../utils/auth.js')
const { get, post } = require('../../../utils/request.js')
const { requestSubscribeByRole } = require('../../../utils/subscribe.js')

Page({
  data: {
    user: null,
    store: null,
    kissCount7d: 0,
    kissLastAt: '',
    emotionAlert: null
  },

  onShow() {
    if (!getToken()) {
      wx.reLaunch({ url: '/pages/launch/login' })
      return
    }
    this.setData({
      user: getUser(),
      store: getStore() || { name: '我们的小窝' }
    })
    this.fetchKissStats()
    this.fetchEmotionAlert()
    requestSubscribeByRole()
  },

  async fetchKissStats() {
    try {
      const resp = await get('/api/coins/owner/kiss-stats?days=7')
      const d = resp.data || {}
      let kissLastAt = ''
      if (d.last_at) {
        const dt = new Date(d.last_at)
        kissLastAt = `${dt.getMonth() + 1}/${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`
      }
      this.setData({
        kissCount7d: d.count || 0,
        kissLastAt
      })
    } catch (e) {
      // 静默
    }
  },

  async fetchEmotionAlert() {
    try {
      const resp = await get('/api/emotion-alert/status')
      const d = resp.data || {}
      this.setData({ emotionAlert: d })
      if (d.active && d.message && (d.order_id || d.streak_key)) {
        const alertKey = d.order_id || d.streak_key
        const shownKey = wx.getStorageSync('emotion_alert_modal_key')
        if (shownKey !== alertKey) {
          wx.showModal({
            title: '情绪预警',
            content: d.message,
            confirmText: '知道了',
            showCancel: false,
            success: async res => {
              if (res.confirm) {
                try {
                  await post('/api/emotion-alert/dismiss', { order_id: alertKey })
                  wx.setStorageSync('emotion_alert_modal_key', alertKey)
                  this.setData({ 'emotionAlert.active': false })
                } catch (e) { /* ignore */ }
              }
            }
          })
        }
      }
    } catch (e) { /* 静默 */ }
  },

  onDismissEmotionBanner() {
    const d = this.data.emotionAlert
    const alertKey = d && (d.order_id || d.streak_key)
    if (!alertKey) return
    post('/api/emotion-alert/dismiss', { order_id: alertKey })
      .then(() => {
        wx.setStorageSync('emotion_alert_modal_key', alertKey)
        this.setData({ 'emotionAlert.active': false })
      })
      .catch(() => {})
  },

  goEmotionSettings() {
    wx.navigateTo({ url: '/pages/owner/settings/emotion-alert/index' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/owner/settings/index' })
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/owner/orders/index' })
  },

  goProducts() {
    wx.navigateTo({ url: '/pages/owner/products/index' })
  },

  goMessages() {
    wx.navigateTo({ url: '/pages/owner/messages/index' })
  },

  goCategories() {
    wx.navigateTo({ url: '/pages/owner/categories/index' })
  },

  goFestivals() {
    wx.navigateTo({ url: '/pages/owner/festivals/index' })
  },

  goAnalytics() {
    wx.navigateTo({ url: '/pages/owner/analytics/index' })
  },

  onTileTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'settings') {
      this.goSettings()
      return
    }
    if (key === 'messages') {
      this.goMessages()
      return
    }
    if (key === 'categories') {
      this.goCategories()
      return
    }
    if (key === 'festivals') {
      this.goFestivals()
      return
    }
    if (key === 'orders') {
      this.goOrders()
      return
    }
    if (key === 'products') {
      this.goProducts()
      return
    }
    if (key === 'analytics') {
      this.goAnalytics()
    }
  },

  onLogout() {
    wx.showActionSheet({
      itemList: ['切换账号（用暗号登录）', '退出登录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          logout()
          wx.reLaunch({ url: '/pages/launch/login' })
        } else if (res.tapIndex === 1) {
          logout()
          wx.reLaunch({ url: '/pages/launch/index?force=1' })
        }
      }
    })
  }
})