// app.js - 应用入口
const { API_BASE } = require('./config/env.js')

App({
  onLaunch() {
    console.log('[App] 启动，API 基址：', API_BASE)
    // 任务 3 起：在这里调用 /auth/login 获取 openid 并判断白名单
  },

  globalData: {
    /** API 基址（HTTPS） */
    apiBase: API_BASE,
    /** 当前用户信息（任务 3 起填充） */
    userInfo: null,
    /** 当前主题：'default' = 暖阳大地 / 'cloud' = 云朵白 */
    theme: 'default',
    /** 当前角色：'customer' / 'owner' / null */
    role: null,
    /** 鉴权 token（任务 3 起填充） */
    token: null
  }
})