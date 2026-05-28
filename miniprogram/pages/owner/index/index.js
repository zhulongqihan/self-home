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

  onLogout() {
    wx.showModal({
      title: '退出登录？',
      success: (res) => {
        if (res.confirm) {
          logout()
       wx.reLaunch({ url: '/pages/launch/index' })
        }
      }
    })
  }
})