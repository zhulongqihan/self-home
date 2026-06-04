const express = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { getBadgeWall } = require('../services/achievement')

const router = express.Router()

/** GET /api/achievements/wall - 顾客成就徽章墙 */
router.get('/wall', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const data = await getBadgeWall(req.user.sub)
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
