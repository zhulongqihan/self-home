const express = require('express')
const mongoose = require('mongoose')
const Message = require('../models/Message')
const Config = require('../models/Config')
const { requireAuth, requireRole } = require('../middlewares/auth')

const { resolveEggSwitch } = require('../constants/eggSwitches')

const router = express.Router()

function isMessageEnabled(cfg) {
  return resolveEggSwitch(cfg && cfg.eggs_switch, 'owner_daily_message')
}

function pickMessage(doc) {
  if (!doc) return null
  return {
    id: String(doc._id),
    content: doc.content,
    image: doc.image || '',
    created_at: doc.created_at
  }
}

/** GET /api/messages/latest - 顾客读最新留言（首页弹窗） */
router.get('/latest', requireAuth, requireRole('customer'), async (req, res, next) => {
  try {
    const cfg = await Config.findById('global')
    if (!isMessageEnabled(cfg)) {
      return res.json({ status: 'ok', data: null })
    }
    const doc = await Message.findOne().sort({ created_at: -1 }).lean()
    res.json({ status: 'ok', data: pickMessage(doc) })
  } catch (err) {
    next(err)
  }
})

/** GET /api/messages/owner - 店长历史留言 */
router.get('/owner', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50)
    const docs = await Message.find().sort({ created_at: -1 }).limit(limit).lean()
    res.json({
      status: 'ok',
      data: {
        items: docs.map(pickMessage)
      }
    })
  } catch (err) {
    next(err)
  }
})

/** POST /api/messages - 店长发留言 */
router.post('/', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const content = String((req.body && req.body.content) || '').trim()
    const image = String((req.body && req.body.image) || '').trim()
    if (!content) {
      return res.status(400).json({ status: 'error', code: 'EMPTY_CONTENT', message: '请写一句留言' })
    }
    if (content.length > 300) {
      return res.status(400).json({ status: 'error', code: 'CONTENT_TOO_LONG', message: '留言最多 300 字' })
    }
    const doc = await Message.create({ content, image })
    res.json({ status: 'ok', data: pickMessage(doc) })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/messages/:id - 店长删除留言 */
router.delete('/:id', requireAuth, requireRole('owner'), async (req, res, next) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_ID', message: '留言 ID 无效' })
    }
    const doc = await Message.findByIdAndDelete(id)
    if (!doc) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: '留言不存在' })
    }
    res.json({ status: 'ok', data: { id } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
