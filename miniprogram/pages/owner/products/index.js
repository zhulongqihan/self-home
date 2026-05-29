const { get, patch, del } = require('../../../utils/request')
const { getProductCover } = require('../../../utils/productImage')

const STATUS_TEXT = { on_sale: '在售', off_sale: '已下架' }

Page({
  data: {
    loading: true,
    categories: [],
    categoryIndex: 0,
    products: [],
    filterStatus: 'all',
    filteredProducts: []
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [catResp, prodResp] = await Promise.all([
        get('/api/categories'),
        get('/api/products/owner/all')
      ])
      const categories = [{ _id: '', name: '全部分类' }, ...(catResp.data || [])]
      const products = (prodResp.data || []).map(p => {
        const cover = getProductCover(p)
        return {
          ...p,
          cover_url: cover.url,
          cover_emoji: cover.emoji,
          status_text: STATUS_TEXT[p.status] || p.status
        }
      })
      this.setData({ categories, products, loading: false })
      this.applyFilter()
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  applyFilter() {
    const { products, categories, categoryIndex, filterStatus } = this.data
    const catId = categories[categoryIndex] && categories[categoryIndex]._id
    let list = products
    if (catId) list = list.filter(p => String(p.category_id) === String(catId))
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)
    this.setData({ filteredProducts: list })
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
    this.applyFilter()
  },

  onFilterStatus(e) {
    this.setData({ filterStatus: e.currentTarget.dataset.status })
    this.applyFilter()
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/owner/products/edit' })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/owner/products/edit?id=${id}` })
  },

  async onToggleStatus(e) {
    const { id, status } = e.currentTarget.dataset
    const next = status === 'on_sale' ? 'off_sale' : 'on_sale'
    const label = next === 'on_sale' ? '上架' : '下架'
    wx.showLoading({ title: label + '中' })
    try {
      await patch(`/api/products/${id}/status`, { status: next })
      wx.showToast({ title: '已' + label, icon: 'success' })
      await this.loadData()
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '删除商品',
      content: `确定删除「${name}」？此操作不可恢复`,
      success: async res => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          await del(`/api/products/${id}`)
          wx.showToast({ title: '已删除', icon: 'success' })
          await this.loadData()
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  }
})
