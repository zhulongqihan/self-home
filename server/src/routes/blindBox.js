const express = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { getKitchenBlindBoxContext, shakeBlindBox } = require('../services/blindBox')

const router = express.Router()

/** GET /api/blind-box/kitchen - 顾客厨房：盲盒状态 */
router.get('/kitchen', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const data = await getKitchenBlindBoxContext(req.user.sub)
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

/** POST /api/blind-box/shake - 摇一摇开奖 */
router.post('/shake', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const data = await shakeBlindBox(req.user.sub)
    res.json({ status: 'ok', data })
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        status: 'error',
        code: err.code || 'SHAKE_FAILED',
        message: err.message
      })
    }
    next(err)
  }
})

module.exports = router
