const { getUser, getStore, logout } = require('../../../utils/auth.js')

Page({
  data: {
    user: null,
    store: null
  },

  onShow() {
    this.setData({ user: getUser(), store: getStore() })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  onLogout() {
    wx.showActionSheet({
      itemList: ['切换账号（用暗号登录）', '退出登录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          logout()
          wx.reLaunch({ url: '/pages/launch/login' })
        } else if (res.tapIndex === 1) {
          logout()
          const app = getApp()
          if (app) app.globalData.shouldShowWelcome = true
          wx.reLaunch({ url: '/pages/launch/index?force=1' })
        }
      }
    })
  }
})
