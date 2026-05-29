const STATUS_TEXT = {
  pending: '待接单',
  accepted: '已接单',
  preparing: '制作中',
  delivering: '配送中',
  delivered: '已送达',
  to_review: '待评价',
  completed: '已完成',
  cancelled: '已取消'
}

const OWNER_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['delivering'],
  delivering: ['delivered'],
  delivered: ['to_review'],
  to_review: ['completed'],
  completed: [],
  cancelled: []
}

const CUSTOMER_TRANSITIONS = {
  pending: ['cancelled']
}

function canTransition(from, to, role) {
  if (!from || !to || from === to) return false
  const map = role === 'owner' ? OWNER_TRANSITIONS : CUSTOMER_TRANSITIONS
  return (map[from] || []).includes(to)
}

function getNextStatuses(status, role) {
  if (role === 'owner') return OWNER_TRANSITIONS[status] || []
  return CUSTOMER_TRANSITIONS[status] || []
}

module.exports = { STATUS_TEXT, canTransition, getNextStatuses }
