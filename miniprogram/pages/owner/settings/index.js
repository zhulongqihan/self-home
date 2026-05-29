const { get, put } = require('../../../utils/request.js')
const { clearCached } = require('../../../utils/uiConfig.js')

Page({
  data: {
    welcomeText: '',
    welcomeImageUrl: '',
    saving: false
  },

  async onLoad() {
    try {
      const resp = await get('/api/config/welcome')
      const w = resp.data || {}
      this.setData({
        welcomeText: w.text || '',
        welcomeImageUrl: w.image_url || ''
      })
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onInputText(e) {
    this.setData({ welcomeText: e.detail.value })
  },

  onInputImage(e) {
    this.setData({ welcomeImageUrl: e.detail.value })
  },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await put('/api/config/welcome', {
        text: this.data.welcomeText,
        image_url: this.data.welcomeImageUrl
      })
      clearCached()
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
