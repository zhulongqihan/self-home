const { get } = require('../../../utils/request.js')

function fmtShortDate(dateKey) {
  if (!dateKey) return ''
  const parts = dateKey.split('-')
  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : dateKey
}

Page({
  data: {
    loading: true,
    loadError: false,
    currencyEmoji: '💋',
    currencyName: '爱心币',
    summary: {},
    topProducts: [],
    monthlyTrend: [],
    moodCurve: [],
    emotionPending: null
  },

  onShow() {
    this.fetchDashboard()
  },

  async fetchDashboard() {
    this.setData({ loading: true, loadError: false })
    try {
      const resp = await get('/api/analytics/owner/dashboard')
      const d = resp.data || {}
      const summary = d.summary || {}
      const topProducts = (d.top_products || []).map((p, i) => ({
        ...p,
        rank: i + 1,
        amountText: Number(p.amount || 0).toFixed(0)
      }))
      const monthlyTrend = (d.monthly_trend || []).map(row => ({
        ...row,
        label: fmtShortDate(row.date)
      }))
      const moodCurve = (d.mood_curve || []).map(row => ({
        ...row,
        label: fmtShortDate(row.date),
        showRating: row.avg_rating > 0
      }))

      this.setData({
        loading: false,
        currencyEmoji: d.currency_emoji || '💋',
        currencyName: d.currency_name || '爱心币',
        summary,
        topProducts,
        monthlyTrend,
        moodCurve,
        emotionPending: d.emotion_alert_pending || null
      })
    } catch (err) {
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onGoOrders() {
    wx.navigateTo({ url: '/pages/owner/orders/index' })
  }
})
