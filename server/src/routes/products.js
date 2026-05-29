const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Category = require('../models/Category')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { enrichProducts, resolveProductDisplay, PLACEHOLDER_STYLES } = require('../utils/productImage')
const { enrichListWithStats, attachStats, getProductStatsMap } = require('../services/productStats')

const router = express.Router()

function parseSpecs(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(s => s && s.name)
    .map(s => ({
      name: String(s.name).trim(),
      options: Array.isArray(s.options)
        ? s.options.map(o => String(o).trim()).filter(Boolean)
        : String(s.options || '')
            .split(/[,，]/)
            .map(o => o.trim())
            .filter(Boolean)
    }))
    .filter(s => s.name)
}

function pickProductBody(body, partial = false) {
  const out = {}
  const fields = ['name', 'category_id', 'description', 'price', 'stock', 'sort_weight', 'image_style', 'tags']
  for (const key of fields) {
    if (partial && body[key] === undefined) continue
    if (body[key] !== undefined) out[key] = body[key]
  }
  if (body.images !== undefined) {
    out.images = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : []
  }
  if (body.specs !== undefined) out.specs = parseSpecs(body.specs)
  if (body.status !== undefined) out.status = body.status
  return out
}

/** 店长：全部商品（含下架） */
router.get('/owner/all', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { category_id, status } = req.query
    const query = {}
    if (category_id) {
      if (!mongoose.Types.ObjectId.isValid(category_id)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_CATEGORY_ID', message: '分类参数无效' })
      }
      query.category_id = category_id
    }
    if (status === 'on_sale' || status === 'off_sale') query.status = status

    const list = await Product.find(query)
      .sort({ sort_weight: -1, created_at: -1 })
      .lean()
    const withStats = await enrichListWithStats(enrichProducts(list))
    res.json({ status: 'ok', data: withStats })
  } catch (err) {
    next(err)
  }
})

/** 顾客：在售商品 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { category_id } = req.query
    const query = { status: 'on_sale' }
    if (category_id) {
      if (!mongoose.Types.ObjectId.isValid(category_id)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_CATEGORY_ID', message: '分类参数无效' })
      }
      query.category_id = category_id
    }

    const list = await Product.find(query)
      .sort({ sort_weight: -1, created_at: -1 })
      .lean()

    const withStats = await enrichListWithStats(enrichProducts(list))
    res.json({ status: 'ok', data: withStats })
  } catch (err) {
    next(err)
  }
})

/** 店长：新建商品 */
router.post('/', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const body = pickProductBody(req.body || {})
    if (!body.name || body.price === undefined) {
      return res.status(400).json({ status: 'error', code: 'MISSING_FIELDS', message: '请填写商品名称与价格' })
    }
    if (!body.category_id || !mongoose.Types.ObjectId.isValid(body.category_id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_CATEGORY', message: '请选择有效分类' })
    }
    const cat = await Category.findById(body.category_id)
    if (!cat) {
      return res.status(400).json({ status: 'error', code: 'CATEGORY_NOT_FOUND', message: '分类不存在' })
    }
    if (body.image_style && !PLACEHOLDER_STYLES.includes(body.image_style)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_IMAGE_STYLE', message: '图片风格无效' })
    }

    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ status: 'error', code: 'INVALID_PRICE', message: '价格无效' })
    }

    const product = await Product.create({
      name: String(body.name).trim(),
      category_id: body.category_id,
      price,
      description: body.description || '',
      images: body.images || [],
      image_style: body.image_style || 'line_puppy',
      specs: body.specs || [],
      tags: body.tags || [],
      stock: body.stock !== undefined ? Number(body.stock) : 9999,
      sort_weight: body.sort_weight !== undefined ? Number(body.sort_weight) : 0,
      status: body.status === 'off_sale' ? 'off_sale' : 'on_sale'
    })

    res.status(201).json({ status: 'ok', data: resolveProductDisplay(product.toObject()) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_PRODUCT_ID', message: '商品 ID 无效' })
    }

    const product = await Product.findById(id).lean()
    if (!product) {
      return res.status(404).json({ status: 'error', code: 'PRODUCT_NOT_FOUND', message: '商品不存在' })
    }
    if (req.user.role !== 'owner' && product.status !== 'on_sale') {
      return res.status(404).json({ status: 'error', code: 'PRODUCT_NOT_FOUND', message: '商品不存在或已下架' })
    }

    const statsMap = await getProductStatsMap([product._id])
    const withStats = attachStats(resolveProductDisplay(product), statsMap)
    res.json({ status: 'ok', data: withStats })
  } catch (err) {
    next(err)
  }
})

/** 店长：更新商品 */
router.put('/:id', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_PRODUCT_ID', message: '商品 ID 无效' })
    }

    const body = pickProductBody(req.body || {}, true)
    if (body.category_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(body.category_id)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_CATEGORY', message: '分类无效' })
      }
      const cat = await Category.findById(body.category_id)
      if (!cat) {
        return res.status(400).json({ status: 'error', code: 'CATEGORY_NOT_FOUND', message: '分类不存在' })
      }
    }
    if (body.image_style && !PLACEHOLDER_STYLES.includes(body.image_style)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_IMAGE_STYLE', message: '图片风格无效' })
    }
    if (body.price !== undefined && (Number.isNaN(Number(body.price)) || Number(body.price) < 0)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_PRICE', message: '价格无效' })
    }

    const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!product) {
      return res.status(404).json({ status: 'error', code: 'PRODUCT_NOT_FOUND', message: '商品不存在' })
    }
    res.json({ status: 'ok', data: resolveProductDisplay(product) })
  } catch (err) {
    next(err)
  }
})

/** 店长：上下架 */
router.patch('/:id/status', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}
    if (!['on_sale', 'off_sale'].includes(status)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_STATUS', message: '状态须为 on_sale 或 off_sale' })
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_PRODUCT_ID', message: '商品 ID 无效' })
    }

    const product = await Product.findByIdAndUpdate(id, { status }, { new: true }).lean()
    if (!product) {
      return res.status(404).json({ status: 'error', code: 'PRODUCT_NOT_FOUND', message: '商品不存在' })
    }
    res.json({ status: 'ok', data: { _id: product._id, status: product.status } })
  } catch (err) {
    next(err)
  }
})

/** 店长：删除商品 */
router.delete('/:id', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_PRODUCT_ID', message: '商品 ID 无效' })
    }
    const product = await Product.findByIdAndDelete(id)
    if (!product) {
      return res.status(404).json({ status: 'error', code: 'PRODUCT_NOT_FOUND', message: '商品不存在' })
    }
    res.json({ status: 'ok', data: { deleted_id: id } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
