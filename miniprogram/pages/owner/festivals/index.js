const { get, post, put, patch, del } = require('../../../utils/request.js')

const DATE_TYPES = ['fixed', 'lunar']
const DATE_TYPE_LABELS = ['公历固定', '农历（预留）']

Page({
  data: {
    loading: true,
    saving: false,
    productsLoading: false,
    items: [],
    products: [],
    editingId: '',
    name: '',
    dateTypeIndex: 0,
    dateTypeLabels: DATE_TYPE_LABELS,
    date: '',
    banner: '',
    themeColor: '#E8B86D',
    pushTemplate: '',
    selectedProductIds: []
  },

  onShow() {
    this.fetchList()
    this.fetchProducts()
  },

  async fetchList() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/festivals/owner/all')
      this.setData({ loading: false, items: resp.data || [] })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  async fetchProducts() {
    this.setData({ productsLoading: true })
    try {
      const resp = await get('/api/products/owner/all')
      const list = (resp.data || []).map(p => ({
        id: p.id || p._id,
        name: p.name,
        checked: false
      }))
      this.applyProductChecks(list, this.data.selectedProductIds)
      this.setData({ productsLoading: false, products: list })
    } catch (err) {
      this.setData({ productsLoading: false })
    }
  },

  applyProductChecks(products, selectedIds) {
    const set = new Set((selectedIds || []).map(String))
    products.forEach(p => {
      p.checked = set.has(String(p.id))
    })
  },

  resetForm() {
    const products = this.data.products.map(p => ({ ...p, checked: false }))
    this.setData({
      editingId: '',
      name: '',
      dateTypeIndex: 0,
      date: '',
      banner: '',
      themeColor: '#E8B86D',
      pushTemplate: '',
      selectedProductIds: [],
      products
    })
  },

  onInputName(e) {
    this.setData({ name: e.detail.value })
  },

  onDateTypeChange(e) {
    this.setData({ dateTypeIndex: parseInt(e.detail.value, 10) || 0 })
  },

  onInputDate(e) {
    this.setData({ date: e.detail.value })
  },

  onInputBanner(e) {
    this.setData({ banner: e.detail.value })
  },

  onInputThemeColor(e) {
    this.setData({ themeColor: e.detail.value })
  },

  onInputPush(e) {
    this.setData({ pushTemplate: e.detail.value })
  },

  onToggleProduct(e) {
    const id = String(e.currentTarget.dataset.id)
    const products = this.data.products.map(p => {
      if (String(p.id) !== id) return p
      return { ...p, checked: !p.checked }
    })
    const selectedProductIds = products.filter(p => p.checked).map(p => p.id)
    this.setData({ products, selectedProductIds })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.items.find(it => it.id === id)
    if (!item) return
    const dateTypeIndex = DATE_TYPES.indexOf(item.date_type)
    const selectedProductIds = item.product_ids || []
    const products = this.data.products.map(p => ({
      ...p,
      checked: selectedProductIds.map(String).includes(String(p.id))
    }))
    this.setData({
      editingId: id,
      name: item.name,
      dateTypeIndex: dateTypeIndex >= 0 ? dateTypeIndex : 0,
      date: item.date || '',
      banner: item.banner || '',
      themeColor: item.theme_color || '#E8B86D',
      pushTemplate: item.push_template || '',
      selectedProductIds,
      products
    })
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  onCancelEdit() {
    this.resetForm()
  },

  async onSave() {
    if (this.data.saving) return
    const name = this.data.name.trim()
    if (!name) {
      wx.showToast({ title: '请填写节日名称', icon: 'none' })
      return
    }
    const date = this.data.date.trim()
    if (date && !/^\d{2}-\d{2}$/.test(date)) {
      wx.showToast({ title: '日期请用 MM-DD', icon: 'none' })
      return
    }
    const body = {
      name,
      date_type: DATE_TYPES[this.data.dateTypeIndex] || 'fixed',
      date,
      banner: this.data.banner.trim(),
      theme_color: this.data.themeColor.trim() || '#E8B86D',
      push_template: this.data.pushTemplate.trim(),
      product_ids: this.data.selectedProductIds
    }
    this.setData({ saving: true })
    try {
      if (this.data.editingId) {
        await put(`/api/festivals/${this.data.editingId}`, body)
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        await post('/api/festivals', body)
        wx.showToast({ title: '已添加', icon: 'success' })
      }
      this.resetForm()
      this.fetchList()
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  async onToggleStatus(e) {
    const { id, status } = e.currentTarget.dataset
    try {
      await patch(`/api/festivals/${id}/status`, { status })
      wx.showToast({ title: status === 'enabled' ? '已启用' : '已停用', icon: 'success' })
      this.fetchList()
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除节日',
      content: '确定删除该节日配置？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await del(`/api/festivals/${id}`)
          wx.showToast({ title: '已删除', icon: 'success' })
          if (this.data.editingId === id) this.resetForm()
          this.fetchList()
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        }
      }
    })
  }
})
