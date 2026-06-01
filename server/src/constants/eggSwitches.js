/** 彩蛋开关定义（PRD §五） */
const EGG_SWITCH_META = [
  { key: 'anniversary_egg', label: '纪念日彩蛋', default: true },
  { key: 'birthday_egg', label: '生日彩蛋', default: true },
  { key: 'weather_link', label: '天气联动', default: true },
  { key: 'owner_daily_message', label: '店长每日留言', default: true },
  { key: 'share_square', label: '晒单广场', default: true },
  { key: 'daily_sign_in', label: '每日签到', default: true },
  { key: 'meal_reminder', label: '饭点提醒', default: true },
  { key: 'shake_blind_box', label: '摇一摇盲盒', default: true },
  { key: 'good_night_mode', label: '晚安模式', default: true },
  { key: 'love_timeline', label: '恋爱时光机', default: true },
  { key: 'exclusive_bgm', label: '专属 BGM', default: false },
  { key: 'emotion_alert', label: '情绪预警', default: true }
]

function eggsSwitchToObject(sw) {
  if (!sw) return {}
  if (sw instanceof Map) return Object.fromEntries(sw)
  if (typeof sw.toObject === 'function') return sw.toObject()
  return { ...sw }
}

function resolveEggSwitch(sw, key) {
  const obj = eggsSwitchToObject(sw)
  if (obj[key] === undefined) {
    const meta = EGG_SWITCH_META.find(e => e.key === key)
    return meta ? meta.default : true
  }
  return obj[key] !== false
}

function normalizeEggsForOwner(sw) {
  const obj = eggsSwitchToObject(sw)
  const out = {}
  for (const item of EGG_SWITCH_META) {
    out[item.key] = resolveEggSwitch(obj, item.key)
  }
  return out
}

module.exports = {
  EGG_SWITCH_META,
  eggsSwitchToObject,
  resolveEggSwitch,
  normalizeEggsForOwner
}
