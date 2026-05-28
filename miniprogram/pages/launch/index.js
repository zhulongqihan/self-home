// 启动页：自动登录后按角色分流
const { login, getToken, verify } = require('../../utils/auth.js')

Page({
  data: {
    statusText: '正在打开店铺...'
  },

  onLoad() {
    this.start()
  },

  async start() {
    try {
      // 已有 token → 先验证还有没有效
      if (getToken()) {
        this.setData({ statusText: '验证身份中...' })
        try {
          const res = await verify()
          this.dispatchByRole(res.data.role)
          return
        } catch (e) {
          // verify 失败说明 token 过期或被删，往下走重新登录
          console.warn('[Launch] verify 失败，重新登录：', e.message)
        }
      }

      // 没 token 或 token 失效 → 完整登录流程
      this.setData({ statusText: '正在登录...' })
      const result = await login()
      this.dispatchByRole(result.role)
    } catch (err) {
      console.error('[Launch] 登录失败：', err)
      // 陌生人 → 兜底页
      if (err.code === 'NOT_WHITELISTED') {
        const debugOpenid = err.data && err.data.debug_openid
        wx.reLaunch({
          url: `/pages/launch/forbidden?openid=${encodeURIComponent(debugOpenid || '')}`
        })
        return
      }
      // 其他错误 → 显示错误信息，提供重试
      this.setData({ statusText: '登录失败：' + (err.message || '未知错误') })
    }
  },

  dispatchByRole(role) {
    if (role === 'owner') {
      wx.reLaunch({ url: '/pages/owner/index/index' })
    } else if (role === 'customer') {
      wx.reLaunch({ url: '/pages/customer/index/index' })
    } else {
      wx.reLaunch({ url: '/pages/launch/forbidden' })
    }
  },

  onRetry() {
    this.start()
  }
})