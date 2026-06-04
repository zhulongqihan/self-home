function mmddToPickerValue(mmdd) {
  if (mmdd && /^\d{2}-\d{2}$/.test(mmdd)) {
    return `2000-${mmdd}`
  }
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

function dateToMMDD(dateStr) {
  const parts = String(dateStr || '').split('-')
  if (parts.length >= 3) return `${parts[1]}-${parts[2]}`
  return ''
}

function mmddToDisplay(mmdd) {
  if (!mmdd || !/^\d{2}-\d{2}$/.test(mmdd)) return ''
  const [m, d] = mmdd.split('-')
  return `${parseInt(m, 10)}月${parseInt(d, 10)}日`
}

function normalizeHHmm(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return String(str || '').trim()
  return `${String(parseInt(m[1], 10)).padStart(2, '0')}:${m[2]}`
}

module.exports = {
  mmddToPickerValue,
  dateToMMDD,
  mmddToDisplay,
  normalizeHHmm
}
