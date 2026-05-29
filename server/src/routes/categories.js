const express = require('express')
const Category = require('../models/Category')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const list = await Category.find({ status: 'enabled' })
      .sort({ sort_order: 1, created_at: 1 })
      .lean()
    res.json({ status: 'ok', data: list })
  } catch (err) {
    next(err)
  }
})

module.exports = router
