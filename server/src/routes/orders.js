const express = require('express')
const mongoose = require('mongoose')
const { requireAuth, requireRole } = require('../middlewares/auth')
const Product = require('../models/Product')
const Order = require('../models/Order')
const { canTransition, getNextStatuses, STATUS_TEXT } = require('../services/orderStatus')

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

      total += product.price * qty
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

/** 店长：全部订单 */
router.get('/owner/all', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const list = await Order.find({})
      .sort({ created_at: -1 })
      .limit(100)
      .lean()
    res.json({ status: 'ok', data: list })
  } catch (err) {
    next(err)
  }
})

/** 订单详情（顾客本人或店长） */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ORDER_ID', message: '订单 ID 无效' })
    }
    const order = await Order.findById(id).lean()
    if (!order) {
      return res.status(404).json({ status: 'error', code: 'ORDER_NOT_FOUND', message: '订单不存在' })
    }
    const isOwner = req.user.role === 'owner'
    const isMine = String(order.user_id) === String(req.user.sub)
    if (!isOwner && !isMine) {
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '无权查看此订单' })
    }
    const next_statuses = getNextStatuses(order.status, req.user.role)
    res.json({ status: 'ok', data: { ...order, next_statuses } })
  } catch (err) {
    next(err)
  }
})

/** 流转状态 */
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status: nextStatus, note } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ORDER_ID', message: '订单 ID 无效' })
    }
    if (!nextStatus) {
      return res.status(400).json({ status: 'error', code: 'MISSING_STATUS', message: '缺少目标状态' })
    }

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ status: 'error', code: 'ORDER_NOT_FOUND', message: '订单不存在' })
    }

    const role = req.user.role
    const isOwner = role === 'owner'
    const isMine = String(order.user_id) === String(req.user.sub)
    if (!isOwner && !isMine) {
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '无权操作此订单' })
    }

    if (!canTransition(order.status, nextStatus, role)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_TRANSITION',
        message: `不能从「${STATUS_TEXT[order.status]}」变更为「${STATUS_TEXT[nextStatus] || nextStatus}」`
      })
    }

    const now = new Date()
    const actor = isOwner ? '店长' : '顾客'
    order.status = nextStatus
    order.status_history.push({
      status: nextStatus,
      changed_at: now,
      note: note || `${actor}操作：${STATUS_TEXT[nextStatus]}`
    })
    await order.save()

    res.json({
      status: 'ok',
      data: {
        order_id: order._id,
        status: order.status,
        next_statuses: getNextStatuses(order.status, role)
      }
    })
  } catch (err) {
    next(err)
  }
})

/** 店长备注 */
router.patch('/:id/reply', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { owner_reply } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ORDER_ID', message: '订单 ID 无效' })
    }
    const order = await Order.findByIdAndUpdate(
      id,
      { owner_reply: owner_reply || '' },
      { new: true }
    ).lean()
    if (!order) {
      return res.status(404).json({ status: 'error', code: 'ORDER_NOT_FOUND', message: '订单不存在' })
    }
    res.json({ status: 'ok', data: { owner_reply: order.owner_reply } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
