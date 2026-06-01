const express = require('express')
const mongoose = require('mongoose')
const Festival = require('../models/Festival')
const Product = require('../models/Product')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { findActiveFestival } = require('../services/activeFestival')
const { enrichProducts } = require('../utils/productImage')
const { enrichListWithStats } = require('../services/productStats')

const router = express.Router()

function pickFestival(doc) {
  if (!doc) return null
  return {
    id: String(doc._id),
    name: doc.name,
    date_type: doc.date_type || 'fixed',
    date: doc.date || '',
    banner: doc.banner || '',
    theme_color: doc.theme_color || '#E8B86D',
    product_ids: (doc.product_ids || []).map(String),
    push_template: doc.push_template || '',
    status: doc.status,
    created_at: doc.created_at,
    updated_at: doc.updated_at
  }
}

function parseProductIds(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(String)
    .filter(id => mongoose.Types.ObjectId.isValid(id))
}

/** GET /api/festivals/active - 顾客：今日生效节日 + 专属商品 */
router.get('/active', requireAuth, async (req, res, next) => {
  try {
    const festival = await findActiveFestival()
    if (!festival) {
      return res.json({ status: 'ok', data: null })
    }
    const ids = (festival.product_ids || []).filter(id => mongoose.Types.ObjectId.isValid(String(id)))
    let products = []
    if (ids.length) {
      const list = await Product.find({ _id: { $in: ids }, status: 'on_sale' })
        .sort({ sort_weight: -1, created_at: -1 })
        .lean()
      products = await enrichListWithStats(enrichProducts(list))
    }
    res.json({
      status: 'ok',
      data: {
        ...pickFestival(festival),
        products
      }
    })
  } catch (err) {
    next(err)
  }
})

/** GET /api/festivals/owner/all - 店长：全部节日 */
router.get('/owner/all', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const list = await Festival.find().sort({ date: 1, created_at: -1 }).lean()
    res.json({ status: 'ok', data: list.map(pickFestival) })
  } catch (err) {
    next(err)
  }
})

/** POST /api/festivals - 店长：新建节日 */
router.post('/', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const body = req.body || {}
    const name = String(body.name || '').trim()
    if (!name) {
      return res.status(400).json({ status: 'error', code: 'MISSING_NAME', message: '请填写节日名称' })
    }
    const dateType = body.date_type === 'lunar' ? 'lunar' : 'fixed'
    const date = String(body.date || '').trim()
    if (date && !/^\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_DATE', message: '日期请用 MM-DD' })
    }
    const productIds = parseProductIds(body.product_ids)
    const doc = await Festival.create({
      name,
      date_type: dateType,
      date,
      banner: String(body.banner || '').trim(),
      theme_color: String(body.theme_color || '#E8B86D').trim(),
      product_ids: productIds,
      push_template: String(body.push_template || '').trim(),
      status: 'enabled'
    })
    res.json({ status: 'ok', data: pickFestival(doc) })
  } catch (err) {
    next(err)
  }
})

/** PUT /api/festivals/:id - 店长：更新节日 */
router.put('/:id', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ID', message: '节日 ID 无效' })
    }
    const doc = await Festival.findById(id)
    if (!doc) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: '节日不存在' })
    }
    const body = req.body || {}
    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) {
        return res.status(400).json({ status: 'error', code: 'MISSING_NAME', message: '节日名称不能为空' })
      }
      doc.name = name
    }
    if (body.date_type === 'fixed' || body.date_type === 'lunar') doc.date_type = body.date_type
    if (body.date !== undefined) {
      const date = String(body.date).trim()
      if (date && !/^\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_DATE', message: '日期请用 MM-DD' })
      }
      doc.date = date
    }
    if (body.banner !== undefined) doc.banner = String(body.banner).trim()
    if (body.theme_color !== undefined) doc.theme_color = String(body.theme_color).trim()
    if (body.push_template !== undefined) doc.push_template = String(body.push_template).trim()
    if (body.product_ids !== undefined) doc.product_ids = parseProductIds(body.product_ids)
    if (body.status === 'enabled' || body.status === 'disabled') doc.status = body.status
    await doc.save()
    res.json({ status: 'ok', data: pickFestival(doc) })
  } catch (err) {
    next(err)
  }
})

/** PATCH /api/festivals/:id/status */
router.patch('/:id/status', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const id = req.params.id
    const { status } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ID', message: '节日 ID 无效' })
    }
    if (status !== 'enabled' && status !== 'disabled') {
      return res.status(400).json({ status: 'error', code: 'INVALID_STATUS', message: '状态须为 enabled 或 disabled' })
    }
    const doc = await Festival.findByIdAndUpdate(id, { status }, { new: true })
    if (!doc) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: '节日不存在' })
    }
    res.json({ status: 'ok', data: pickFestival(doc) })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/festivals/:id */
router.delete('/:id', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ID', message: '节日 ID 无效' })
    }
    const doc = await Festival.findByIdAndDelete(id)
    if (!doc) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: '节日不存在' })
    }
    res.json({ status: 'ok', data: { id } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
