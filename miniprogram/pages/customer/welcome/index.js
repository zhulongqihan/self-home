const { loadCustomerConfig } = require('../../../utils/uiConfig.js')

Page({
  data: {
    text: '今天也要好好吃饭哦～',
    imageUrl: '',
    loading: true
  },

  async onLoad() {
    try {
      const cfg = await loadCustomerConfig()
      const welcome = (cfg && cfg.welcome) || {}
      this.setData({
        text: welcome.text || this.data.text,
        imageUrl: welcome.image_url || '',
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onEnter() {
    const app = getApp()
    if (app) app.globalData.shouldShowWelcome = false
    wx.switchTab({ url: '/pages/customer/kitchen/index' })
  },

  onImgError() {
    this.setData({ imageUrl: '' })
  }
})
