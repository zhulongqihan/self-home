const { get } = require('../../../utils/request')

const STATUS_TEXT = {
  pending: '待接单',
  accepted: '已接单',
  preparing: '制作中',
  delivering: '配送中',
  delivered: '已送达',
  to_review: '待评价',
  completed: '已完成',
  cancelled: '已取消'
}

Page({
  data: {
    loading: true,
    orders: []
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
      const orders = (resp.data || []).map(item => ({
        ...item,
        short_id: String(item._id || '').slice(-6),
        status_text: STATUS_TEXT[item.status] || item.status
      }))
      this.setData({ orders, loading: false })
    } catch (err) {
      wx.showToast({ title: err.message || '订单加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  }
})
