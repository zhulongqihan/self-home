const express = require('express')
const mongoose = require('mongoose')
const Category = require('../models/Category')
const Product = require('../models/Product')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { findActiveFestival } = require('../services/activeFestival')

const router = express.Router()

function pickCategory(doc) {
  if (!doc) return null
  return {
    id: String(doc._id),
    name: doc.name,
    icon: doc.icon || '',
    sort_order: doc.sort_order || 0,
    status: doc.status,
    festival_only: !!doc.festival_only,
    created_at: doc.created_at,
    updated_at: doc.updated_at
  }
}

/** GET /api/categories - 顾客：启用中的分类（无节日时隐藏 festival_only） */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const activeFestival = await findActiveFestival()
    const query = { status: 'enabled' }
    if (!activeFestival) {
      query.festival_only = { $ne: true }
    }
    const list = await Category.find(query)
      .sort({ sort_order: 1, created_at: 1 })
      .lean()
    res.json({ status: 'ok', data: list })
  } catch (err) {
    next(err)
  }
})

/** GET /api/categories/owner/all - 店长：全部分类 */
router.get('/owner/all', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const list = await Category.find()
      .sort({ sort_order: 1, created_at: 1 })
      .lean()
    res.json({ status: 'ok', data: list.map(pickCategory) })
  } catch (err) {
    next(err)
  }
})

/** POST /api/categories - 店长：新建分类 */
router.post('/', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { name, icon, sort_order, festival_only } = req.body || {}
    const n = String(name || '').trim()
    if (!n) {
      return res.status(400).json({ status: 'error', code: 'MISSING_NAME', message: '请填写分类名称' })
    }
    const doc = await Category.create({
      name: n,
      icon: String(icon || '').trim(),
      sort_order: parseInt(sort_order, 10) || 0,
      festival_only: !!festival_only,
      status: 'enabled'
    })
    res.json({ status: 'ok', data: pickCategory(doc) })
  } catch (err) {
    next(err)
  }
})

/** PUT /api/categories/:id - 店长：更新分类 */
router.put('/:id', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ID', message: '分类 ID 无效' })
    }
    const doc = await Category.findById(id)
    if (!doc) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: '分类不存在' })
    }
    const { name, icon, sort_order, festival_only, status } = req.body || {}
    if (name !== undefined) {
      const n = String(name).trim()
      if (!n) {
        return res.status(400).json({ status: 'error', code: 'MISSING_NAME', message: '分类名称不能为空' })
      }
      doc.name = n
    }
    if (icon !== undefined) doc.icon = String(icon).trim()
    if (sort_order !== undefined) doc.sort_order = parseInt(sort_order, 10) || 0
    if (festival_only !== undefined) doc.festival_only = !!festival_only
    if (status === 'enabled' || status === 'disabled') doc.status = status
    await doc.save()
    res.json({ status: 'ok', data: pickCategory(doc) })
  } catch (err) {
    next(err)
  }
})

/** PATCH /api/categories/:id/status - 店长：上下架分类 */
router.patch('/:id/status', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const id = req.params.id
    const { status } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ID', message: '分类 ID 无效' })
    }
    if (status !== 'enabled' && status !== 'disabled') {
      return res.status(400).json({ status: 'error', code: 'INVALID_STATUS', message: '状态须为 enabled 或 disabled' })
    }
    const doc = await Category.findByIdAndUpdate(id, { status }, { new: true })
    if (!doc) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: '分类不存在' })
    }
    res.json({ status: 'ok', data: pickCategory(doc) })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/categories/:id - 店长：删除分类（无商品时） */
router.delete('/:id', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ID', message: '分类 ID 无效' })
    }
    const count = await Product.countDocuments({ category_id: id })
    if (count > 0) {
      return res.status(400).json({
        status: 'error',
        code: 'HAS_PRODUCTS',
        message: `该分类下还有 ${count} 个商品，请先移走或删除`
      })
    }
    const doc = await Category.findByIdAndDelete(id)
    if (!doc) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: '分类不存在' })
    }
    res.json({ status: 'ok', data: { id } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
