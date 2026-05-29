const { loadCustomerConfig } = require('../../../utils/uiConfig.js')

Page({
  data: {
    title: '发现',
    desc: '精彩内容筹备中，敬请期待～'
  },

  async onLoad() {
    try {
      const cfg = await loadCustomerConfig()
      const p = (cfg && cfg.discover_placeholder) || {}
      this.setData({
        title: p.title || this.data.title,
        desc: p.desc || this.data.desc
      })
    } catch (e) { /* use defaults */ }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  }
})
