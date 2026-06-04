const { get, put } = require('../../../../utils/request.js')
const { clearCached } = require('../../../../utils/uiConfig.js')
const { updateStore } = require('../../../../utils/auth.js')

const THEME_LABELS = ['暖阳大地', '云朵白']
const THEME_VALUES = ['default', 'cloud']
const STATUS_LABELS = ['营业中', '休息中']
const STATUS_VALUES = ['open', 'closed']

Page({
  data: {
    loading: true,
    saving: false,
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
    eggList: []
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
      const tab = d.tab_bar || {}
      const discover = d.discover_placeholder || {}
      this.setData({
        loading: false,
        storeName: d.store_name || '',
        ownerNickname: d.owner_nickname || '',
        customerNickname: d.customer_nickname || '',
        currencyName: d.currency_name || '',
        currencyEmoji: d.currency_emoji || '',
        storeStatusIndex: Math.max(0, STATUS_VALUES.indexOf(d.store_status || 'open')),
        themeIndex: Math.max(0, THEME_VALUES.indexOf(d.default_theme || 'default')),
        tabKitchen: tab.kitchen || '',
        tabOrders: tab.orders || '',
        tabDiscover: tab.discover || '',
        tabProfile: tab.profile || '',
        discoverTitle: discover.title || '',
        discoverDesc: discover.desc || '',
        eggList
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
  onPickStoreStatus(e) { this.setData({ storeStatusIndex: parseInt(e.detail.value, 10) || 0 }) },
  onPickTheme(e) { this.setData({ themeIndex: parseInt(e.detail.value, 10) || 0 }) },
  onToggleEgg(e) {
    const key = e.currentTarget.dataset.key
    const enabled = e.detail.value
    const eggList = this.data.eggList.map(item => (
      item.key === key ? { ...item, enabled } : item
    ))
    this.setData({ eggList })
  },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
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
      updateStore({ name: d.store_name, status: d.store_status, theme: d.default_theme })
      clearCached()
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
