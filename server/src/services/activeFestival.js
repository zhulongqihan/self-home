const Festival = require('../models/Festival')

/** 服务器本地日期 → MM-DD（按中国常用时区） */
function getTodayMMDD() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const month = parts.find(p => p.type === 'month').value
  const day = parts.find(p => p.type === 'day').value
  return `${month}-${day}`
}

/** 当前生效的节日（公历 fixed；lunar 预留） */
async function findActiveFestival() {
  const today = getTodayMMDD()
  return Festival.findOne({
    status: 'enabled',
    date_type: 'fixed',
    date: today
  }).lean()
}

module.exports = {
  getTodayMMDD,
  findActiveFestival
}
