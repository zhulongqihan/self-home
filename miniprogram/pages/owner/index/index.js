// 店长端工作台
const { getUser, getStore, getToken, logout } = require('../../../utils/auth.js')
const { get } = require('../../../utils/request.js')

Page({
  data: {
    user: null,
    store: null,
    kissCount7d: 0,
    kissLastAt: ''
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

  goSettings() {
    wx.navigateTo({ url: '/pages/owner/settings/index' })
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/owner/orders/index' })
  },

  goProducts() {
    wx.navigateTo({ url: '/pages/owner/products/index' })
  },

  onTileTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'settings') {
      this.goSettings()
      return
    }
    if (key === 'orders') {
      this.goOrders()
      return
    }
    if (key === 'products') {
      this.goProducts()
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