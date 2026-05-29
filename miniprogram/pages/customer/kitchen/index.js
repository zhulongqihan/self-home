const { get } = require('../../../utils/request.js')
const { getProductCover } = require('../../../utils/productImage.js')
const { getCartStats } = require('../../../utils/cart.js')

Page({
  data: {
    loading: true,
    loadError: false,
    categories: [],
    activeCategoryId: '',
    products: [],
    cartCount: 0,
    cartTotal: 0,
    drawerOpen: false,
    specVisible: false,
    specProduct: null
  },

  onLoad() {
    this.fetchCategoriesAndProducts()
  },

  onShow() {
    this.refreshCartBar()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onHide() {
    this.setData({ specVisible: false, specProduct: null, drawerOpen: false })
  },

  refreshCartBar() {
    const { count, totalPrice } = getCartStats()
    this.setData({ cartCount: count, cartTotal: totalPrice })
    const bar = this.selectComponent('#cartBar')
    if (bar && bar.refresh) bar.refresh()
  },

  formatProductMeta(p) {
    const sales = p.sales_count || 0
    if (p.review_count > 0) {
      return `★ ${p.rating_avg} · 月销 ${sales}`
    }
    return `暂无评价 · 月销 ${sales}`
  },

  mapProducts(list) {
    return (list || []).map(p => {
      const cover = getProductCover(p)
      const hasSpecs = Array.isArray(p.specs) && p.specs.length > 0
      return {
        ...p,
        coverUrl: cover.url,
        coverEmoji: cover.emoji,
        hasSpecs,
        metaText: this.formatProductMeta(p)
      }
    })
  },

  async fetchCategoriesAndProducts() {
    this.setData({ loading: true, loadError: false })
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
      this.setData({ loading: false, loadError: true })
    }
  },

  async fetchProducts(categoryId) {
    this.setData({ loadError: false })
    try {
      const query = categoryId ? `?category_id=${categoryId}` : ''
      const resp = await get(`/api/products${query}`)
      this.setData({
        products: this.mapProducts(resp.data),
        loading: false
      })
    } catch (err) {
      wx.showToast({ title: err.message || '商品加载失败', icon: 'none' })
      this.setData({ loading: false, loadError: true })
    }
  },

  onCoverError(e) {
    const id = e.currentTarget.dataset.id
    const products = this.data.products.map(p => {
      if (p._id !== id) return p
      return { ...p, coverUrl: '', coverEmoji: p.coverEmoji || '🍵' }
    })
    this.setData({ products })
  },

  onSwitchCategory(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.activeCategoryId) return
    this.setData({ activeCategoryId: id, loading: true })
    this.fetchProducts(id)
  },

  onTapAdd(e) {
    const id = e.currentTarget.dataset.id
    const product = this.data.products.find(p => p._id === id)
    if (!product) return
    if (product.hasSpecs) {
      this.setData({ specVisible: true, specProduct: product })
      return
    }
    const { addToCart } = require('../../../utils/cart.js')
    addToCart({
      product_id: product._id,
      name: product.name,
      image: product.coverUrl || product.coverEmoji,
      price: product.price,
      specs: [],
      qty: 1
    })
    this.refreshCartBar()
    wx.showToast({ title: '已加入', icon: 'success', duration: 800 })
  },

  onTapSpec(e) {
    const id = e.currentTarget.dataset.id
    const product = this.data.products.find(p => p._id === id)
    if (product) this.setData({ specVisible: true, specProduct: product })
  },

  onSpecClose() {
    this.setData({ specVisible: false, specProduct: null })
  },

  onSpecAdded() {
    this.setData({ specVisible: false, specProduct: null })
    this.refreshCartBar()
  },

  onToggleDrawer() {
    this.setData({ drawerOpen: !this.data.drawerOpen })
  },

  onDrawerClose() {
    this.setData({ drawerOpen: false })
  },

  onCartUpdated() {
    this.refreshCartBar()
  },

  onOrderSuccess() {
    this.setData({
      drawerOpen: false,
      specVisible: false,
      specProduct: null,
      cartCount: 0,
      cartTotal: 0
    })
    this.refreshCartBar()
    wx.switchTab({ url: '/pages/customer/orders/index' })
  }
})
