const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const { requireAuth } = require('../middlewares/auth')
const { enrichProducts, resolveProductDisplay } = require('../utils/productImage')

const router = express.Router()

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

    res.json({ status: 'ok', data: enrichProducts(list) })
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
    if (!product || product.status !== 'on_sale') {
      return res.status(404).json({ status: 'error', code: 'PRODUCT_NOT_FOUND', message: '商品不存在或已下架' })
    }

    res.json({ status: 'ok', data: resolveProductDisplay(product) })
  } catch (err) {
    next(err)
  }
})

module.exports = router
