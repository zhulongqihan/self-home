const { get, put } = require('../../../../utils/request.js')
const { normalizeHHmm } = require('../../../../utils/ownerSettingsDate.js')

Page({
  data: {
    loading: true,
    saving: false,
    timeEggSlots: [],
    timeEggStart: '07:00',
    timeEggEnd: '10:00',
    timeEggText: '',
    timeEggBanner: '',
    timeEggEnabled: true,
    timePreviewPicker: 0,
    timePreviewLabels: ['自动（当前时间）']
  },

  async onLoad() { await this.fetchConfig() },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const timeEgg = ((await get('/api/config/owner')).data || {}).time_egg || {}
      const timeEggSlots = (timeEgg.slots || []).map(s => ({
        start: s.start || '',
        end: s.end || '',
        text: s.text || '',
        banner: s.banner || '',
        enabled: s.enabled !== false
      }))
      const previewIndex = timeEgg.preview_index != null ? timeEgg.preview_index : -1
      const timePreviewLabels = [
        '自动（当前时间）',
        ...timeEggSlots.map(s => `${s.start} - ${s.end}`)
      ]
      this.setData({
        loading: false,
        timeEggSlots,
        timePreviewPicker: previewIndex < 0 ? 0 : previewIndex + 1,
        timePreviewLabels
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onInputTimeEggText(e) { this.setData({ timeEggText: e.detail.value }) },
  onInputTimeEggBanner(e) { this.setData({ timeEggBanner: e.detail.value }) },
  onPickTimeEggStart(e) { this.setData({ timeEggStart: e.detail.value }) },
  onPickTimeEggEnd(e) { this.setData({ timeEggEnd: e.detail.value }) },
  onToggleTimeEggEnabled(e) { this.setData({ timeEggEnabled: e.detail.value }) },
  onPickTimePreview(e) { this.setData({ timePreviewPicker: parseInt(e.detail.value, 10) || 0 }) },

  onAddTimeEgg() {
    const start = normalizeHHmm(this.data.timeEggStart)
    const end = normalizeHHmm(this.data.timeEggEnd)
    const text = (this.data.timeEggText || '').trim()
    if (!start || !end || !text) {
      wx.showToast({ title: '请填写时段与文案', icon: 'none' })
      return
    }
    const slot = {
      start,
      end,
      text,
      banner: (this.data.timeEggBanner || '').trim(),
      enabled: this.data.timeEggEnabled
    }
    const timeEggSlots = [...this.data.timeEggSlots, slot]
    this.setData({
      timeEggSlots,
      timePreviewLabels: ['自动（当前时间）', ...timeEggSlots.map(s => `${s.start} - ${s.end}`)],
      timeEggText: '',
      timeEggBanner: '',
      timeEggEnabled: true
    })
  },

  onToggleTimeSlot(e) {
    const index = e.currentTarget.dataset.index
    const timeEggSlots = this.data.timeEggSlots.map((s, i) => (
      i === index ? { ...s, enabled: e.detail.value } : s
    ))
    this.setData({ timeEggSlots })
  },

  onDeleteTimeSlot(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除时段',
      content: '确定删除该时段彩蛋？',
      success: (res) => {
        if (!res.confirm) return
        const timeEggSlots = this.data.timeEggSlots.filter((_, i) => i !== index)
        let timePreviewPicker = this.data.timePreviewPicker
        if (timePreviewPicker > timeEggSlots.length) timePreviewPicker = 0
        this.setData({
          timeEggSlots,
          timePreviewLabels: ['自动（当前时间）', ...timeEggSlots.map(s => `${s.start} - ${s.end}`)],
          timePreviewPicker
        })
      }
    })
  },

  async onSave() {
    if (this.data.saving) return
    const slots = this.data.timeEggSlots.map(s => ({
      ...s,
      start: normalizeHHmm(s.start),
      end: normalizeHHmm(s.end)
    }))
    if (!slots.length) {
      wx.showToast({ title: '请至少保留一条时段', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      const picker = this.data.timePreviewPicker
      await put('/api/config/owner', {
        time_easter_eggs: slots,
        time_egg: { preview_index: picker <= 0 ? -1 : picker - 1 }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
