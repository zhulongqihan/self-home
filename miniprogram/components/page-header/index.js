const { getNavLayout } = require('../../utils/navLayout.js')

Component({
  properties: {
    title: { type: String, value: '' }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44
  },

  lifetimes: {
    attached() {
      const nav = getNavLayout()
      this.setData({
        statusBarHeight: nav.statusBarHeight,
        navBarHeight: nav.navBarHeight
      })
    }
  }
})
