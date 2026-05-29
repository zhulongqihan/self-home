const { getCartStats, updateQty, clearCart } = require('../../utils/cart.js')
const { post } = require('../../utils/request.js')
const { requestSubscribeByRole } = require('../../utils/subscribe.js')

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
    note: '',
    submitting: false
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
      if (this.data.submitting) return
      const items = this.data.items
      if (!items.length) {
        wx.showToast({ title: '购物车是空的', icon: 'none' })
        return
      }

      this.setData({ submitting: true })
      wx.showLoading({ title: '提交中', mask: true })
      try {
        await requestSubscribeByRole()
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
        this.setData({
          items: [],
          note: '',
          deliveryIndex: 0,
          deliveryType: this.data.deliveryOptions[0]
        })
        // 先关抽屉、同步父页面角标，再弹成功框（避免遮罩叠层导致“卡住”）
        this.triggerEvent('close')
        this.triggerEvent('updated', { count: 0, total: 0 })

        const total = resp.data && resp.data.total_price
        const left = resp.data && resp.data.coins_left
        if (left != null) {
          const user = wx.getStorageSync('auth_user')
          if (user) {
            user.coins = left
            wx.setStorageSync('auth_user', user)
          }
        }
        wx.showModal({
          title: '下单成功',
          content: `消耗 ${total != null ? total : ''} 币${left != null ? `，余额 ${left}` : ''}`,
          showCancel: false,
          success: () => this.triggerEvent('ordersuccess', { total_price: total })
        })
      } catch (err) {
        wx.showToast({ title: err.message || '下单失败', icon: 'none' })
      } finally {
        wx.hideLoading()
        this.setData({ submitting: false })
      }
    },

    onSubmitTap() {
      if (this.data.submitting) return
      if (this.properties.count <= 0) return
      if (!this.properties.drawerOpen) {
        this.triggerEvent('toggle')
        return
      }
      this.onSubmit()
    }
  }
})
