const express = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { getOwnerDashboard } = require('../services/analytics')

const router = express.Router()

/** GET /api/analytics/owner/dashboard - 店长数据看板 */
router.get('/owner/dashboard', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const data = await getOwnerDashboard()
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
