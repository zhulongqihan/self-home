const { get } = require('../../../utils/request')

Page({
  data: {
    loading: true,
    categories: [],
    activeCategoryId: '',
    products: []
  },

  onLoad() {
    this.fetchCategoriesAndProducts()
  },

  async fetchCategoriesAndProducts() {
    this.setData({ loading: true })
    try {
      const categoryResp = await get('/api/categories')
      const categories = (categoryResp.data || []).map(c => ({
        id: c._id,
        name: c.name,
        icon: c.icon
      }))
      const activeCategoryId = categories.length ? categories[0].id : ''
      this.setData({ categories, activeCategoryId })
      await this.fetchProducts(activeCategoryId)
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  async fetchProducts(categoryId) {
    try {
      const query = categoryId ? `?category_id=${categoryId}` : ''
      const resp = await get(`/api/products${query}`)
      this.setData({ products: resp.data || [], loading: false })
    } catch (err) {
      wx.showToast({ title: err.message || '商品加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onSwitchCategory(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.activeCategoryId) return
    this.setData({ activeCategoryId: id, loading: true })
    this.fetchProducts(id)
  },

  onTapProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/customer/products/detail?id=${id}` })
  }
})
