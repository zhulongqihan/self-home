// 顾客端首页
const { getUser, getStore, logout } = require('../../../utils/auth.js')

Page({
  data: {
    user: null,
    store: null,
    greeting: ''
  },

  onShow() {
    const user = getUser()
    const store = getStore()
    const hour = new Date().getHours()
    let greeting = '欢迎光临'
    if (hour < 6) greeting = '夜深啦，要不要一杯热饮'
    else if (hour < 11) greeting = '早安，宝宝'
    else if (hour < 14) greeting = '午饭吃啥子'
    else if (hour < 18) greeting = '下午茶时间到～'
    else if (hour < 22) greeting = '晚上好呀'
    else greeting = '夜猫子，要点夜宵吗'

    this.setData({ user, store, greeting })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录？',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          logout()
          wx.reLaunch({ url: '/pages/launch/index' })
        }
      }
    })
  }
})