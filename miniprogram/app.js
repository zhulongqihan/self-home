// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      // ⚠️ 任务 2 完成后将自动替换为实际云开发环境 ID
      // 当前 'DEFAULT' 表示使用第一个已创建的环境（首次开发会提示创建）
      wx.cloud.init({
        env: 'DEFAULT',
        traceUser: true
      })
    }
  },

  globalData: {
    userInfo: null,
    theme: 'default', // 'default' | 'cloud'
    role: null        // 'customer' | 'owner' | null
  }
})