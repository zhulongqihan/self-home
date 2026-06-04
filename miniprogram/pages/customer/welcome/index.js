const { getToken } = require('../../../utils/auth.js')
const { loadCustomerConfig, getCached, resolveWelcomeImageUrl } = require('../../../utils/uiConfig.js')

Page({
  data: {
    text: '今天也要好好吃饭哦～',
    imageUrl: '',
    loading: true
  },

  async onLoad() {
    try {
      let cfg = getCached()
      if (!cfg && getToken()) cfg = await loadCustomerConfig()
      const welcome = (cfg && cfg.welcome) || {}
      this.setData({
        text: welcome.text || this.data.text,
        imageUrl: resolveWelcomeImageUrl(welcome.image_url),
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
