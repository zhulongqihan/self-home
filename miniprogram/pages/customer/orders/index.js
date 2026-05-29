const { get, patch } = require('../../../utils/request')
const { formatOrder, getNextStatuses, ACTION_TEXT } = require('../../../utils/orderStatus')

Page({
  data: {
    loading: true,
    orders: [],
    expandedId: ''
  },

  onShow() {
    this.fetchOrders()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  async fetchOrders() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/orders/my')
      const orders = (resp.data || []).map(o => {
        const formatted = formatOrder(o)
        const canCancel = getNextStatuses(o.status, 'customer').includes('cancelled')
        return {
          ...formatted,
          can_cancel: canCancel,
          cancel_label: ACTION_TEXT.cancelled
        }
      })
      this.setData({ orders, loading: false })
    } catch (err) {
      wx.showToast({ title: err.message || '订单加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  },

  async onCancel(e) {
    const id = e.currentTarget.dataset.id
    const confirm = await new Promise(resolve => {
      wx.showModal({
        title: '取消订单',
        content: '确定要取消这笔订单吗？',
        success: res => resolve(res.confirm)
      })
    })
    if (!confirm) return

    wx.showLoading({ title: '取消中' })
    try {
      await patch(`/api/orders/${id}/status`, { status: 'cancelled' })
      wx.showToast({ title: '已取消', icon: 'success' })
      this.setData({ expandedId: '' })
      await this.fetchOrders()
    } catch (err) {
      wx.showToast({ title: err.message || '取消失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})
