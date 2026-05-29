const { getCached, loadCustomerConfig } = require('../utils/uiConfig.js')

Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/customer/kitchen/index', text: '厨房' },
      { pagePath: '/pages/customer/orders/index', text: '订单' },
      { pagePath: '/pages/customer/discover/index', text: '发现' },
      { pagePath: '/pages/customer/profile/index', text: '我的' }
    ]
  },

  lifetimes: {
    attached() {
      this.applyLabels()
    }
  },

  methods: {
    async applyLabels() {
      try {
        let cfg = getCached()
        if (!cfg) cfg = await loadCustomerConfig()
        const tb = (cfg && cfg.tab_bar) || {}
        const list = [
          { pagePath: '/pages/customer/kitchen/index', text: tb.kitchen || '厨房' },
          { pagePath: '/pages/customer/orders/index', text: tb.orders || '订单' },
          { pagePath: '/pages/customer/discover/index', text: tb.discover || '发现' },
          { pagePath: '/pages/customer/profile/index', text: tb.profile || '我的' }
        ]
        this.setData({ list })
      } catch (e) { /* keep defaults */ }
    },

    switchTab(e) {
      const path = e.currentTarget.dataset.path
      const index = e.currentTarget.dataset.index
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    }
  }
})
