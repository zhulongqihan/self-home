const { get, patch } = require('../../../utils/request')
const { formatOrder, getNextStatuses, ACTION_TEXT } = require('../../../utils/orderStatus')
const { requestSubscribeByRole } = require('../../../utils/subscribe')

Page({
  data: {
    loading: true,
    orders: [],
    expandedId: '',
    replyDraft: {}
  },

  onShow() {
    this.fetchOrders()
    requestSubscribeByRole()
  },

  async fetchOrders() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/orders/owner/all')
      const orders = (resp.data || []).map(o => {
        const formatted = formatOrder(o)
        return {
          ...formatted,
          next_actions: getNextStatuses(o.status, 'owner').map(s => ({
            status: s,
            label: ACTION_TEXT[s] || s
          }))
        }
      })
      this.setData({ orders, loading: false })
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id
    const next = this.data.expandedId === id ? '' : id
    const order = this.data.orders.find(o => o._id === id)
    const replyDraft = { ...this.data.replyDraft }
    if (order) replyDraft[id] = order.owner_reply || ''
    this.setData({ expandedId: next, replyDraft })
  },

  onReplyInput(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ [`replyDraft.${id}`]: e.detail.value })
  },

  async onAction(e) {
    const { id, status } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中' })
    try {
      await patch(`/api/orders/${id}/status`, { status })
      wx.showToast({ title: '已更新', icon: 'success' })
      this.setData({ expandedId: '' })
      await this.fetchOrders()
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async onSaveReply(e) {
    const id = e.currentTarget.dataset.id
    const owner_reply = this.data.replyDraft[id] || ''
    wx.showLoading({ title: '保存中' })
    try {
      await patch(`/api/orders/${id}/reply`, { owner_reply })
      wx.showToast({ title: '备注已保存', icon: 'success' })
      await this.fetchOrders()
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})
