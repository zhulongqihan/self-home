const mongoose = require('mongoose')
const Config = require('../models/Config')
const Product = require('../models/Product')
const BlindBoxShake = require('../models/BlindBoxShake')
const { resolveEggSwitch } = require('../constants/eggSwitches')
const { enrichProducts } = require('../utils/productImage')

const DEFAULT_BLIND_BOX = {
  title: '摇一摇开盲盒',
  hint: '摇一摇，从全店在售商品随机，今日下单免费～',
  button_text: '点我摇一下',
  daily_limit: 3,
  product_ids: [],
  simulate_shake: false
}

const SHAKE_COOLDOWN_MS = 2500

function todayKey() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function normalizeProductIds(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(id => String(id || '').trim())
    .filter(id => mongoose.Types.ObjectId.isValid(id))
}

function pickBlindBoxForOwner(cfg) {
  const box = { ...DEFAULT_BLIND_BOX, ...(cfg.blind_box || {}) }
  return {
    title: box.title || DEFAULT_BLIND_BOX.title,
    hint: box.hint || DEFAULT_BLIND_BOX.hint,
    button_text: box.button_text || DEFAULT_BLIND_BOX.button_text,
    daily_limit: Math.max(1, Math.min(20, parseInt(box.daily_limit, 10) || 3)),
    simulate_shake: !!box.simulate_shake
  }
}

function validateBlindBoxPatch(raw) {
  if (!raw || typeof raw !== 'object') {
    const err = new Error('盲盒配置无效')
    err.status = 400
    err.code = 'INVALID_BLIND_BOX'
    throw err
  }
  const out = {}
  if (raw.title !== undefined) out.title = String(raw.title).trim().slice(0, 24)
  if (raw.hint !== undefined) out.hint = String(raw.hint).trim().slice(0, 60)
  if (raw.button_text !== undefined) out.button_text = String(raw.button_text).trim().slice(0, 16)
  if (raw.daily_limit !== undefined) {
    const n = parseInt(raw.daily_limit, 10)
    out.daily_limit = Number.isNaN(n) ? 3 : Math.max(1, Math.min(20, n))
  }
  if (raw.simulate_shake !== undefined) out.simulate_shake = !!raw.simulate_shake
  if (raw.product_ids !== undefined) {
    out.product_ids = []
  }
  return out
}

/** 盲盒从全店在售商品随机，不再从菜单隐藏商品 */
async function getHiddenProductIds() {
  return []
}

async function countOnSaleProducts() {
  return Product.countDocuments({ status: 'on_sale' })
}

async function pickRandomOnSaleProduct() {
  const total = await countOnSaleProducts()
  if (!total) return null
  const skip = Math.floor(Math.random() * total)
  const list = await Product.find({ status: 'on_sale' }).skip(skip).limit(1).lean()
  return list[0] || null
}

async function getOrCreateTodayRecord(userId) {
  const date_key = todayKey()
  let doc = await BlindBoxShake.findOne({ user_id: userId, date_key })
  if (!doc) {
    doc = await BlindBoxShake.create({ user_id: userId, date_key, count: 0, bonus_limit: 0, reveals: [] })
  }
  return doc
}

function effectiveLimit(box, record) {
  return (box.daily_limit || 3) + (record.bonus_limit || 0)
}

async function grantSignInBlindBonus(userId) {
  const cfg = await Config.findById('global').lean()
  if (!resolveEggSwitch(cfg && cfg.eggs_switch, 'shake_blind_box')) return
  const record = await getOrCreateTodayRecord(userId)
  record.bonus_limit = (record.bonus_limit || 0) + 1
  await record.save()
}

async function getKitchenBlindBoxContext(userId) {
  const cfg = await Config.findById('global').lean()
  const enabled = resolveEggSwitch(cfg && cfg.eggs_switch, 'shake_blind_box')
  const box = pickBlindBoxForOwner(cfg || {})

  if (!enabled) {
    return {
      enabled: false,
      title: '',
      hint: '',
      button_text: '',
      daily_limit: 0,
      shakes_left: 0,
      pool_count: 0,
      simulate_shake: false,
      today_reveals: []
    }
  }

  const record = await getOrCreateTodayRecord(userId)
  const limit = effectiveLimit(box, record)
  const shakesLeft = Math.max(0, limit - (record.count || 0))
  const poolCount = await countOnSaleProducts()

  return {
    enabled: true,
    title: box.title,
    hint: box.hint,
    button_text: box.button_text,
    daily_limit: box.daily_limit,
    shakes_left: shakesLeft,
    pool_count: poolCount,
    simulate_shake: box.simulate_shake,
    today_reveals: (record.reveals || []).map(r => ({
      product_id: String(r.product_id),
      product_name: r.product_name || ''
    }))
  }
}

const shakeCooldown = new Map()

async function shakeBlindBox(userId) {
  const cfg = await Config.findById('global').lean()
  if (!resolveEggSwitch(cfg && cfg.eggs_switch, 'shake_blind_box')) {
    const err = new Error('摇一摇盲盒未开启')
    err.status = 403
    err.code = 'BLIND_BOX_DISABLED'
    throw err
  }

  const now = Date.now()
  const last = shakeCooldown.get(String(userId)) || 0
  if (now - last < SHAKE_COOLDOWN_MS) {
    const err = new Error('摇太快啦，稍等一下～')
    err.status = 429
    err.code = 'SHAKE_TOO_FAST'
    throw err
  }

  const record = await getOrCreateTodayRecord(userId)
  const box = pickBlindBoxForOwner(cfg || {})
  const limit = effectiveLimit(box, record)
  if ((record.count || 0) >= limit) {
    const err = new Error('今日摇盲盒次数已用完，明天再来吧')
    err.status = 429
    err.code = 'DAILY_LIMIT'
    throw err
  }

  const picked = await pickRandomOnSaleProduct()
  if (!picked) {
    const err = new Error('暂无在售商品，请先在商品管理添加上架商品')
    err.status = 400
    err.code = 'POOL_EMPTY'
    throw err
  }

  record.count = (record.count || 0) + 1
  record.reveals.push({
    product_id: picked._id,
    product_name: picked.name,
    created_at: new Date()
  })
  await record.save()
  shakeCooldown.set(String(userId), now)

  const [enriched] = enrichProducts([picked])
  const shakesLeft = Math.max(0, limit - record.count)
  const product = {
    ...enriched,
    blind_free: true,
    original_price: picked.price,
    price: 0
  }

  return {
    product,
    shakes_left: shakesLeft,
    reveal_no: record.reveals.length
  }
}

async function getTodayFreeRevealProductIds(userId) {
  const counts = await getTodayRevealCounts(userId)
  return new Set(counts.keys())
}

async function getTodayRevealCounts(userId) {
  const record = await BlindBoxShake.findOne({ user_id: userId, date_key: todayKey() }).lean()
  const counts = new Map()
  if (!record || !record.reveals) return counts
  for (const r of record.reveals) {
    const id = String(r.product_id)
    counts.set(id, (counts.get(id) || 0) + 1)
  }
  return counts
}

module.exports = {
  DEFAULT_BLIND_BOX,
  pickBlindBoxForOwner,
  validateBlindBoxPatch,
  getHiddenProductIds,
  getTodayFreeRevealProductIds,
  getTodayRevealCounts,
  grantSignInBlindBonus,
  getKitchenBlindBoxContext,
  shakeBlindBox
}
