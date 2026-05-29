// app.js - 应用入口
const { API_BASE } = require('./config/env.js')
const { getUser } = require('./utils/auth.js')
const { loadCustomerConfig } = require('./utils/uiConfig.js')

App({
  onLaunch() {
    console.log('[App] 启动，API 基址：', API_BASE)
    this.globalData.shouldShowWelcome = true
    const user = getUser()
    if (user && user.role === 'customer') {
      loadCustomerConfig(true).catch(() => {})
    }
  },

  onShow() {
    const user = getUser()
    if (!user || user.role !== 'customer') return
    if (!this.globalData.shouldShowWelcome) return

    const pages = getCurrentPages()
    const cur = pages[pages.length - 1]
    if (cur && cur.route === 'pages/customer/welcome/index') return

    wx.reLaunch({ url: '/pages/customer/welcome/index' })
  },

  globalData: {
    apiBase: API_BASE,
    userInfo: null,
    theme: 'default',
    role: null,
    token: null,
    uiConfig: null,
    shouldShowWelcome: true
  }
})
