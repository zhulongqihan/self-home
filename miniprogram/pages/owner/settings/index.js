const { get, put } = require('../../../utils/request.js')
const { clearCached } = require('../../../utils/uiConfig.js')

function mmddToPickerValue(mmdd) {
  if (mmdd && /^\d{2}-\d{2}$/.test(mmdd)) {
    return `2000-${mmdd}`
  }
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

function dateToMMDD(dateStr) {
  const parts = String(dateStr || '').split('-')
  if (parts.length >= 3) return `${parts[1]}-${parts[2]}`
  return ''
}

function mmddToDisplay(mmdd) {
  if (!mmdd || !/^\d{2}-\d{2}$/.test(mmdd)) return ''
  const [m, d] = mmdd.split('-')
  return `${parseInt(m, 10)}月${parseInt(d, 10)}日`
}

Page({
  data: {
    welcomeText: '',
    welcomeImageUrl: '',
    saving: false,
    relationshipStart: '',
    relationshipStartValue: '',
    anniversaryDate: '',
    anniversaryDisplay: '',
    anniversaryPickerValue: '',
    customerBirthday: '',
    birthdayDisplay: '',
    birthdayPickerValue: '',
    savingCountdowns: false
  },

  async onLoad() {
    try {
      const [welcomeResp, countdownResp] = await Promise.all([
        get('/api/config/welcome'),
        get('/api/config/countdowns/owner')
      ])
      const w = welcomeResp.data || {}
      const c = countdownResp.data || {}
      const relationshipStart = c.relationship_start || ''
      const anniversaryDate = c.anniversary_date || ''
      const customerBirthday = c.customer_birthday || ''
      this.setData({
        welcomeText: w.text || '',
        welcomeImageUrl: w.image_url || '',
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
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onInputText(e) {
    this.setData({ welcomeText: e.detail.value })
  },

  onInputImage(e) {
    this.setData({ welcomeImageUrl: e.detail.value })
  },

  onPickRelationshipStart(e) {
    const value = e.detail.value
    this.setData({
      relationshipStart: value,
      relationshipStartValue: value
    })
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
  },

  async onSaveCountdowns() {
    if (this.data.savingCountdowns) return
    this.setData({ savingCountdowns: true })
    try {
      await put('/api/config/countdowns', {
        relationship_start: this.data.relationshipStart.trim(),
        anniversary_date: this.data.anniversaryDate.trim(),
        customer_birthday: this.data.customerBirthday.trim()
      })
      wx.showToast({ title: '倒计时已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ savingCountdowns: false })
    }
  }
})
