const { get } = require('../../../utils/request')
const { addToCart } = require('../../../utils/cart')

Page({
  data: {
    loading: true,
    productId: '',
    product: null,
    selectedSpecs: {},
    qty: 1
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '商品参数缺失', icon: 'none' })
      return
    }
    this.setData({ productId: options.id })
    this.fetchDetail(options.id)
  },

  async fetchDetail(id) {
    this.setData({ loading: true })
    try {
      const resp = await get(`/api/products/${id}`)
      const product = resp.data
      const selectedSpecs = {}
      ;(product.specs || []).forEach(spec => {
        selectedSpecs[spec.name] = spec.options && spec.options.length ? spec.options[0] : ''
      })
      this.setData({ product, selectedSpecs, loading: false })
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onChooseSpec(e) {
    const { name, option } = e.currentTarget.dataset
    const selectedSpecs = { ...this.data.selectedSpecs, [name]: option }
    this.setData({ selectedSpecs })
  },

  onDecQty() {
    if (this.data.qty <= 1) return
    this.setData({ qty: this.data.qty - 1 })
  },

  onIncQty() {
    this.setData({ qty: this.data.qty + 1 })
  },

  onAddToCart() {
    const { product, selectedSpecs, qty } = this.data
    if (!product) return
    const specs = Object.keys(selectedSpecs).map(k => `${k}:${selectedSpecs[k]}`).filter(Boolean)
    addToCart({
      product_id: product._id,
      name: product.name,
      image: (product.images && product.images[0]) || '',
      price: product.price,
      specs,
      qty
    })
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },

  onBuyNow() {
    this.onAddToCart()
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/customer/cart/index' })
    }, 150)
  }
})
