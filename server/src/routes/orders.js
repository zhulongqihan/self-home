const express = require('express')
const mongoose = require('mongoose')
const { requireAuth } = require('../middlewares/auth')
const Product = require('../models/Product')
const Order = require('../models/Order')

const router = express.Router()

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, delivery_type, customer_note } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', code: 'EMPTY_ITEMS', message: '请选择要下单的商品' })
    }

    const normalized = []
    let total = 0

    for (const raw of items) {
      if (!raw.product_id || !mongoose.Types.ObjectId.isValid(raw.product_id)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_PRODUCT_ID', message: '存在无效商品' })
      }
      const qty = Number(raw.qty || 1)
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ status: 'error', code: 'INVALID_QTY', message: '商品数量必须为正整数' })
      }

      const product = await Product.findById(raw.product_id).lean()
      if (!product || product.status !== 'on_sale') {
        return res.status(400).json({ status: 'error', code: 'PRODUCT_UNAVAILABLE', message: '商品不存在或已下架' })
      }

      const lineTotal = product.price * qty
      total += lineTotal
      normalized.push({
        product_id: product._id,
        product_name: product.name,
        product_image: (product.images && product.images[0]) || '',
        price: product.price,
        qty,
        specs: Array.isArray(raw.specs) ? raw.specs.map(s => String(s)) : [],
        note: raw.note ? String(raw.note) : ''
      })
    }

    const now = new Date()
    const order = await Order.create({
      user_id: req.user.sub,
      items: normalized,
      total_price: total,
      delivery_type: delivery_type || '本人配送',
      customer_note: customer_note || '',
      status_history: [{ status: 'pending', changed_at: now, note: '顾客提交订单' }]
    })

    res.json({ status: 'ok', data: { order_id: order._id, total_price: order.total_price, status: order.status } })
  } catch (err) {
    next(err)
  }
})

router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const list = await Order.find({ user_id: req.user.sub })
      .sort({ created_at: -1 })
      .limit(50)
      .lean()
    res.json({ status: 'ok', data: list })
  } catch (err) {
    next(err)
  }
})

module.exports = router
