const { post } = require('../../../utils/request')
const { getCart, updateQty, clearCart } = require('../../../utils/cart')
const { requestSubscribeByRole } = require('../../../utils/subscribe.js')

Page({
  data: {
    items: [],
    deliveryType: '本人配送',
    deliveryOptions: ['本人配送', '外卖代下', '视频陪伴', '立即兑现'],
    deliveryIndex: 0,
    note: '',
    totalPrice: 0
  },

  onShow() {
    this.loadCart()
  },

  loadCart() {
    const items = getCart()
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    this.setData({ items, totalPrice })
  },

  onDec(e) {
    const key = e.currentTarget.dataset.key
    const item = this.data.items.find(i => i.key === key)
    if (!item) return
    updateQty(key, item.qty - 1)
    this.loadCart()
  },

  onInc(e) {
    const key = e.currentTarget.dataset.key
    const item = this.data.items.find(i => i.key === key)
    if (!item) return
    updateQty(key, item.qty + 1)
    this.loadCart()
  },

  onChangeDelivery(e) {
    const idx = Number(e.detail.value || 0)
    const value = this.data.deliveryOptions[idx] || this.data.deliveryOptions[0]
    this.setData({ deliveryType: value, deliveryIndex: idx })
  },

  onInputNote(e) {
    this.setData({ note: e.detail.value || '' })
  },

  async onSubmitOrder() {
    if (this._submitting) return
    const { items, deliveryType, note } = this.data
    if (!items.length) {
      wx.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }

    this._submitting = true
    wx.showLoading({ title: '提交中', mask: true })
    try {
      await requestSubscribeByRole()
      const payload = {
        items: items.map(i => ({
          product_id: i.product_id,
          qty: i.qty,
          specs: i.specs,
          note: i.note || ''
        })),
        delivery_type: deliveryType,
        customer_note: note
      }
      const resp = await post('/api/orders', payload)
      clearCart()
      this.setData({ items: [], totalPrice: 0, note: '' })
      if (resp.data && resp.data.coins_left != null) {
        const user = wx.getStorageSync('auth_user')
        if (user) {
          user.coins = resp.data.coins_left
          wx.setStorageSync('auth_user', user)
        }
      }
      wx.showModal({
        title: '下单成功',
        content: `订单号：${resp.data.order_id}\n消耗：${resp.data.total_price} 币`,
        showCancel: false,
        success: () => wx.switchTab({ url: '/pages/customer/orders/index' })
      })
    } catch (err) {
      wx.showToast({ title: err.message || '下单失败', icon: 'none' })
    } finally {
      wx.hideLoading()
      this._submitting = false
    }
  }
})
