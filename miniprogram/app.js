// app.js - 应用入口
const { API_BASE } = require('./config/env.js')
const { getUser } = require('./utils/auth.js')
const { loadCustomerConfig } = require('./utils/uiConfig.js')

App({
  onLaunch() {
    console.log('[App] 启动，API 基址：', API_BASE)
    // 仅冷启动时展示欢迎页（由 launch 分流到 welcome，不在 onShow 反复 reLaunch）
    this.globalData.shouldShowWelcome = true
    const user = getUser()
    if (user && user.role === 'customer') {
      loadCustomerConfig(true).catch(() => {})
    }
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
