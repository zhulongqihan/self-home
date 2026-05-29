// 启动页：自动登录后按角色分流
// 流程：
//   1) 有 token → /auth/me 验证 → 成功直接分流
//   2) 没 token 或失效 → wx.login 拿 openid → 成功直接分流
//   3) openid 不在白名单 (NOT_WHITELISTED) → 跳密码登录页（不再去兜底页）
//   4) 其他错误（网络等）→ 显示错误 + 跳密码登录页（让用户兜底）
// 特殊：?force=1 表示强制走 openid（不读本地 token），用于"切换账号"后想再试微信登录
const { loginByOpenid, getToken, verify } = require('../../utils/auth.js')

Page({
  data: {
    statusText: '正在打开店铺...'
  },

  onLoad(query) {
    this.force = query.force === '1'
    this.start()
  },

  async start() {
    try {
      // 1) 有 token 先 verify（force 模式跳过）
      if (!this.force && getToken()) {
        this.setData({ statusText: '验证身份中...' })
        try {
          const res = await verify()
          this.dispatchByRole(res.data.role)
          return
        } catch (e) {
          console.warn('[Launch] verify 失败：', e.message)
        }
      }

      // 2) openid 自动登录
      this.setData({ statusText: '正在尝试微信登录...' })
      const result = await loginByOpenid()
      this.dispatchByRole(result.role)
    } catch (err) {
      console.error('[Launch] 登录失败：', err)

      // 陌生人 → 直接跳密码登录页，不打扰
      if (err.code === 'NOT_WHITELISTED' || err.code === 'WX_LOGIN_FAIL') {
        wx.reLaunch({ url: '/pages/launch/login' })
        return
      }

      // 其他错误：显示错误 + 提供「使用暗号登录」按钮
      this.setData({ statusText: '微信登录失败：' + (err.message || '未知错误') })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/launch/login' })
      }, 1500)
    }
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