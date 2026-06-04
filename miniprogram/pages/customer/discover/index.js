const { get } = require('../../../utils/request.js')

Page({
  data: {
    loading: true,
    enabled: false,
    placeholder: { title: '发现', desc: '' },
    daysTogether: null,
    customerNickname: '宝宝',
    subtitle: '',
    events: []
  },

  onShow() {
    this.fetchTimeline()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  async fetchTimeline() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/love-timeline/discover')
      const d = resp.data || {}
      this.setData({
        loading: false,
        enabled: !!d.enabled,
        placeholder: d.placeholder || this.data.placeholder,
        daysTogether: d.days_together,
        customerNickname: d.customer_nickname || '宝宝',
        subtitle: d.subtitle || '按天精选，只保留值得记住的日子',
        events: d.events || []
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onGoOrder(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id.startsWith('badge_') || id === 'together_start') return
    wx.switchTab({ url: '/pages/customer/orders/index' })
  }
})
