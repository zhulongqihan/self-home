const { get, patch, post } = require('../../../utils/request')
const { formatOrder, getNextStatuses, ACTION_TEXT } = require('../../../utils/orderStatus')

Page({
  data: {
    loading: true,
    loadError: false,
    orders: [],
    expandedId: '',
    ratings: {}
  },

  onShow() {
    this.fetchOrders()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  async fetchOrders() {
    this.setData({ loading: true, loadError: false })
    try {
      const resp = await get('/api/orders/my')
      const orders = (resp.data || []).map(o => {
        const formatted = formatOrder(o)
        const canCancel = getNextStatuses(o.status, 'customer').includes('cancelled')
        const canReview = o.status === 'to_review'
        const review_items = canReview
          ? (formatted.items || []).map((line, line_index) => ({
              product_id: line.product_id,
              product_name: line.product_name,
              line_index,
              rating_key: `${formatted._id}_${line_index}`
            }))
          : []
        return {
          ...formatted,
          can_cancel: canCancel,
          can_review: canReview,
          review_items,
          cancel_label: ACTION_TEXT.cancelled
        }
      })
      this.setData({ orders, loading: false, loadError: false, ratings: {} })
    } catch (err) {
      wx.showToast({ title: err.message || '订单加载失败', icon: 'none' })
      this.setData({ loading: false, loadError: true })
    }
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  },

  onPickStar(e) {
    const { key, star } = e.currentTarget.dataset
    const ratings = { ...this.data.ratings, [key]: Number(star) }
    this.setData({ ratings })
  },

  async onSubmitReview(e) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o._id === orderId)
    if (!order) return

    const items = (order.review_items || []).map(line => {
      const rating = this.data.ratings[line.rating_key]
      return { line_index: line.line_index, product_id: line.product_id, rating }
    })
    if (items.some(i => !i.rating)) {
      wx.showToast({ title: '请为每件商品打分', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中' })
    try {
      await post(`/api/orders/${orderId}/review`, { items })
      wx.showToast({ title: '评价成功', icon: 'success' })
      await this.fetchOrders()
    } catch (err) {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
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
