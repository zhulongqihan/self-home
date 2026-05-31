const { getUser, getStore, logout } = require('../../../utils/auth.js')
const { get, post } = require('../../../utils/request.js')

const USER_KEY = 'auth_user'

Page({
  data: {
    user: null,
    store: null,
    coins: 0,
    currencyName: '爱心币',
    currencyEmoji: '💋',
    continuousSignDays: 0,
    signedToday: false,
    kissToday: 0,
    kissDailyMax: 200,
    kissing: false,
    signing: false,
    loading: true,
    countdownItems: [],
    countdownLoading: true
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.setData({ user: getUser(), store: getStore() })
    this.fetchCoins()
    this.fetchCountdowns()
  },

  async fetchCountdowns() {
    this.setData({ countdownLoading: true })
    try {
      const resp = await get('/api/config/countdowns')
      const items = (resp.data && resp.data.items) || []
      this.setData({ countdownItems: items, countdownLoading: false })
    } catch (err) {
      this.setData({ countdownLoading: false })
    }
  },

  async fetchCoins() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/coins/me')
      const d = resp.data || {}
      const user = getUser()
      if (user) {
        user.coins = d.coins
        wx.setStorageSync(USER_KEY, user)
      }
      this.setData({
        loading: false,
        coins: d.coins || 0,
        currencyName: d.currency_name || '爱心币',
        currencyEmoji: d.currency_emoji || '💋',
        continuousSignDays: d.continuous_sign_days || 0,
        signedToday: !!d.signed_today,
        kissToday: d.kiss_today || 0,
        kissDailyMax: d.kiss_daily_max || 200,
        user
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  async onKiss() {
    if (this.data.kissing) return
    this.setData({ kissing: true })
    try {
      const resp = await post('/api/coins/kiss')
      const coins = (resp.data && resp.data.coins) || this.data.coins + 1
      const user = getUser()
      if (user) {
        user.coins = coins
        wx.setStorageSync(USER_KEY, user)
      }
      wx.showToast({ title: '亲亲成功 +1', icon: 'success' })
      this.setData({
        kissing: false,
        coins,
        kissToday: (resp.data && resp.data.kiss_today) || this.data.kissToday + 1,
        user
      })
    } catch (err) {
      this.setData({ kissing: false })
      wx.showToast({ title: err.message || '亲亲失败', icon: 'none' })
    }
  },

  async onSignIn() {
    if (this.data.signing || this.data.signedToday) return
    this.setData({ signing: true })
    try {
      const resp = await post('/api/sign-in')
      const d = resp.data || {}
      const user = getUser()
      if (user) {
        user.coins = d.coins
        wx.setStorageSync(USER_KEY, user)
      }
      const tip = d.bonus > 0
        ? `签到 +${d.reward}（含连签奖励）`
        : `签到 +${d.reward || 2}`
      wx.showToast({ title: tip, icon: 'success' })
      this.setData({
        signing: false,
        signedToday: true,
        coins: d.coins,
        continuousSignDays: d.continuous_sign_days || 0,
        user
      })
    } catch (err) {
      this.setData({ signing: false })
      wx.showToast({ title: err.message || '签到失败', icon: 'none' })
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
