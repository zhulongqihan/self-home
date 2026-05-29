const { addToCart } = require('../../utils/cart.js')

Component({
  properties: {
    show: { type: Boolean, value: false },
    product: { type: Object, value: null }
  },

  data: {
    selectedSpecs: {},
    qty: 1
  },

  observers: {
    product(p) {
      if (!p) return
      const selectedSpecs = {}
      ;(p.specs || []).forEach(spec => {
        selectedSpecs[spec.name] = spec.options && spec.options.length ? spec.options[0] : ''
      })
      this.setData({ selectedSpecs, qty: 1 })
    }
  },

  methods: {
    noop() {},

    onMaskTap() {
      this.triggerEvent('close')
    },

    onChooseSpec(e) {
      const { name, option } = e.currentTarget.dataset
      const selectedSpecs = { ...this.data.selectedSpecs, [name]: option }
      this.setData({ selectedSpecs })
    },

    onDec() {
      if (this.data.qty <= 1) return
      this.setData({ qty: this.data.qty - 1 })
    },

    onInc() {
      this.setData({ qty: this.data.qty + 1 })
    },

    onConfirm() {
      const product = this.properties.product
      if (!product) return
      const specs = Object.keys(this.data.selectedSpecs)
        .map(k => `${k}:${this.data.selectedSpecs[k]}`)
        .filter(Boolean)
      addToCart({
        product_id: product._id,
        name: product.name,
        image: product.coverUrl || product.coverEmoji || '',
        price: product.price,
        specs,
        qty: this.data.qty
      })
      wx.showToast({ title: '已加入', icon: 'success' })
      this.triggerEvent('added')
    }
  }
})
