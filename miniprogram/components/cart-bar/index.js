const { getCartStats, updateQty, clearCart } = require('../../utils/cart.js')
const { post } = require('../../utils/request.js')

Component({
  properties: {
    count: { type: Number, value: 0 },
    total: { type: Number, value: 0 },
    drawerOpen: { type: Boolean, value: false }
  },

  data: {
    items: [],
    deliveryOptions: ['本人配送', '外卖代下', '视频陪伴', '立即兑现'],
    deliveryIndex: 0,
    deliveryType: '本人配送',
    note: ''
  },

  observers: {
    drawerOpen(open) {
      if (open) this.loadItems()
    }
  },

  methods: {
    refresh() {
      const { items, count, totalPrice } = getCartStats()
      this.setData({ items, count, totalPrice })
      this.triggerEvent('updated', { count, total: totalPrice })
    },

    loadItems() {
      const { items, count, totalPrice } = getCartStats()
      this.setData({ items, count, totalPrice })
    },

    onToggleBar() {
      this.triggerEvent('toggle')
    },

    onMaskTap() {
      this.triggerEvent('close')
    },

    onDec(e) {
      const key = e.currentTarget.dataset.key
      const item = this.data.items.find(i => i.key === key)
      if (!item) return
      updateQty(key, item.qty - 1)
      this.loadItems()
      this.triggerEvent('updated')
    },

    onInc(e) {
      const key = e.currentTarget.dataset.key
      const item = this.data.items.find(i => i.key === key)
      if (!item) return
      updateQty(key, item.qty + 1)
      this.loadItems()
      this.triggerEvent('updated')
    },

    onChangeDelivery(e) {
      const idx = Number(e.detail.value || 0)
      const value = this.data.deliveryOptions[idx] || this.data.deliveryOptions[0]
      this.setData({ deliveryType: value, deliveryIndex: idx })
    },

    onInputNote(e) {
      this.setData({ note: e.detail.value || '' })
    },

    async onSubmit() {
      const items = this.data.items
      if (!items.length) {
        wx.showToast({ title: '购物车是空的', icon: 'none' })
        return
      }
      try {
        const resp = await post('/api/orders', {
          items: items.map(i => ({
            product_id: i.product_id,
            qty: i.qty,
            specs: i.specs,
            note: i.note || ''
          })),
          delivery_type: this.data.deliveryType,
          customer_note: this.data.note
        })
        clearCart()
        this.loadItems()
        wx.showModal({
          title: '下单成功',
          content: `合计 ¥${resp.data.total_price}`,
          showCancel: false,
          success: () => this.triggerEvent('ordersuccess')
        })
      } catch (err) {
        wx.showToast({ title: err.message || '下单失败', icon: 'none' })
      }
    },

    onSubmitTap() {
      if (this.properties.count <= 0) return
      if (!this.properties.drawerOpen) {
        this.triggerEvent('toggle')
        return
      }
      this.onSubmit()
    }
  }
})
