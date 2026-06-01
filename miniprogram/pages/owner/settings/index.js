const { get, put, post } = require('../../../utils/request.js')
const { clearCached } = require('../../../utils/uiConfig.js')
const { updateStore } = require('../../../utils/auth.js')

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

const THEME_LABELS = ['暖阳大地', '云朵白']
const THEME_VALUES = ['default', 'cloud']
const STATUS_LABELS = ['营业中', '休息中']
const STATUS_VALUES = ['open', 'closed']

Page({
  data: {
    loading: true,
    storeName: '',
    ownerNickname: '',
    customerNickname: '',
    currencyName: '',
    currencyEmoji: '',
    storeStatusIndex: 0,
    storeStatusLabels: STATUS_LABELS,
    themeIndex: 0,
    themeLabels: THEME_LABELS,
    tabKitchen: '',
    tabOrders: '',
    tabDiscover: '',
    tabProfile: '',
    discoverTitle: '',
    discoverDesc: '',
    eggList: [],
    welcomeText: '',
    welcomeImageUrl: '',
    relationshipStart: '',
    relationshipStartValue: '',
    anniversaryDate: '',
    anniversaryDisplay: '',
    anniversaryPickerValue: '',
    customerBirthday: '',
    birthdayDisplay: '',
    birthdayPickerValue: '',
    savingGeneral: false,
    savingWelcome: false,
    savingCountdowns: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    changingPassword: false
  },

  async onLoad() {
    await this.fetchConfig()
  },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/config/owner')
      const d = resp.data || {}
      const eggs = d.eggs_switch || {}
      const meta = d.egg_meta || []
      const eggList = meta.map(item => ({
        key: item.key,
        label: item.label,
        enabled: eggs[item.key] !== false
      }))
      const storeStatusIndex = Math.max(0, STATUS_VALUES.indexOf(d.store_status || 'open'))
      const themeIndex = Math.max(0, THEME_VALUES.indexOf(d.default_theme || 'default'))
      const tab = d.tab_bar || {}
      const discover = d.discover_placeholder || {}
      const w = d.welcome || {}
      const relationshipStart = d.relationship_start || ''
      const anniversaryDate = d.anniversary_date || ''
      const customerBirthday = d.customer_birthday || ''
      this.setData({
        loading: false,
        storeName: d.store_name || '',
        ownerNickname: d.owner_nickname || '',
        customerNickname: d.customer_nickname || '',
        currencyName: d.currency_name || '',
        currencyEmoji: d.currency_emoji || '',
        storeStatusIndex,
        themeIndex,
        tabKitchen: tab.kitchen || '',
        tabOrders: tab.orders || '',
        tabDiscover: tab.discover || '',
        tabProfile: tab.profile || '',
        discoverTitle: discover.title || '',
        discoverDesc: discover.desc || '',
        eggList,
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
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  buildEggsSwitch() {
    const out = {}
    this.data.eggList.forEach(item => {
      out[item.key] = !!item.enabled
    })
    return out
  },

  onInputStoreName(e) { this.setData({ storeName: e.detail.value }) },
  onInputOwnerNickname(e) { this.setData({ ownerNickname: e.detail.value }) },
  onInputCustomerNickname(e) { this.setData({ customerNickname: e.detail.value }) },
  onInputCurrencyName(e) { this.setData({ currencyName: e.detail.value }) },
  onInputCurrencyEmoji(e) { this.setData({ currencyEmoji: e.detail.value }) },
  onInputTabKitchen(e) { this.setData({ tabKitchen: e.detail.value }) },
  onInputTabOrders(e) { this.setData({ tabOrders: e.detail.value }) },
  onInputTabDiscover(e) { this.setData({ tabDiscover: e.detail.value }) },
  onInputTabProfile(e) { this.setData({ tabProfile: e.detail.value }) },
  onInputDiscoverTitle(e) { this.setData({ discoverTitle: e.detail.value }) },
  onInputDiscoverDesc(e) { this.setData({ discoverDesc: e.detail.value }) },
  onInputText(e) { this.setData({ welcomeText: e.detail.value }) },
  onInputImage(e) { this.setData({ welcomeImageUrl: e.detail.value }) },
  onInputCurrentPassword(e) { this.setData({ currentPassword: e.detail.value }) },
  onInputNewPassword(e) { this.setData({ newPassword: e.detail.value }) },
  onInputConfirmPassword(e) { this.setData({ confirmPassword: e.detail.value }) },

  onPickStoreStatus(e) {
    this.setData({ storeStatusIndex: parseInt(e.detail.value, 10) || 0 })
  },

  onPickTheme(e) {
    this.setData({ themeIndex: parseInt(e.detail.value, 10) || 0 })
  },

  onToggleEgg(e) {
    const key = e.currentTarget.dataset.key
    const enabled = e.detail.value
    const eggList = this.data.eggList.map(item => (
      item.key === key ? { ...item, enabled } : item
    ))
    this.setData({ eggList })
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

  async onSaveGeneral() {
    if (this.data.savingGeneral) return
    this.setData({ savingGeneral: true })
    try {
      const resp = await put('/api/config/owner', {
        store_name: this.data.storeName.trim(),
        owner_nickname: this.data.ownerNickname.trim(),
        customer_nickname: this.data.customerNickname.trim(),
        currency_name: this.data.currencyName.trim(),
        currency_emoji: this.data.currencyEmoji.trim(),
        store_status: STATUS_VALUES[this.data.storeStatusIndex] || 'open',
        default_theme: THEME_VALUES[this.data.themeIndex] || 'default',
        tab_bar: {
          kitchen: this.data.tabKitchen.trim(),
          orders: this.data.tabOrders.trim(),
          discover: this.data.tabDiscover.trim(),
          profile: this.data.tabProfile.trim()
        },
        discover_placeholder: {
          title: this.data.discoverTitle.trim(),
          desc: this.data.discoverDesc.trim()
        },
        eggs_switch: this.buildEggsSwitch()
      })
      const d = resp.data || {}
      updateStore({
        name: d.store_name,
        status: d.store_status,
        theme: d.default_theme
      })
      clearCached()
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ savingGeneral: false })
    }
  },

  async onSaveWelcome() {
    if (this.data.savingWelcome) return
    this.setData({ savingWelcome: true })
    try {
      await put('/api/config/owner', {
        welcome: {
          text: this.data.welcomeText,
          image_url: this.data.welcomeImageUrl
        }
      })
      clearCached()
      wx.showToast({ title: '欢迎页已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ savingWelcome: false })
    }
  },

  async onSaveCountdowns() {
    if (this.data.savingCountdowns) return
    this.setData({ savingCountdowns: true })
    try {
      await put('/api/config/owner', {
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
  },

  async onChangePassword() {
    if (this.data.changingPassword) return
    const current = this.data.currentPassword
    const next = this.data.newPassword
    const confirm = this.data.confirmPassword
    if (!current || !next) {
      wx.showToast({ title: '请填写当前暗号和新暗号', icon: 'none' })
      return
    }
    if (next.length < 4) {
      wx.showToast({ title: '新暗号至少 4 位', icon: 'none' })
      return
    }
    if (next !== confirm) {
      wx.showToast({ title: '两次新暗号不一致', icon: 'none' })
      return
    }
    this.setData({ changingPassword: true })
    try {
      await post('/api/auth/change-password', {
        current_password: current,
        new_password: next
      })
      this.setData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      wx.showToast({ title: '暗号已更新', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '修改失败', icon: 'none' })
    } finally {
      this.setData({ changingPassword: false })
    }
  }
})
