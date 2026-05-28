// utils/util.js - 通用工具函数

/** 格式化日期 yyyy-MM-dd HH:mm:ss */
const formatTime = date => {
  const d = new Date(date)
  const pad = n => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 计算距离某日期的天数（正：未来，负：过去） */
const daysUntil = targetDateStr => {
  const target = new Date(targetDateStr).getTime()
  const now = new Date().setHours(0, 0, 0, 0)
  return Math.floor((target - now) / (1000 * 60 * 60 * 24))
}

/** Toast 简易封装 */
const toast = (title, icon = 'none') => {
  wx.showToast({ title, icon, duration: 1500 })
}

module.exports = {
  formatTime,
  daysUntil,
  toast
}