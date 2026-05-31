const { getNavLayout } = require('../../utils/navLayout.js')

Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
    backUrl: { type: String, value: '' }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44
  },

  lifetimes: {
    attached() {
      this.updateNavLayout()
    }
  },

  pageLifetimes: {
    show() {
      this.updateNavLayout()
    }
  },

  methods: {
    updateNavLayout() {
      const nav = getNavLayout()
      this.setData({
        statusBarHeight: nav.statusBarHeight,
        navBarHeight: nav.navBarHeight
      })
    },

    onBack() {
      if (this.properties.backUrl) {
        wx.reLaunch({ url: this.properties.backUrl })
        return
      }
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.reLaunch({ url: '/pages/owner/index/index' })
      }
    }
  }
})
