const { get } = require('../../../../utils/request.js')
const { mmddToDisplay } = require('../../../../utils/ownerSettingsDate.js')

Page({
  data: {
    loading: true,
    lockNote: '',
    ownerNickname: '店长',
    customerNickname: '宝宝',
    relationshipStart: '',
    anniversaryDisplay: '',
    customerBirthdayDisplay: '',
    ownerBirthdayDisplay: ''
  },

  async onLoad() {
    await this.fetchConfig()
  },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const d = (await get('/api/config/countdowns/owner')).data || {}
      this.setData({
        loading: false,
        lockNote: d.lock_note || '重要日期已固定',
        ownerNickname: d.owner_nickname || '店长',
        customerNickname: d.customer_nickname || '宝宝',
        relationshipStart: d.relationship_start || '',
        anniversaryDisplay: mmddToDisplay(d.anniversary_date),
        customerBirthdayDisplay: mmddToDisplay(d.customer_birthday),
        ownerBirthdayDisplay: mmddToDisplay(d.owner_birthday)
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  }
})
