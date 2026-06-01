const { get } = require('../../../utils/request.js')
const { getProductCover } = require('../../../utils/productImage.js')
const { getCartStats } = require('../../../utils/cart.js')
const { getToken } = require('../../../utils/auth.js')
const { fetchLatestOwnerMessage } = require('../../../utils/ownerMessage.js')

Page({
  data: {
    loading: true,
    loadError: false,
    categories: [],
    activeCategoryId: '',
    products: [],
    festival: null,
    festivalProducts: [],
    cartCount: 0,
    cartTotal: 0,
    drawerOpen: false,
    specVisible: false,
    specProduct: null,
    bulletText: ''
  },

  onShow() {
    this.refreshCartBar()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    if (!getToken()) {
      this.setData({ loading: false, loadError: false })
      return
    }
    this.startKitchenLoad()
    this.scheduleBulletMessage()
  },

  startKitchenLoad() {
    const seq = (this._loadSeq || 0) + 1
    this._loadSeq = seq
    this.fetchKitchenData(seq)
  },

  scheduleBulletMessage() {
    if (this._bulletTimer) clearTimeout(this._bulletTimer)
    this._bulletTimer = setTimeout(() => this.loadBulletMessage(), 500)
  },

  loadBulletMessage() {
    if (this._bulletLoading) return
    this._bulletLoading = true
    fetchLatestOwnerMessage()
      .then(msg => {
        this.setData({ bulletText: (msg && msg.content) ? msg.content : '' })
      })
      .finally(() => {
        this._bulletLoading = false
      })
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
    return '暂无评价 · 月销 ' + sales
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

  async fetchKitchenData(seq) {
    this.setData({ loading: true, loadError: false })
    try {
      const [categoryResp, festivalResp] = await Promise.all([
        get('/api/categories'),
        get('/api/festivals/active').catch(() => ({ data: null }))
      ])
      if (seq !== this._loadSeq) return

      const raw = categoryResp.data
      const list = Array.isArray(raw) ? raw : []
      const categories = list
        .map(c => ({
          id: String(c._id || c.id || ''),
          name: c.name,
          icon: c.icon
        }))
        .filter(c => c.id)

      const festData = festivalResp.data || null
      const festival = festData
        ? {
            id: festData.id,
            name: festData.name,
            banner: festData.banner || '',
            themeColor: festData.theme_color || '#E8B86D'
          }
        : null
      const festivalProducts = festData && Array.isArray(festData.products)
        ? this.mapProducts(festData.products)
        : []

      const prevId = this.data.activeCategoryId
      const activeCategoryId = categories.some(c => c.id === prevId)
        ? prevId
        : (categories.length ? categories[0].id : '')

      this.setData({ categories, activeCategoryId, festival, festivalProducts })

      if (activeCategoryId) {
        await this.fetchProducts(activeCategoryId, seq)
      } else {
        this.setData({ products: [], loading: false, loadError: false })
      }
    } catch (err) {
      if (seq !== this._loadSeq) return
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      this.setData({ loading: false, loadError: true })
    }
  },

  async fetchProducts(categoryId, seq) {
    if (!categoryId) {
      if (seq === undefined || seq === this._loadSeq) {
        this.setData({ products: [], loading: false })
      }
      return
    }
    if (seq === undefined) {
      seq = this._loadSeq
      this.setData({ loading: true, loadError: false })
    }
    try {
      const resp = await get(`/api/products?category_id=${categoryId}`)
      if (seq !== this._loadSeq) return
      const raw = resp.data
      const list = Array.isArray(raw) ? raw : []
      this.setData({
        products: this.mapProducts(list),
        loading: false,
        loadError: false
      })
    } catch (err) {
      if (seq !== this._loadSeq) return
      wx.showToast({ title: err.message || '商品加载失败', icon: 'none' })
      this.setData({ loading: false, loadError: true })
    }
  },

  onCoverError(e) {
    const id = e.currentTarget.dataset.id
    const patchList = list => (list || []).map(p => {
      if (p._id !== id) return p
      return { ...p, coverUrl: '', coverEmoji: p.coverEmoji || '🍵' }
    })
    this.setData({
      products: patchList(this.data.products),
      festivalProducts: patchList(this.data.festivalProducts)
    })
  },

  onSwitchCategory(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.activeCategoryId) return
    this.setData({ activeCategoryId: id })
    this.fetchProducts(id)
  },

  onTapAdd(e) {
    const id = e.currentTarget.dataset.id
    const product = this.findProduct(id)
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
    const product = this.findProduct(id)
    if (product) this.setData({ specVisible: true, specProduct: product })
  },

  findProduct(id) {
    return this.data.products.find(p => p._id === id)
      || this.data.festivalProducts.find(p => p._id === id)
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
