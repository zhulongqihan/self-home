const { get, post, del } = require('../../../utils/request.js')

function formatTime(iso) {
  if (!iso) return ''
  const dt = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${dt.getMonth() + 1}/${dt.getDate()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

Page({
  data: {
    content: '',
    imageUrl: '',
    publishing: false,
    loading: true,
    items: []
  },

  onShow() {
    this.fetchList()
  },

  async fetchList() {
    this.setData({ loading: true })
    try {
      const resp = await get('/api/messages/owner?limit=30')
      const items = ((resp.data && resp.data.items) || []).map(it => ({
        ...it,
        timeText: formatTime(it.created_at)
      }))
      this.setData({ loading: false, items })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onInputContent(e) {
    this.setData({ content: e.detail.value })
  },

  onInputImage(e) {
    this.setData({ imageUrl: e.detail.value })
  },

  async onPublish() {
    if (this.data.publishing) return
    const content = this.data.content.trim()
    if (!content) {
      wx.showToast({ title: '请先写留言', icon: 'none' })
      return
    }
    this.setData({ publishing: true })
    try {
      await post('/api/messages', {
        content,
        image: this.data.imageUrl.trim()
      })
      wx.showToast({ title: '已发布', icon: 'success' })
      this.setData({ content: '', imageUrl: '' })
      this.fetchList()
    } catch (err) {
      wx.showToast({ title: err.message || '发布失败', icon: 'none' })
    } finally {
      this.setData({ publishing: false })
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.showModal({
      title: '删除留言',
      content: '确定删除这条留言吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await del(`/api/messages/${id}`)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.fetchList()
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        }
      }
    })
  }
})
