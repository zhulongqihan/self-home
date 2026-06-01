const Config = require('../models/Config')
const { resolveEggSwitch } = require('../constants/eggSwitches')

const DEFAULT_TIME_EGGS = [
  { start: '07:00', end: '10:00', banner: '', text: '早安～来份元气早餐吧', enabled: true },
  { start: '11:30', end: '13:30', banner: '', text: '午饭时间，想吃什么我来做', enabled: true },
  { start: '17:00', end: '20:00', banner: '', text: '晚餐开动啦', enabled: true },
  { start: '21:00', end: '23:59', banner: '', text: '夜宵档开启～', enabled: true }
]

function getNowMinutesShanghai() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date())
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10)
  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10)
  return hour * 60 + minute
}

function parseTimeToMinutes(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

function normalizeHHmm(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return String(str || '').trim()
  return `${String(parseInt(m[1], 10)).padStart(2, '0')}:${m[2]}`
}

function isInTimeRange(nowMin, startMin, endMin) {
  if (startMin === null || endMin === null) return false
  if (startMin <= endMin) return nowMin >= startMin && nowMin <= endMin
  return nowMin >= startMin || nowMin <= endMin
}

function normalizeSlot(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  const start = String(raw.start || '').trim()
  const end = String(raw.end || '').trim()
  if (!parseTimeToMinutes(start) || !parseTimeToMinutes(end)) return null
  return {
    index,
    start,
    end,
    banner: String(raw.banner || '').trim(),
    text: String(raw.text || '').trim(),
    enabled: raw.enabled !== false
  }
}

function pickActiveSlot(slots, previewIndex) {
  const list = (slots || []).map((s, i) => normalizeSlot(s, i)).filter(Boolean)
  if (!list.length) return null

  if (typeof previewIndex === 'number' && previewIndex >= 0 && previewIndex < list.length) {
    const forced = list[previewIndex]
    if (forced && forced.enabled) return forced
  }

  const nowMin = getNowMinutesShanghai()
  for (const slot of list) {
    if (!slot.enabled) continue
    const startMin = parseTimeToMinutes(slot.start)
    const endMin = parseTimeToMinutes(slot.end)
    if (isInTimeRange(nowMin, startMin, endMin)) return slot
  }
  return null
}

function pickTimeEggForOwner(cfg) {
  const slots = (cfg.time_easter_eggs || []).map((s, i) => normalizeSlot(s, i)).filter(Boolean)
  return {
    preview_index: (cfg.time_egg && cfg.time_egg.preview_index != null)
      ? cfg.time_egg.preview_index
      : -1,
    slots: slots.map(({ index, ...rest }) => rest)
  }
}

function validateTimeEggSlots(raw) {
  if (!Array.isArray(raw)) {
    const err = new Error('时段配置须为数组')
    err.status = 400
    err.code = 'INVALID_TIME_EGGS'
    throw err
  }
  if (raw.length > 12) {
    const err = new Error('时段彩蛋最多 12 条')
    err.status = 400
    err.code = 'TOO_MANY'
    throw err
  }
  return raw.map(item => {
    const start = normalizeHHmm(item.start)
    const end = normalizeHHmm(item.end)
    if (!parseTimeToMinutes(start) || !parseTimeToMinutes(end)) {
      const err = new Error('时段请用 HH:mm 格式')
      err.status = 400
      err.code = 'INVALID_TIME'
      throw err
    }
    return {
      start,
      end,
      banner: String(item.banner || '').trim().slice(0, 200),
      text: String(item.text || '').trim().slice(0, 80),
      enabled: item.enabled !== false
    }
  })
}

async function getKitchenTimeEggContext() {
  const cfg = await Config.findById('global')
  const enabled = resolveEggSwitch(cfg && cfg.eggs_switch, 'time_easter_egg')
  const slots = (cfg && cfg.time_easter_eggs) || []
  const previewIndex = (cfg && cfg.time_egg && cfg.time_egg.preview_index != null)
    ? cfg.time_egg.preview_index
    : -1

  if (!enabled) {
    return { enabled: false, active: false, start: '', end: '', banner: '', text: '' }
  }

  const active = pickActiveSlot(slots, previewIndex)
  if (!active) {
    return { enabled: true, active: false, start: '', end: '', banner: '', text: '' }
  }

  return {
    enabled: true,
    active: true,
    start: active.start,
    end: active.end,
    banner: active.banner || '',
    text: active.text || '当前时段专属推荐'
  }
}

module.exports = {
  DEFAULT_TIME_EGGS,
  normalizeHHmm,
  getNowMinutesShanghai,
  parseTimeToMinutes,
  isInTimeRange,
  validateTimeEggSlots,
  pickTimeEggForOwner,
  getKitchenTimeEggContext
}
