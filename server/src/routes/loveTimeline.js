const express = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { getCustomerLoveTimeline } = require('../services/loveTimeline')

const router = express.Router()

/** GET /api/love-timeline/discover - 顾客发现页：恋爱时光机 */
router.get('/discover', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const data = await getCustomerLoveTimeline(req.user.sub)
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
