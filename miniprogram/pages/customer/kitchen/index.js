const { get } = require('../../../utils/request.js')
const { getProductCover } = require('../../../utils/productImage.js')
const { getCartStats } = require('../../../utils/cart.js')

Page({
  data: {
    loading: true,
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

  refreshCartBar() {
    const { count, totalPrice } = getCartStats()
    this.setData({ cartCount: count, cartTotal: totalPrice })
    const bar = this.selectComponent('#cartBar')
    if (bar && bar.refresh) bar.refresh()
  },

  mapProducts(list) {
    return (list || []).map(p => {
      const cover = getProductCover(p)
      const hasSpecs = Array.isArray(p.specs) && p.specs.length > 0
      return { ...p, coverUrl: cover.url, coverEmoji: cover.emoji, hasSpecs }
    })
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
      this.setData({
        products: this.mapProducts(resp.data),
        loading: false
      })
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
    this.setData({ drawerOpen: false })
    this.refreshCartBar()
    wx.switchTab({ url: '/pages/customer/orders/index' })
  }
})
