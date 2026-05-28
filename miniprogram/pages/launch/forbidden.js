// 兜底页：陌生人或登录失败时显示
Page({
  data: {
    openid: '',
    hasOpenid: false
  },

  onLoad(query) {
    const openid = decodeURIComponent(query.openid || '')
    this.setData({
      openid,
      hasOpenid: !!openid
    })
  },

  onCopyOpenid() {
    if (!this.data.openid) return
    wx.setClipboardData({
      data: this.data.openid,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }
})