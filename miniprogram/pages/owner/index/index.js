// 店长端工作台
const { getUser, getStore, logout } = require('../../../utils/auth.js')

Page({
  data: {
    user: null,
    store: null
  },

  onShow() {
    this.setData({
      user: getUser(),
      store: getStore()
    })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/owner/settings/index' })
  },

  onTileTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'settings') {
      this.goSettings()
      return
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
          wx.reLaunch({ url: '/pages/launch/index?force=1' })
        }
      }
    })
  }
})