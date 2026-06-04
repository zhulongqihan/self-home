const { get, put } = require('../../../../utils/request.js')

const BADGE_TRIGGER_LABELS = ['连续签到天数', '累计亲亲次数', '累计下单次数']
const BADGE_TRIGGER_VALUES = ['sign_in_days', 'kiss_total', 'order_count']

Page({
  data: {
    loading: true,
    saving: false,
    badgeList: [],
    badgeId: '',
    badgeName: '',
    badgeEmoji: '🏅',
    badgeDesc: '',
    badgeTriggerIndex: 0,
    badgeTriggerLabels: BADGE_TRIGGER_LABELS,
    badgeThreshold: 1,
    badgeHidden: false,
    badgeEnabled: true,
    badgePreviewAll: false
  },

  async onLoad() { await this.fetchConfig() },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const achievement = ((await get('/api/config/owner')).data || {}).achievement || {}
      const badgeList = (achievement.badges || []).map(b => ({
        id: b.id || '',
        name: b.name || '',
        emoji: b.emoji || '🏅',
        description: b.description || '',
        trigger: b.trigger || 'sign_in_days',
        threshold: b.threshold || 1,
        hidden: !!b.hidden,
        enabled: b.enabled !== false
      }))
      this.setData({
        loading: false,
        badgeList,
        badgePreviewAll: !!achievement.preview_all
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onInputBadgeId(e) { this.setData({ badgeId: e.detail.value }) },
  onInputBadgeName(e) { this.setData({ badgeName: e.detail.value }) },
  onInputBadgeEmoji(e) { this.setData({ badgeEmoji: e.detail.value }) },
  onInputBadgeDesc(e) { this.setData({ badgeDesc: e.detail.value }) },
  onInputBadgeThreshold(e) { this.setData({ badgeThreshold: e.detail.value }) },
  onPickBadgeTrigger(e) { this.setData({ badgeTriggerIndex: parseInt(e.detail.value, 10) || 0 }) },
  onToggleBadgeHidden(e) { this.setData({ badgeHidden: e.detail.value }) },
  onToggleBadgeEnabled(e) { this.setData({ badgeEnabled: e.detail.value }) },
  onToggleBadgePreviewAll(e) { this.setData({ badgePreviewAll: e.detail.value }) },

  onAddBadge() {
    const id = (this.data.badgeId || '').trim().toLowerCase()
    const name = (this.data.badgeName || '').trim()
    const description = (this.data.badgeDesc || '').trim()
    const threshold = parseInt(this.data.badgeThreshold, 10) || 1
    if (!id || !/^[a-z][a-z0-9_]{0,31}$/.test(id)) {
      wx.showToast({ title: 'ID 须小写字母开头', icon: 'none' })
      return
    }
    if (!name || !description) {
      wx.showToast({ title: '请填写名称与描述', icon: 'none' })
      return
    }
    if (this.data.badgeList.some(b => b.id === id)) {
      wx.showToast({ title: 'ID 已存在', icon: 'none' })
      return
    }
    this.setData({
      badgeList: [...this.data.badgeList, {
        id,
        name,
        emoji: (this.data.badgeEmoji || '🏅').trim() || '🏅',
        description,
        trigger: BADGE_TRIGGER_VALUES[this.data.badgeTriggerIndex] || 'sign_in_days',
        threshold: Math.max(1, threshold),
        hidden: this.data.badgeHidden,
        enabled: this.data.badgeEnabled
      }],
      badgeId: '',
      badgeName: '',
      badgeEmoji: '🏅',
      badgeDesc: '',
      badgeThreshold: 1,
      badgeHidden: false,
      badgeEnabled: true
    })
  },

  onToggleBadgeItem(e) {
    const index = e.currentTarget.dataset.index
    const badgeList = this.data.badgeList.map((b, i) => (
      i === index ? { ...b, enabled: e.detail.value } : b
    ))
    this.setData({ badgeList })
  },

  onDeleteBadge(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除徽章',
      content: '确定删除？',
      success: (res) => {
        if (!res.confirm) return
        this.setData({ badgeList: this.data.badgeList.filter((_, i) => i !== index) })
      }
    })
  },

  async onSave() {
    if (this.data.saving || !this.data.badgeList.length) {
      if (!this.data.badgeList.length) wx.showToast({ title: '请至少保留一个徽章', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await put('/api/config/owner', {
        badges: this.data.badgeList,
        achievement: { preview_all: this.data.badgePreviewAll }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
