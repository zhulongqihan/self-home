/**
 * 重要日期（代码内固定，不随店长后台修改）
 * 修改后需重新部署后端
 */
const FIXED_DATES = {
  /** 在一起起始日 YYYY-MM-DD */
  relationship_start: '2026-01-09',
  /** 纪念日 MM-DD（每年） */
  anniversary_date: '01-09',
  /** 顾客生日 MM-DD */
  customer_birthday: '02-18',
  /** 店长生日 MM-DD */
  owner_birthday: '10-25'
}

/** 将固定日期合并进配置对象（用于倒计时、时光机等） */
function applyFixedDates(cfg) {
  const base = cfg && typeof cfg.toObject === 'function' ? cfg.toObject() : { ...(cfg || {}) }
  return { ...base, ...FIXED_DATES }
}

function getFixedDatesPayload() {
  return {
    ...FIXED_DATES,
    locked: true,
    lock_note: '重要日期已在系统中固定，如需调整请联系开发者改代码后部署'
  }
}

module.exports = { FIXED_DATES, applyFixedDates, getFixedDatesPayload }
