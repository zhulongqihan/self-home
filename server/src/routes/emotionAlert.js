const express = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const { getOwnerEmotionAlertStatus, dismissEmotionAlert } = require('../services/emotionAlert')

const router = express.Router()

/** GET /api/emotion-alert/status - 店长：情绪预警状态 */
router.get('/status', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const data = await getOwnerEmotionAlertStatus()
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

/** POST /api/emotion-alert/dismiss - 店长：知道了（本单不再弹窗） */
router.post('/dismiss', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const key = (req.body && (req.body.order_id || req.body.streak_key)) || ''
    if (!key) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_ORDER_ID',
        message: '缺少 order_id'
      })
    }
    const data = await dismissEmotionAlert(key)
    res.json({ status: 'ok', data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
