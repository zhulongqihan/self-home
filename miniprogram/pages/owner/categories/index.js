const { get, post, put, patch, del } = require('../../../utils/request.js')

Page({
  data: {
    loading: true,
    saving: false,
    items: [],
    editingId: '',
    name: '',
    icon: '',
    sortOrder: '0',
    festivalOnly: false
  },

  onShow() {
    this.fetchList()
  },

  async fetchList() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/categories/owner/all')
      this.setData({ loading: false, items: resp.data || [] })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  resetForm() {
    this.setData({
      editingId: '',
      name: '',
      icon: '',
      sortOrder: '0',
      festivalOnly: false
    })
  },

  onInputName(e) {
    this.setData({ name: e.detail.value })
  },

  onInputIcon(e) {
    this.setData({ icon: e.detail.value })
  },

  onInputSort(e) {
    this.setData({ sortOrder: e.detail.value })
  },

  onToggleFestivalOnly(e) {
    this.setData({ festivalOnly: e.detail.value })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.items.find(it => it.id === id)
    if (!item) return
    this.setData({
      editingId: id,
      name: item.name,
      icon: item.icon || '',
      sortOrder: String(item.sort_order || 0),
      festivalOnly: !!item.festival_only
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
      wx.showToast({ title: '请填写分类名称', icon: 'none' })
      return
    }
    const body = {
      name,
      icon: this.data.icon.trim(),
      sort_order: parseInt(this.data.sortOrder, 10) || 0,
      festival_only: this.data.festivalOnly
    }
    this.setData({ saving: true })
    try {
      if (this.data.editingId) {
        await put(`/api/categories/${this.data.editingId}`, body)
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        await post('/api/categories', body)
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
      await patch(`/api/categories/${id}/status`, { status })
      wx.showToast({ title: status === 'enabled' ? '已启用' : '已停用', icon: 'success' })
      this.fetchList()
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除分类',
      content: '仅当分类下无商品时可删除，确定？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await del(`/api/categories/${id}`)
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
