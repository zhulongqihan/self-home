const Order = require('../models/Order')
const Review = require('../models/Review')
const KissEvent = require('../models/KissEvent')
const EmotionAlert = require('../models/EmotionAlert')
const Config = require('../models/Config')
const { getEmotionProductIdSet } = require('./emotionAlert')

function getShanghaiDateKey(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d)
}

function lastNDaysKeys(n) {
  const keys = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(getShanghaiDateKey(d))
  }
  return keys
}

async function getOwnerDashboard() {
  const cfg = await Config.findById('global').lean()
  const currencyName = (cfg && cfg.currency_name) || '爱心币'
  const currencyEmoji = (cfg && cfg.currency_emoji) || '💋'
  const customerNickname = (cfg && cfg.customer_nickname) || '宝宝'

  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  since30.setHours(0, 0, 0, 0)

  const since7 = new Date()
  since7.setDate(since7.getDate() - 7)
  since7.setHours(0, 0, 0, 0)

  const validStatuses = ['pending', 'accepted', 'preparing', 'delivering', 'delivered', 'to_review', 'completed']

  const orders = await Order.find({
    status: { $in: validStatuses },
    created_at: { $gte: since30 }
  }).lean()

  let orderCount = 0
  let totalSpent = 0
  const dayOrderMap = {}
  const dayAmountMap = {}
  const productMap = {}

  for (const o of orders) {
    orderCount += 1
    totalSpent += o.total_price || 0
    const day = getShanghaiDateKey(new Date(o.created_at))
    dayOrderMap[day] = (dayOrderMap[day] || 0) + 1
    dayAmountMap[day] = (dayAmountMap[day] || 0) + (o.total_price || 0)
    for (const line of o.items || []) {
      const pid = String(line.product_id)
      if (!productMap[pid]) {
        productMap[pid] = {
          product_id: pid,
          product_name: line.product_name || '商品',
          qty: 0,
          amount: 0
        }
      }
      productMap[pid].qty += line.qty || 0
      productMap[pid].amount += (line.price || 0) * (line.qty || 0)
    }
  }

  const top_products = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty || b.amount - a.amount)
    .slice(0, 10)

  const dayKeys = lastNDaysKeys(30)
  const monthly_trend = dayKeys.map(date => ({
    date,
    orders: dayOrderMap[date] || 0,
    amount: dayAmountMap[date] || 0
  }))

  const maxTrendOrders = Math.max(1, ...monthly_trend.map(d => d.orders))
  const maxTrendAmount = Math.max(1, ...monthly_trend.map(d => d.amount))
  monthly_trend.forEach(d => {
    d.orders_pct = Math.round((d.orders / maxTrendOrders) * 100)
    d.amount_pct = Math.round((d.amount / maxTrendAmount) * 100)
  })

  const reviews = await Review.find({ created_at: { $gte: since30 } }).lean()
  const dayRatingMap = {}
  let ratingSum = 0
  for (const r of reviews) {
    ratingSum += r.rating
    const day = getShanghaiDateKey(new Date(r.created_at))
    if (!dayRatingMap[day]) dayRatingMap[day] = { sum: 0, count: 0 }
    dayRatingMap[day].sum += r.rating
    dayRatingMap[day].count += 1
  }

  const mood_curve = dayKeys.map(date => {
    const row = dayRatingMap[date]
    const avg = row && row.count ? Math.round((row.sum / row.count) * 10) / 10 : 0
    const count = row ? row.count : 0
    return { date, avg_rating: avg, count }
  })
  const maxMoodCount = Math.max(1, ...mood_curve.map(d => d.count))
  mood_curve.forEach(d => {
    d.count_pct = Math.round((d.count / maxMoodCount) * 100)
    d.height_pct = d.avg_rating ? Math.round((d.avg_rating / 5) * 100) : 0
  })

  const kiss_count_7d = await KissEvent.countDocuments({ created_at: { $gte: since7 } })
  const emotion_alerts_30d = await EmotionAlert.countDocuments({ created_at: { $gte: since30 } })

  const emotionIds = await getEmotionProductIdSet()
  let emotion_orders_30d = 0
  for (const o of orders) {
    const hasEmotion = (o.items || []).some(line => emotionIds.has(String(line.product_id)))
    if (hasEmotion) emotion_orders_30d += 1
  }

  const pendingEmotion = await EmotionAlert.findOne({ dismissed: false })
    .sort({ created_at: -1 })
    .lean()

  return {
    customer_nickname: customerNickname,
    currency_name: currencyName,
    currency_emoji: currencyEmoji,
    summary: {
      order_count_30d: orderCount,
      total_spent_30d: totalSpent,
      avg_rating: reviews.length ? Math.round((ratingSum / reviews.length) * 10) / 10 : 0,
      review_count_30d: reviews.length,
      kiss_count_7d,
      emotion_orders_30d,
      emotion_alerts_30d
    },
    top_products,
    monthly_trend,
    mood_curve,
    emotion_alert_pending: pendingEmotion
      ? {
          order_id: String(pendingEmotion.order_id),
          message: `${customerNickname} 有未处理的情绪类订单提醒`,
          created_at: pendingEmotion.created_at
        }
      : null
  }
}

module.exports = { getOwnerDashboard }
