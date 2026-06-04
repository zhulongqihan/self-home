const Config = require('../models/Config')
const Order = require('../models/Order')
const Achievement = require('../models/Achievement')
const { resolveEggSwitch } = require('../constants/eggSwitches')
const { daysTogether } = require('./countdown')
const { getEmotionProductIdSet } = require('./emotionAlert')

const MAX_DAY_ENTRIES = 20
const MAX_BADGE_ENTRIES = 5
const LOOKBACK_DAYS = 90

function getShanghaiDateKey(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d)
}

function formatDayLabel(dateKey) {
  if (!dateKey) return ''
  const [y, m, d] = dateKey.split('-')
  const today = getShanghaiDateKey(new Date())
  if (dateKey === today) return '今天'
  const parts = today.split('-').map(Number)
  const cur = new Date(parts[0], parts[1] - 1, parts[2])
  const target = new Date(Number(y), Number(m) - 1, Number(d))
  const diff = Math.round((cur - target) / 86400000)
  if (diff === 1) return '昨天'
  if (diff >= 2 && diff <= 7) return `${diff} 天前`
  return `${Number(m)}/${Number(d)}`
}

function buildDailyOrderEvents(orders, emotionIds) {
  const since = new Date()
  since.setDate(since.getDate() - LOOKBACK_DAYS)

  const buckets = new Map()
  for (const o of orders) {
    const at = new Date(o.created_at)
    if (at < since) continue
    const dayKey = getShanghaiDateKey(at)
    if (!buckets.has(dayKey)) {
      buckets.set(dayKey, { dayKey, orders: [], total: 0, hasEmotion: false, names: new Set() })
    }
    const b = buckets.get(dayKey)
    b.orders.push(o)
    b.total += o.total_price || 0
    for (const line of o.items || []) {
      if (line.product_name) b.names.add(line.product_name)
      if (emotionIds.has(String(line.product_id))) b.hasEmotion = true
    }
  }

  const dayEvents = [...buckets.values()]
    .sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1))
    .slice(0, MAX_DAY_ENTRIES)
    .map(b => {
      const names = [...b.names]
      const count = b.orders.length
      let title
      if (count === 1 && names.length === 1) {
        title = `点了 ${names[0]}`
      } else if (count === 1) {
        title = '点了一单'
      } else {
        title = `这天点了 ${count} 单`
      }
      const namePart = names.slice(0, 2).join('、')
      const more = names.length > 2 ? ' 等' : ''
      const desc = namePart
        ? `${namePart}${more} · 共 ${b.total} 币`
        : `共 ${b.total} 币`
      const latest = b.orders[0].created_at
      return {
        type: b.hasEmotion ? 'emotion_day' : 'day',
        id: `day_${b.dayKey}`,
        at: latest,
        at_text: formatDayLabel(b.dayKey),
        title,
        desc,
        emoji: b.hasEmotion ? '💝' : '🍽️',
        status_text: b.hasEmotion ? '情绪日' : '点单日',
        status: 'day'
      }
    })

  return dayEvents
}

function buildBadgeEvents(unlocks, badgeMap) {
  const significant = unlocks.filter(u => {
    const meta = badgeMap[u.badge_id]
    if (!meta) return false
    if (meta.hidden) return true
    const th = parseInt(meta.threshold, 10) || 1
    return th >= 7
  })

  return significant
    .sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))
    .slice(0, MAX_BADGE_ENTRIES)
    .map(u => {
      const meta = badgeMap[u.badge_id]
      const dayKey = getShanghaiDateKey(new Date(u.unlocked_at))
      return {
        type: 'badge',
        id: `badge_${u.badge_id}`,
        at: u.unlocked_at,
        at_text: formatDayLabel(dayKey),
        title: `解锁「${meta.name}」`,
        desc: meta.description || '',
        emoji: meta.emoji || '🏅',
        status_text: '成就',
        status: 'badge'
      }
    })
}

async function getCustomerLoveTimeline(userId) {
  const cfg = await Config.findById('global').lean()
  const enabled = resolveEggSwitch(cfg && cfg.eggs_switch, 'love_timeline')
  const placeholder = (cfg && cfg.discover_placeholder) || {}

  if (!enabled) {
    return {
      enabled: false,
      placeholder: {
        title: placeholder.title || '发现',
        desc: placeholder.desc || '精彩内容筹备中，敬请期待～'
      },
      days_together: null,
      subtitle: '',
      events: []
    }
  }

  const customerNickname = (cfg && cfg.customer_nickname) || '宝宝'
  const days = daysTogether(cfg.relationship_start)

  const orders = await Order.find({
    user_id: userId,
    status: { $ne: 'cancelled' }
  })
    .sort({ created_at: -1 })
    .lean()

  const emotionIds = await getEmotionProductIdSet()
  const events = buildDailyOrderEvents(orders, emotionIds)

  const badgeMap = {}
  for (const b of cfg.badges || []) {
    if (b && b.id) badgeMap[b.id] = b
  }

  const unlocks = await Achievement.find({ user_id: userId }).lean()
  events.push(...buildBadgeEvents(unlocks, badgeMap))

  if (cfg.relationship_start && /^\d{4}-\d{2}-\d{2}$/.test(cfg.relationship_start)) {
    const startAt = new Date(`${cfg.relationship_start.replace(/-/g, '/')} 00:00:00`)
    events.push({
      type: 'milestone',
      id: 'together_start',
      at: startAt,
      at_text: cfg.relationship_start.replace(/-/g, '/'),
      title: '我们在一起',
      desc: days != null ? `已经 ${days} 天啦` : '故事从这里开始',
      emoji: '💕',
      status_text: '里程碑',
      status: 'milestone'
    })
  }

  events.sort((a, b) => new Date(b.at) - new Date(a.at))

  return {
    enabled: true,
    placeholder: null,
    days_together: days,
    customer_nickname: customerNickname,
    subtitle: '按天精选，只保留值得记住的日子',
    events
  }
}

module.exports = { getCustomerLoveTimeline }
