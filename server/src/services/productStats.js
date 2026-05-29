const Review = require('../models/Review')
const Order = require('../models/Order')

async function getProductStatsMap(productIds) {
  const ids = productIds.filter(Boolean)
  const map = {}
  if (!ids.length) return map

  const [reviewAgg, salesAgg] = await Promise.all([
    Review.aggregate([
      { $match: { product_id: { $in: ids } } },
      {
        $group: {
          _id: '$product_id',
          rating_avg: { $avg: '$rating' },
          review_count: { $sum: 1 }
        }
      }
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['completed', 'to_review'] } } },
      { $unwind: '$items' },
      { $match: { 'items.product_id': { $in: ids } } },
      {
        $group: {
          _id: '$items.product_id',
          sales_count: { $sum: '$items.qty' }
        }
      }
    ])
  ])

  for (const row of reviewAgg) {
    map[String(row._id)] = {
      rating_avg: Math.round(row.rating_avg * 10) / 10,
      review_count: row.review_count,
      sales_count: 0
    }
  }
  for (const row of salesAgg) {
    const key = String(row._id)
    if (!map[key]) map[key] = { rating_avg: 0, review_count: 0, sales_count: 0 }
    map[key].sales_count = row.sales_count
  }
  return map
}

function attachStats(product, statsMap) {
  const key = String(product._id)
  const stats = statsMap[key] || { rating_avg: 0, review_count: 0, sales_count: 0 }
  return { ...product, ...stats }
}

async function enrichListWithStats(list) {
  const ids = list.map(p => p._id)
  const statsMap = await getProductStatsMap(ids)
  return list.map(p => attachStats(p, statsMap))
}

module.exports = { getProductStatsMap, enrichListWithStats, attachStats }
