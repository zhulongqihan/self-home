// 账号密码登录页（仅密码模式：密码同时当 username 用）
const { loginByPassword } = require('../../utils/auth.js')

Page({
  data: {
    password: '',
    loading: false,
    errorMsg: ''
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' })
  },

  async onSubmit() {
    if (this.data.loading) return
    const pwd = (this.data.password || '').trim()
    if (!pwd) {
      this.setData({ errorMsg: '请输入暗号' })
      return
    }

    this.setData({ loading: true, errorMsg: '' })
    try {
      // 密码同时当 username 用（小程序场景下两人共用一个 AppID，密码即身份）
      const { role } = await loginByPassword(pwd, pwd)
      this.setData({ loading: false })
      if (role === 'owner') {
        wx.reLaunch({ url: '/pages/owner/index/index' })
      } else {
        const app = getApp()
        if (app) app.globalData.shouldShowWelcome = true
        wx.reLaunch({ url: '/pages/customer/welcome/index' })
      }
    } catch (err) {
      console.error('[Login] 失败：', err)
      this.setData({
        loading: false,
        errorMsg: err.code === 'INVALID_CREDENTIALS' ? '暗号不对哦 🤔' : (err.message || '登录失败')
      })
    }
  },

  onTryWxLogin() {
    // 用户主动选择微信登录（与暗号登录分离，不携带旧 token）
    wx.reLaunch({ url: '/pages/launch/index?force=1&from=wx' })
  }
})