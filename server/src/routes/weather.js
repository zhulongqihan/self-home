const express = require('express')
const { requireAuth } = require('../middlewares/auth')
const { getKitchenWeatherContext } = require('../services/weather')

const router = express.Router()

/** GET /api/weather/kitchen - 顾客厨房：雨天热饮专场 */
router.get('/kitchen', requireAuth, async (req, res, next) => {
  try {
    const data = await getKitchenWeatherContext()
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
