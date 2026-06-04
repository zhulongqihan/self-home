const Config = require('../models/Config')
const User = require('../models/User')
const Order = require('../models/Order')
const Achievement = require('../models/Achievement')
const { resolveEggSwitch } = require('../constants/eggSwitches')

const TRIGGER_META = [
  { value: 'sign_in_days', label: '连续签到天数' },
  { value: 'kiss_total', label: '累计亲亲次数' },
  { value: 'order_count', label: '累计下单次数' }
]

const DEFAULT_BADGES = [
  {
    id: 'first_order',
    name: '初来乍到',
    emoji: '🍽️',
    description: '提交第一笔订单',
    trigger: 'order_count',
    threshold: 1,
    hidden: false,
    enabled: true,
    sort_order: 10
  },
  {
    id: 'sign_7',
    name: '签到达人',
    emoji: '📅',
    description: '连续签到 7 天',
    trigger: 'sign_in_days',
    threshold: 7,
    hidden: false,
    enabled: true,
    sort_order: 20
  },
  {
    id: 'sign_30',
    name: '签到传说',
    emoji: '🏆',
    description: '连续签到 30 天',
    trigger: 'sign_in_days',
    threshold: 30,
    hidden: true,
    enabled: true,
    sort_order: 30
  },
  {
    id: 'kiss_50',
    name: '亲亲达人',
    emoji: '💋',
    description: '累计亲亲 50 次',
    trigger: 'kiss_total',
    threshold: 50,
    hidden: false,
    enabled: true,
    sort_order: 40
  },
  {
    id: 'kiss_100',
    name: '百吻定情',
    emoji: '💕',
    description: '累计亲亲 100 次',
    trigger: 'kiss_total',
    threshold: 100,
    hidden: false,
    enabled: true,
    sort_order: 50
  },
  {
    id: 'order_10',
    name: '干饭十级',
    emoji: '🛒',
    description: '累计下单 10 次',
    trigger: 'order_count',
    threshold: 10,
    hidden: false,
    enabled: true,
    sort_order: 60
  }
]

const VALID_TRIGGERS = new Set(TRIGGER_META.map(t => t.value))

function statForTrigger(trigger, stats) {
  if (trigger === 'sign_in_days') return stats.sign_in_days || 0
  if (trigger === 'kiss_total') return stats.kiss_total || 0
  if (trigger === 'order_count') return stats.order_count || 0
  return 0
}

function meetsThreshold(badge, stats) {
  const threshold = Math.max(1, parseInt(badge.threshold, 10) || 1)
  return statForTrigger(badge.trigger, stats) >= threshold
}

async function getUserStats(userId) {
  const user = await User.findById(userId)
    .select('continuous_sign_days kiss_count_total')
    .lean()
  const orderCount = await Order.countDocuments({
    user_id: userId,
    status: { $ne: 'cancelled' }
  })
  return {
    sign_in_days: user?.continuous_sign_days || 0,
    kiss_total: user?.kiss_count_total || 0,
    order_count: orderCount
  }
}

function normalizeBadge(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id || '').trim().toLowerCase()
  if (!/^[a-z][a-z0-9_]{0,31}$/.test(id)) return null
  const trigger = String(raw.trigger || '').trim()
  if (!VALID_TRIGGERS.has(trigger)) return null
  const threshold = Math.max(1, Math.min(9999, parseInt(raw.threshold, 10) || 1))
  return {
    id,
    name: String(raw.name || '').trim().slice(0, 16),
    emoji: String(raw.emoji || '🏅').trim().slice(0, 4),
    description: String(raw.description || '').trim().slice(0, 60),
    trigger,
    threshold,
    hidden: !!raw.hidden,
    enabled: raw.enabled !== false,
    sort_order: raw.sort_order != null ? parseInt(raw.sort_order, 10) : index * 10
  }
}

function validateBadges(raw) {
  if (!Array.isArray(raw)) {
    const err = new Error('徽章配置须为数组')
    err.status = 400
    err.code = 'INVALID_BADGES'
    throw err
  }
  if (raw.length > 24) {
    const err = new Error('成就徽章最多 24 个')
    err.status = 400
    err.code = 'TOO_MANY'
    throw err
  }
  const out = []
  const ids = new Set()
  raw.forEach((item, index) => {
    const badge = normalizeBadge(item, index)
    if (!badge || !badge.name) {
      const err = new Error('徽章 id / 名称 / 触发条件不合法')
      err.status = 400
      err.code = 'INVALID_BADGE'
      throw err
    }
    if (ids.has(badge.id)) {
      const err = new Error(`徽章 id 重复：${badge.id}`)
      err.status = 400
      err.code = 'DUPLICATE_BADGE_ID'
      throw err
    }
    ids.add(badge.id)
    out.push(badge)
  })
  return out.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

function pickBadgesForOwner(cfg) {
  const badges = (cfg.badges || []).map((b, i) => normalizeBadge(b, i)).filter(Boolean)
  return {
    preview_all: !!(cfg.achievement && cfg.achievement.preview_all),
    badges: badges.map(({ sort_order, ...rest }) => rest),
    trigger_meta: TRIGGER_META
  }
}

function formatUnlockedBadge(badge, unlockedAt) {
  return {
    id: badge.id,
    name: badge.name,
    emoji: badge.emoji,
    description: badge.description,
    unlocked_at: unlockedAt || new Date()
  }
}

async function checkAndUnlock(userId) {
  const cfg = await Config.findById('global').lean()
  if (!resolveEggSwitch(cfg && cfg.eggs_switch, 'achievement_badges')) return []

  const badges = (cfg.badges || []).filter(b => b.enabled !== false)
  if (!badges.length) return []

  const stats = await getUserStats(userId)
  const existing = await Achievement.find({ user_id: userId }).select('badge_id').lean()
  const unlockedIds = new Set(existing.map(a => a.badge_id))
  const newly = []

  for (const badge of badges) {
    if (unlockedIds.has(badge.id)) continue
    if (!meetsThreshold(badge, stats)) continue
    try {
      const doc = await Achievement.create({ user_id: userId, badge_id: badge.id })
      newly.push(formatUnlockedBadge(badge, doc.unlocked_at))
    } catch (err) {
      if (err.code !== 11000) throw err
    }
  }
  return newly
}

async function getBadgeWall(userId) {
  const cfg = await Config.findById('global').lean()
  const featureEnabled = resolveEggSwitch(cfg && cfg.eggs_switch, 'achievement_badges')
  const previewAll = !!(cfg && cfg.achievement && cfg.achievement.preview_all)

  if (!featureEnabled) {
    return { enabled: false, preview_all: false, badges: [], unlocked_count: 0, total: 0 }
  }

  await checkAndUnlock(userId)

  const badges = (cfg.badges || [])
    .map((b, i) => normalizeBadge(b, i))
    .filter(b => b && b.enabled !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const stats = await getUserStats(userId)
  const unlockedDocs = await Achievement.find({ user_id: userId }).lean()
  const unlockedMap = new Map(unlockedDocs.map(a => [a.badge_id, a.unlocked_at]))

  const wall = badges.map(badge => {
    const unlocked = previewAll || unlockedMap.has(badge.id)
    const current = statForTrigger(badge.trigger, stats)
    return {
      id: badge.id,
      name: unlocked || !badge.hidden ? badge.name : '???',
      emoji: unlocked ? badge.emoji : (badge.hidden ? '🔒' : badge.emoji),
      description: unlocked
        ? badge.description
        : (badge.hidden ? '隐藏成就，解锁后可见' : badge.description),
      hidden: !!badge.hidden,
      unlocked,
      unlocked_at: unlockedMap.get(badge.id) || null,
      progress: {
        current,
        threshold: badge.threshold || 1
      }
    }
  })

  const unlockedCount = wall.filter(b => b.unlocked && unlockedMap.has(b.id)).length

  return {
    enabled: true,
    preview_all: previewAll,
    badges: wall,
    unlocked_count: previewAll ? wall.length : unlockedCount,
    total: wall.length
  }
}

module.exports = {
  TRIGGER_META,
  DEFAULT_BADGES,
  validateBadges,
  pickBadgesForOwner,
  checkAndUnlock,
  getBadgeWall,
  getUserStats
}
