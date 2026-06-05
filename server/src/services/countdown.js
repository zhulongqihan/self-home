/** 计算三大倒计时（PRD 任务 13） */

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** YYYY-MM-DD → 在一起天数（含首日） */
function daysTogether(startStr) {
  if (!startStr || !/^\d{4}-\d{2}-\d{2}$/.test(startStr)) return null
  const start = startOfDay(new Date(startStr.replace(/-/g, '/')))
  if (Number.isNaN(start.getTime())) return null
  const today = startOfDay(new Date())
  const diff = Math.floor((today - start) / 86400000)
  return diff >= 0 ? diff + 1 : null
}

/** MM-DD → 距离下一次该日期的天数（0 = 今天） */
function daysUntilNextMMDD(mmdd) {
  if (!mmdd || !/^\d{2}-\d{2}$/.test(mmdd)) return null
  const [m, d] = mmdd.split('-').map(n => parseInt(n, 10))
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const today = startOfDay(new Date())
  let next = new Date(today.getFullYear(), m - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d)
  return Math.round((next - today) / 86400000)
}

function buildCountdownItems(cfg) {
  if (!cfg) return []
  const customerNickname = cfg.customer_nickname || '宝宝'
  const ownerNickname = cfg.owner_nickname || '店长'
  const items = []

  const together = daysTogether(cfg.relationship_start)
  if (together != null) {
    items.push({ key: 'together', label: '在一起', value: together, unit: '天' })
  }

  const anni = daysUntilNextMMDD(cfg.anniversary_date)
  if (anni != null) {
    items.push({ key: 'anniversary', label: '距纪念日', value: anni, unit: '天' })
  }

  const customerBday = daysUntilNextMMDD(cfg.customer_birthday)
  if (customerBday != null) {
    items.push({ key: 'birthday', label: `距${customerNickname}生日`, value: customerBday, unit: '天' })
  }

  const ownerBday = daysUntilNextMMDD(cfg.owner_birthday)
  if (ownerBday != null) {
    items.push({ key: 'owner_birthday', label: `距${ownerNickname}生日`, value: ownerBday, unit: '天' })
  }

  return items
}

module.exports = { daysTogether, daysUntilNextMMDD, buildCountdownItems }
