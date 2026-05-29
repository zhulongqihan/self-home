// 启动页：自动登录后按角色分流
// 暗号登录后标记 auth_login_method=password，此处不再自动走微信 openid（避免覆盖为顾客）
const { loginByOpenid, getToken, verify, logout, getLoginMethod } = require('../../utils/auth.js')

Page({
  data: {
    statusText: '正在打开店铺...'
  },

  onLoad(query) {
    this.force = query.force === '1'
    this.start()
  },

  async start() {
    const preferPassword = getLoginMethod() === 'password' && !this.force

    try {
      if (!this.force && getToken()) {
        this.setData({ statusText: '验证身份中...' })
        try {
          const res = await verify()
          this.dispatchByRole(res.data.role)
          return
        } catch (e) {
          console.warn('[Launch] verify 失败：', e.message)
          logout()
          wx.reLaunch({ url: '/pages/launch/login' })
          return
        }
      }

      // 暗号登录用户不要自动用微信 openid 顶掉身份
      if (preferPassword) {
        wx.reLaunch({ url: '/pages/launch/login' })
        return
      }

      this.setData({ statusText: '正在尝试微信登录...' })
      const result = await loginByOpenid()
      this.dispatchByRole(result.role)
    } catch (err) {
      console.error('[Launch] 登录失败：', err)

      if (err.code === 'NOT_WHITELISTED' || err.code === 'WX_LOGIN_FAIL') {
        logout()
        wx.reLaunch({ url: '/pages/launch/login' })
        return
      }

      logout()
      this.setData({ statusText: '微信登录失败：' + (err.message || '未知错误') })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/launch/login' })
      }, 1500)
    }
  },

  onRetry() {
    this.setData({ statusText: '正在打开店铺...' })
    this.start()
  },

  dispatchByRole(role) {
    if (role === 'owner') {
      wx.reLaunch({ url: '/pages/owner/index/index' })
    } else if (role === 'customer') {
      const app = getApp()
      if (app) app.globalData.shouldShowWelcome = true
      wx.reLaunch({ url: '/pages/customer/welcome/index' })
    } else {
      wx.reLaunch({ url: '/pages/launch/login' })
    }
  }
})
