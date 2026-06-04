const { get, post } = require('../../../utils/request.js')
const { getProductCover } = require('../../../utils/productImage.js')
const { getCartStats } = require('../../../utils/cart.js')
const { getToken } = require('../../../utils/auth.js')
const { fetchUnreadOwnerMessage, markOwnerMessageSeen } = require('../../../utils/ownerMessage.js')

function getOptional(url) {
  return get(url).catch(() => ({ data: null }))
}

Page({
  data: {
    loading: true,
    loadError: false,
    categories: [],
    activeCategoryId: '',
    products: [],
    festival: null,
    festivalProducts: [],
    weather: null,
    weatherProducts: [],
    timeEgg: null,
    blindBox: null,
    blindRevealVisible: false,
    blindRevealProduct: null,
    blindShaking: false,
    cartCount: 0,
    cartTotal: 0,
    drawerOpen: false,
    specVisible: false,
    specProduct: null,
    bulletText: '',
    bulletMsgId: ''
  },

  onShow() {
    if (this._showBusy) return
    this._showBusy = true
    try {
      this.refreshCartBar()
      if (typeof this.getTabBar === 'function') {
        const tabBar = this.getTabBar()
        if (tabBar && tabBar.data.selected !== 0) {
          tabBar.setData({ selected: 0 })
        }
      }
      wx.hideLoading()
      if (!getToken()) {
        this.setData({ loading: false, loadError: false })
        return
      }
      this.scheduleKitchenLoad()
      this.scheduleBulletMessage()
    } finally {
      this._showBusy = false
    }
  },

  onHide() {
    this.setData({ specVisible: false, specProduct: null, drawerOpen: false, blindRevealVisible: false })
    this.stopBlindBoxListener()
    this.dismissBulletMessage()
    wx.hideLoading()
  },

  onUnload() {
    this.stopBlindBoxListener()
  },

  scheduleKitchenLoad() {
    if (this._loadTimer) clearTimeout(this._loadTimer)
    this._loadTimer = setTimeout(() => this.startKitchenLoad(), 30)
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
    fetchUnreadOwnerMessage()
      .then(msg => {
        if (!msg || !msg.content) {
          this.setData({ bulletText: '', bulletMsgId: '' })
          return
        }
        this.setData({ bulletText: msg.content, bulletMsgId: msg.id })
        if (this._bulletHideTimer) clearTimeout(this._bulletHideTimer)
        this._bulletHideTimer = setTimeout(() => this.dismissBulletMessage(), 16000)
      })
      .finally(() => {
        this._bulletLoading = false
      })
  },

  dismissBulletMessage() {
    if (this._bulletHideTimer) {
      clearTimeout(this._bulletHideTimer)
      this._bulletHideTimer = null
    }
    const id = this.data.bulletMsgId
    if (id) markOwnerMessageSeen({ id })
    this.setData({ bulletText: '', bulletMsgId: '' })
  },

  refreshCartBar() {
    const { count, totalPrice } = getCartStats()
    const changed = this.data.cartCount !== count || this.data.cartTotal !== totalPrice
    if (changed) {
      this.setData({ cartCount: count, cartTotal: totalPrice })
    }
    const bar = this.selectComponent('#cartBar')
    if (bar && bar.refresh) bar.refresh(true)
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
        metaText: this.formatProductMeta(p),
        blind_free: !!p.blind_free,
        original_price: p.original_price != null ? p.original_price : p.price
      }
    })
  },

  parseCategories(raw) {
    const list = Array.isArray(raw) ? raw : []
    return list
      .map(c => ({
        id: String(c._id || c.id || ''),
        name: c.name,
        icon: c.icon
      }))
      .filter(c => c.id)
  },

  applyFestival(festData) {
    if (!festData) {
      return { festival: null, festivalProducts: [] }
    }
    return {
      festival: {
        id: festData.id,
        name: festData.name,
        banner: festData.banner || '',
        themeColor: festData.theme_color || '#E8B86D'
      },
      festivalProducts: Array.isArray(festData.products)
        ? this.mapProducts(festData.products)
        : []
    }
  },

  applyWeather(weatherData) {
    if (!weatherData || !weatherData.active) {
      return { weather: null, weatherProducts: [] }
    }
    return {
      weather: {
        text: weatherData.text || '雨天',
        temp: weatherData.temp || '',
        banner: weatherData.banner || '下雨天，来杯热饮暖暖手～',
        cityName: weatherData.city_name || ''
      },
      weatherProducts: Array.isArray(weatherData.products)
        ? this.mapProducts(weatherData.products)
        : []
    }
  },

  applyTimeEgg(timeEggData) {
    if (!timeEggData || !timeEggData.active) {
      return { timeEgg: null }
    }
    return {
      timeEgg: {
        start: timeEggData.start || '',
        end: timeEggData.end || '',
        banner: timeEggData.banner || '',
        text: timeEggData.text || ''
      }
    }
  },

  applyBlindBox(blindData) {
    if (!blindData || !blindData.enabled) {
      this.stopBlindBoxListener()
      return { blindBox: null }
    }
    const blindBox = {
      title: blindData.title || '摇一摇开盲盒',
      hint: blindData.hint || '',
      buttonText: blindData.button_text || '点我摇一下',
      shakesLeft: blindData.shakes_left || 0,
      poolCount: blindData.pool_count || 0,
      simulateShake: !!blindData.simulate_shake
    }
    this.startBlindBoxListener(blindBox)
    return { blindBox }
  },

  startBlindBoxListener(blindBox) {
    if (!blindBox || blindBox.shakesLeft <= 0 || blindBox.poolCount <= 0) {
      this.stopBlindBoxListener()
      return
    }
    if (this.data.drawerOpen || this.data.specVisible || this.data.blindRevealVisible) {
      this.stopBlindBoxListener()
      return
    }
    if (this._accelStarted) return
    this._accelStarted = true
    this._lastAccel = { x: 0, y: 0, z: 0 }
    this._lastShakeAt = 0
    wx.startAccelerometer({ interval: 'game' })
    wx.onAccelerometerChange(this._onAccelerometerChange = (res) => {
      const { x, y, z } = res
      const delta = Math.abs(x + y + z - this._lastAccel.x - this._lastAccel.y - this._lastAccel.z)
      this._lastAccel = { x, y, z }
      if (delta > 1.15 && Date.now() - this._lastShakeAt > 2200) {
        if (this.data.drawerOpen || this.data.specVisible || this.data.blindRevealVisible || this.data.blindShaking) {
          return
        }
        this._lastShakeAt = Date.now()
        this.doBlindShake()
      }
    })
  },

  stopBlindBoxListener() {
    if (!this._accelStarted) return
    this._accelStarted = false
    if (this._onAccelerometerChange) {
      wx.offAccelerometerChange(this._onAccelerometerChange)
      this._onAccelerometerChange = null
    }
    wx.stopAccelerometer()
  },

  onTapBlindShake() {
    this.doBlindShake()
  },

  async doBlindShake() {
    const box = this.data.blindBox
    if (!box || this.data.blindShaking) return
    if (box.shakesLeft <= 0) {
      wx.showToast({ title: '今日次数已用完', icon: 'none' })
      return
    }
    if (box.poolCount <= 0) {
      wx.showToast({ title: '暂无在售商品', icon: 'none' })
      return
    }
    this.setData({ blindShaking: true })
    try {
      const resp = await post('/api/blind-box/shake')
      const d = resp.data || {}
      const product = d.product ? this.mapProducts([d.product])[0] : null
      if (!product) {
        wx.showToast({ title: '开奖失败', icon: 'none' })
        return
      }
      const blindBox = {
        ...this.data.blindBox,
        shakesLeft: d.shakes_left != null ? d.shakes_left : box.shakesLeft - 1
      }
      this.setData({
        blindBox,
        blindRevealProduct: product,
        blindRevealVisible: true
      })
      if (blindBox.shakesLeft <= 0) this.stopBlindBoxListener()
      wx.showToast({ title: '恭喜开盒！', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '摇一摇失败', icon: 'none' })
    } finally {
      this.setData({ blindShaking: false })
    }
  },

  onCloseBlindReveal() {
    this.setData({ blindRevealVisible: false, blindRevealProduct: null })
    if (this.data.blindBox) this.startBlindBoxListener(this.data.blindBox)
  },

  onBlindAddToCart() {
    const product = this.data.blindRevealProduct
    if (!product) return
    if (product.hasSpecs) {
      this.setData({ blindRevealVisible: false, specVisible: true, specProduct: product })
      return
    }
    const { addToCart } = require('../../../utils/cart.js')
    addToCart({
      product_id: product._id,
      name: product.name,
      image: product.coverUrl || product.coverEmoji,
      price: 0,
      blind_free: true,
      specs: [],
      qty: 1
    })
    this.refreshCartBar()
    this.setData({ blindRevealVisible: false })
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },

  async fetchKitchenData(seq) {
    this.setData({ loading: true, loadError: false })
    try {
      const categoryResp = await get('/api/categories')
      if (seq !== this._loadSeq) return

      const categories = this.parseCategories(categoryResp.data)
      const prevId = this.data.activeCategoryId
      const activeCategoryId = categories.some(c => c.id === prevId)
        ? prevId
        : (categories.length ? categories[0].id : '')

      this.setData({ categories, activeCategoryId })

      if (activeCategoryId) {
        await this.fetchProducts(activeCategoryId, seq)
      } else {
        this.finishLoad(seq, { products: [], loading: false, loadError: false })
      }

      if (seq !== this._loadSeq) return
      this.loadKitchenExtras(seq)
    } catch (err) {
      if (seq !== this._loadSeq) return
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      this.setData({ loading: false, loadError: true })
    }
  },

  finishLoad(seq, patch) {
    if (seq !== this._loadSeq) return
    this.setData(patch)
  },

  async loadKitchenExtras(seq) {
    try {
      const [festivalResp, weatherResp, timeEggResp, blindResp] = await Promise.all([
        getOptional('/api/festivals/active'),
        getOptional('/api/weather/kitchen'),
        getOptional('/api/time-eggs/kitchen'),
        getOptional('/api/blind-box/kitchen')
      ])
      if (seq !== this._loadSeq) return

      const fest = this.applyFestival(festivalResp.data)
      const weather = this.applyWeather(weatherResp.data)
      const timeEgg = this.applyTimeEgg(timeEggResp.data)
      const blind = this.applyBlindBox(blindResp.data)
      this.setData({ ...fest, ...weather, ...timeEgg, ...blind })
    } catch (e) {
      // 彩蛋接口失败不影响主列表
    }
  },

  async fetchProducts(categoryId, seq) {
    if (!categoryId) {
      this.finishLoad(seq, { products: [], loading: false })
      return
    }
    try {
      const resp = await get(`/api/products?category_id=${categoryId}`)
      if (seq !== this._loadSeq) return
      const list = Array.isArray(resp.data) ? resp.data : []
      this.finishLoad(seq, {
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
      festivalProducts: patchList(this.data.festivalProducts),
      weatherProducts: patchList(this.data.weatherProducts)
    })
  },

  onSwitchCategory(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.activeCategoryId) return
    const seq = (this._loadSeq || 0) + 1
    this._loadSeq = seq
    this.setData({ activeCategoryId: id, loading: true })
    this.fetchProducts(id, seq)
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
      || this.data.weatherProducts.find(p => p._id === id)
      || (this.data.blindRevealProduct && this.data.blindRevealProduct._id === id
        ? this.data.blindRevealProduct
        : null)
  },

  onSpecClose() {
    this.setData({ specVisible: false, specProduct: null })
    if (this.data.blindBox) this.startBlindBoxListener(this.data.blindBox)
  },

  onSpecAdded() {
    this.setData({ specVisible: false, specProduct: null })
    this.refreshCartBar()
  },

  onToggleDrawer() {
    const open = !this.data.drawerOpen
    this.setData({ drawerOpen: open })
    if (open) this.stopBlindBoxListener()
    else if (this.data.blindBox) this.startBlindBoxListener(this.data.blindBox)
  },

  onDrawerClose() {
    this.setData({ drawerOpen: false })
    if (this.data.blindBox) this.startBlindBoxListener(this.data.blindBox)
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
