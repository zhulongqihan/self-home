const express = require('express')
const { requireAuth } = require('../middlewares/auth')
const { getKitchenTimeEggContext } = require('../services/timeEgg')

const router = express.Router()

/** GET /api/time-eggs/kitchen - 顾客厨房：当前时段彩蛋 */
router.get('/kitchen', requireAuth, async (req, res, next) => {
  try {
    const data = await getKitchenTimeEggContext()
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
