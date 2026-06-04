const { get, put } = require('../../../../utils/request.js')
const { mmddToPickerValue, dateToMMDD, mmddToDisplay } = require('../../../../utils/ownerSettingsDate.js')

Page({
  data: {
    loading: true,
    saving: false,
    relationshipStart: '',
    relationshipStartValue: '',
    anniversaryDate: '',
    anniversaryDisplay: '',
    anniversaryPickerValue: '',
    customerBirthday: '',
    birthdayDisplay: '',
    birthdayPickerValue: ''
  },

  async onLoad() { await this.fetchConfig() },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const d = (await get('/api/config/owner')).data || {}
      const relationshipStart = d.relationship_start || ''
      const anniversaryDate = d.anniversary_date || ''
      const customerBirthday = d.customer_birthday || ''
      this.setData({
        loading: false,
        relationshipStart,
        relationshipStartValue: relationshipStart || mmddToPickerValue(''),
        anniversaryDate,
        anniversaryDisplay: mmddToDisplay(anniversaryDate),
        anniversaryPickerValue: mmddToPickerValue(anniversaryDate),
        customerBirthday,
        birthdayDisplay: mmddToDisplay(customerBirthday),
        birthdayPickerValue: mmddToPickerValue(customerBirthday)
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onPickRelationshipStart(e) {
    const value = e.detail.value
    this.setData({ relationshipStart: value, relationshipStartValue: value })
  },
  onPickAnniversary(e) {
    const mmdd = dateToMMDD(e.detail.value)
    this.setData({
      anniversaryDate: mmdd,
      anniversaryDisplay: mmddToDisplay(mmdd),
      anniversaryPickerValue: e.detail.value
    })
  },
  onPickBirthday(e) {
    const mmdd = dateToMMDD(e.detail.value)
    this.setData({
      customerBirthday: mmdd,
      birthdayDisplay: mmddToDisplay(mmdd),
      birthdayPickerValue: e.detail.value
    })
  },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await put('/api/config/owner', {
        relationship_start: this.data.relationshipStart.trim(),
        anniversary_date: this.data.anniversaryDate.trim(),
        customer_birthday: this.data.customerBirthday.trim()
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
