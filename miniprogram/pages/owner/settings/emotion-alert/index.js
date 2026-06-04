const { get, put } = require('../../../../utils/request.js')

Page({
  data: {
    loading: true,
    saving: false,
    simulateActive: false,
    previewActive: false,
    previewMessage: ''
  },

  async onLoad() {
    await this.fetchConfig()
  },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const [cfgResp, statusResp] = await Promise.all([
        get('/api/config/owner'),
        get('/api/emotion-alert/status')
      ])
      const ea = (cfgResp.data && cfgResp.data.emotion_alert) || {}
      const st = statusResp.data || {}
      this.setData({
        loading: false,
        simulateActive: !!ea.simulate_active,
        previewActive: !!st.active,
        previewMessage: st.message || ''
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onToggleSimulate(e) {
    this.setData({ simulateActive: e.detail.value })
  },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await put('/api/config/owner', {
        emotion_alert: { simulate_active: this.data.simulateActive }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
      await this.fetchConfig()
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
