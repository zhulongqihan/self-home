const Config = require('../models/Config')
const Category = require('../models/Category')
const Product = require('../models/Product')
const EmotionAlert = require('../models/EmotionAlert')
const { resolveEggSwitch } = require('../constants/eggSwitches')
const { notifyOwnerEmotionOrder } = require('./orderNotify')

const DEFAULT_EMOTION_ALERT = {
  simulate_active: false,
  simulate_dismissed: false
}

const CATEGORY_KEYWORDS = ['情绪', '撒娇']
const TAG_KEYWORDS = ['情绪', '撒娇', 'emo', '生气', '治愈']

async function getGlobalConfig() {
  return Config.findById('global').lean()
}

function pickEmotionAlertForOwner(cfg) {
  const raw = { ...DEFAULT_EMOTION_ALERT, ...(cfg && cfg.emotion_alert) }
  return {
    simulate_active: !!raw.simulate_active
  }
}

function validateEmotionAlertPatch(patch) {
  const out = {}
  if (patch.simulate_active !== undefined) {
    out.simulate_active = !!patch.simulate_active
    if (patch.simulate_active) out.simulate_dismissed = false
  }
  return out
}

async function getEmotionProductIdSet() {
  const categories = await Category.find({ status: 'enabled' }).select('name').lean()
  const emotionCatIds = categories
    .filter(c => CATEGORY_KEYWORDS.some(kw => (c.name || '').includes(kw)))
    .map(c => c._id)

  const products = await Product.find({ status: 'on_sale' })
    .select('_id tags category_id')
    .lean()

  const ids = new Set()
  for (const p of products) {
    const tagHit = (p.tags || []).some(t =>
      TAG_KEYWORDS.some(kw => String(t).toLowerCase().includes(kw.toLowerCase()))
    )
    const catHit = emotionCatIds.some(id => String(id) === String(p.category_id))
    if (tagHit || catHit) ids.add(String(p._id))
  }
  return ids
}

function filterEmotionLines(items, emotionIds) {
  return (items || [])
    .filter(line => emotionIds.has(String(line.product_id)))
    .map(line => ({
      product_name: line.product_name || '商品',
      qty: line.qty || 1
    }))
}

/** 订单行里是否含情绪类商品 */
async function getEmotionLinesFromOrderItems(items) {
  const emotionIds = await getEmotionProductIdSet()
  return filterEmotionLines(items, emotionIds)
}

function buildAlertMessage(customerNickname, emotionLines) {
  const names = emotionLines.map(l => l.product_name).join('、').slice(0, 40)
  return `${customerNickname} 刚下了情绪类订单（${names}），记得多关心一下她～`
}

function formatAlertDoc(doc, cfg) {
  const customerNickname = (cfg && cfg.customer_nickname) || '宝宝'
  const items = doc.items || []
  return {
    alert_id: String(doc._id),
    order_id: String(doc.order_id),
    active: !doc.dismissed,
    customer_nickname: customerNickname,
    message: buildAlertMessage(customerNickname, items),
    items,
    created_at: doc.created_at,
    streak_key: String(doc.order_id)
  }
}

function buildSimulateStatus(cfg) {
  const customerNickname = (cfg && cfg.customer_nickname) || '宝宝'
  const dismissed = !!(cfg.emotion_alert && cfg.emotion_alert.simulate_dismissed)
  const items = [{ product_name: '拥抱加急券（模拟）', qty: 1 }]
  const message = `${customerNickname} 【模拟验收】刚下了情绪类订单，记得多关心一下她～`
  return {
    enabled: true,
    active: !dismissed,
    simulated: true,
    alert_id: 'simulate',
    order_id: 'simulate',
    streak_key: 'simulate',
    customer_nickname: customerNickname,
    message: dismissed ? '' : message,
    items,
    recent_orders: [{
      _id: 'simulate',
      short_id: 'demo',
      created_at: new Date().toISOString(),
      items
    }]
  }
}

/** 顾客下单后：含情绪类商品则记预警 + 微信订阅消息 */
async function handleEmotionOrderPlaced(order) {
  const cfg = await getGlobalConfig()
  if (!resolveEggSwitch(cfg && cfg.eggs_switch, 'emotion_alert')) return null

  const emotionLines = await getEmotionLinesFromOrderItems(order.items)
  if (!emotionLines.length) return null

  const customerNickname = (cfg && cfg.customer_nickname) || '宝宝'

  let alert
  try {
    alert = await EmotionAlert.create({
      order_id: order._id,
      items: emotionLines
    })
  } catch (err) {
    if (err.code === 11000) return null
    throw err
  }

  notifyOwnerEmotionOrder(order, emotionLines, customerNickname).catch(e => {
    console.warn('[emotionAlert] notifyOwnerEmotionOrder:', e.message)
  })

  return alert
}

async function getOwnerEmotionAlertStatus() {
  const cfg = await getGlobalConfig()
  const enabled = resolveEggSwitch(cfg && cfg.eggs_switch, 'emotion_alert')
  const customerNickname = (cfg && cfg.customer_nickname) || '宝宝'

  if (!enabled) {
    return {
      enabled: false,
      active: false,
      simulated: false,
      customer_nickname: customerNickname,
      message: '',
      items: [],
      recent_orders: []
    }
  }

  if (cfg.emotion_alert && cfg.emotion_alert.simulate_active) {
    return buildSimulateStatus(cfg)
  }

  const pending = await EmotionAlert.findOne({ dismissed: false })
    .sort({ created_at: -1 })
    .lean()

  if (!pending) {
    return {
      enabled: true,
      active: false,
      simulated: false,
      customer_nickname: customerNickname,
      message: '',
      items: [],
      recent_orders: []
    }
  }

  const formatted = formatAlertDoc(pending, cfg)
  return {
    enabled: true,
    active: true,
    simulated: false,
    customer_nickname: formatted.customer_nickname,
    alert_id: formatted.alert_id,
    order_id: formatted.order_id,
    streak_key: formatted.streak_key,
    message: formatted.message,
    items: formatted.items,
    recent_orders: [{
      _id: formatted.order_id,
      short_id: String(formatted.order_id).slice(-6),
      created_at: pending.created_at,
      items: formatted.items
    }]
  }
}

async function dismissEmotionAlert(key) {
  const id = String(key || '').trim()
  if (!id) {
    const err = new Error('缺少 order_id')
    err.status = 400
    throw err
  }

  if (id === 'simulate') {
    const cfg = await Config.findById('global')
    if (!cfg) {
      const err = new Error('服务端未初始化')
      err.status = 500
      throw err
    }
    if (!cfg.emotion_alert) cfg.emotion_alert = { ...DEFAULT_EMOTION_ALERT }
    cfg.emotion_alert.simulate_dismissed = true
    cfg.markModified('emotion_alert')
    await cfg.save()
    return { dismissed: true }
  }

  const doc = await EmotionAlert.findOneAndUpdate(
    { order_id: id, dismissed: false },
    { $set: { dismissed: true } },
    { new: true }
  )
  if (!doc) {
    await EmotionAlert.findByIdAndUpdate(id, { dismissed: true })
  }
  return { dismissed: true }
}

module.exports = {
  pickEmotionAlertForOwner,
  validateEmotionAlertPatch,
  getEmotionLinesFromOrderItems,
  handleEmotionOrderPlaced,
  getOwnerEmotionAlertStatus,
  dismissEmotionAlert,
  DEFAULT_EMOTION_ALERT
}
