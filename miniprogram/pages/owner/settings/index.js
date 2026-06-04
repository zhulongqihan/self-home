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
const BADGE_TRIGGER_LABELS = ['连续签到天数', '累计亲亲次数', '累计下单次数']
const BADGE_TRIGGER_VALUES = ['sign_in_days', 'kiss_total', 'order_count']

function normalizeHHmm(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return String(str || '').trim()
  return `${String(parseInt(m[1], 10)).padStart(2, '0')}:${m[2]}`
}

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
    changingPassword: false,
    weatherCityId: '',
    weatherCityName: '',
    weatherBanner: '',
    weatherSimulateRainy: false,
    timeEggSlots: [],
    timeEggStart: '07:00',
    timeEggEnd: '10:00',
    timeEggText: '',
    timeEggBanner: '',
    timeEggEnabled: true,
    timePreviewPicker: 0,
    timePreviewLabels: ['自动（当前时间）'],
    savingTimeEggs: false,
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
    badgePreviewAll: false,
    savingBadges: false
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
      const weather = d.weather || {}
      const timeEgg = d.time_egg || {}
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
      const timePreviewPicker = previewIndex < 0 ? 0 : previewIndex + 1
      const achievement = d.achievement || {}
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
        birthdayPickerValue: mmddToPickerValue(customerBirthday),
        weatherCityId: weather.city_id || '',
        weatherCityName: weather.city_name || '',
        weatherBanner: weather.banner_text || '下雨天，来杯热饮暖暖手～',
        weatherSimulateRainy: !!weather.simulate_rainy,
        timeEggSlots,
        timePreviewPicker,
        timePreviewLabels,
        badgeList,
        badgePreviewAll: !!achievement.preview_all
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
  onInputWeatherCityId(e) { this.setData({ weatherCityId: e.detail.value }) },
  onInputWeatherCityName(e) { this.setData({ weatherCityName: e.detail.value }) },
  onInputWeatherBanner(e) { this.setData({ weatherBanner: e.detail.value }) },
  onToggleWeatherSimulate(e) { this.setData({ weatherSimulateRainy: e.detail.value }) },
  onInputTimeEggText(e) { this.setData({ timeEggText: e.detail.value }) },
  onInputTimeEggBanner(e) { this.setData({ timeEggBanner: e.detail.value }) },
  onPickTimeEggStart(e) { this.setData({ timeEggStart: e.detail.value }) },
  onPickTimeEggEnd(e) { this.setData({ timeEggEnd: e.detail.value }) },
  onToggleTimeEggEnabled(e) { this.setData({ timeEggEnabled: e.detail.value }) },
  onPickTimePreview(e) {
    this.setData({ timePreviewPicker: parseInt(e.detail.value, 10) || 0 })
  },

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
    const timePreviewLabels = [
      '自动（当前时间）',
      ...timeEggSlots.map(s => `${s.start} - ${s.end}`)
    ]
    this.setData({
      timeEggSlots,
      timePreviewLabels,
      timeEggText: '',
      timeEggBanner: '',
      timeEggEnabled: true
    })
  },

  onToggleTimeSlot(e) {
    const index = e.currentTarget.dataset.index
    const enabled = e.detail.value
    const timeEggSlots = this.data.timeEggSlots.map((s, i) => (
      i === index ? { ...s, enabled } : s
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
        const timePreviewLabels = [
          '自动（当前时间）',
          ...timeEggSlots.map(s => `${s.start} - ${s.end}`)
        ]
        let timePreviewPicker = this.data.timePreviewPicker
        if (timePreviewPicker > timeEggSlots.length) timePreviewPicker = 0
        this.setData({ timeEggSlots, timePreviewLabels, timePreviewPicker })
      }
    })
  },

  async onSaveTimeEggs() {
    if (this.data.savingTimeEggs) return
    const slots = this.data.timeEggSlots.map(s => ({
      ...s,
      start: normalizeHHmm(s.start),
      end: normalizeHHmm(s.end)
    }))
    if (!slots.length) {
      wx.showToast({ title: '请至少保留一条时段', icon: 'none' })
      return
    }
    this.setData({ savingTimeEggs: true })
    try {
      const picker = this.data.timePreviewPicker
      const preview_index = picker <= 0 ? -1 : picker - 1
      await put('/api/config/owner', {
        time_easter_eggs: slots,
        time_egg: { preview_index }
      })
      wx.showToast({ title: '时段彩蛋已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ savingTimeEggs: false })
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

  triggerLabel(trigger) {
    const idx = BADGE_TRIGGER_VALUES.indexOf(trigger)
    return idx >= 0 ? BADGE_TRIGGER_LABELS[idx] : trigger
  },

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
    const badge = {
      id,
      name,
      emoji: (this.data.badgeEmoji || '🏅').trim() || '🏅',
      description,
      trigger: BADGE_TRIGGER_VALUES[this.data.badgeTriggerIndex] || 'sign_in_days',
      threshold: Math.max(1, threshold),
      hidden: this.data.badgeHidden,
      enabled: this.data.badgeEnabled
    }
    this.setData({
      badgeList: [...this.data.badgeList, badge],
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
    const enabled = e.detail.value
    const badgeList = this.data.badgeList.map((b, i) => (
      i === index ? { ...b, enabled } : b
    ))
    this.setData({ badgeList })
  },

  onDeleteBadge(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除徽章',
      content: '确定删除该成就徽章？',
      success: (res) => {
        if (!res.confirm) return
        this.setData({ badgeList: this.data.badgeList.filter((_, i) => i !== index) })
      }
    })
  },

  async onSaveBadges() {
    if (this.data.savingBadges) return
    if (!this.data.badgeList.length) {
      wx.showToast({ title: '请至少保留一个徽章', icon: 'none' })
      return
    }
    this.setData({ savingBadges: true })
    try {
      await put('/api/config/owner', {
        badges: this.data.badgeList,
        achievement: { preview_all: this.data.badgePreviewAll }
      })
      wx.showToast({ title: '成就徽章已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ savingBadges: false })
    }
  },

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
        eggs_switch: this.buildEggsSwitch(),
        weather: {
          city_id: this.data.weatherCityId.trim(),
          city_name: this.data.weatherCityName.trim(),
          banner_text: this.data.weatherBanner.trim(),
          simulate_rainy: this.data.weatherSimulateRainy
        }
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
