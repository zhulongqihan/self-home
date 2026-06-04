const { get, put } = require('../../../../utils/request.js')

Page({
  data: {
    loading: true,
    saving: false,
    blindBoxTitle: '',
    blindBoxHint: '',
    blindBoxButton: '',
    blindBoxDailyLimit: 3,
    blindBoxSimulate: false
  },

  async onLoad() {
    await this.fetchConfig()
  },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const blind = (await get('/api/config/owner')).data?.blind_box || {}
      this.setData({
        loading: false,
        blindBoxTitle: blind.title || '摇一摇开盲盒',
        blindBoxHint: blind.hint || '',
        blindBoxButton: blind.button_text || '点我摇一下',
        blindBoxDailyLimit: blind.daily_limit || 3,
        blindBoxSimulate: !!blind.simulate_shake
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onInputBlindTitle(e) { this.setData({ blindBoxTitle: e.detail.value }) },
  onInputBlindHint(e) { this.setData({ blindBoxHint: e.detail.value }) },
  onInputBlindButton(e) { this.setData({ blindBoxButton: e.detail.value }) },
  onInputBlindDailyLimit(e) { this.setData({ blindBoxDailyLimit: e.detail.value }) },
  onToggleBlindSimulate(e) { this.setData({ blindBoxSimulate: e.detail.value }) },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await put('/api/config/owner', {
        blind_box: {
          title: (this.data.blindBoxTitle || '').trim(),
          hint: (this.data.blindBoxHint || '').trim(),
          button_text: (this.data.blindBoxButton || '').trim(),
          daily_limit: parseInt(this.data.blindBoxDailyLimit, 10) || 3,
          product_ids: [],
          simulate_shake: this.data.blindBoxSimulate
        }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
