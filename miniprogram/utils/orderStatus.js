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

const ACTION_TEXT = {
  accepted: '接单',
  preparing: '开始制作',
  delivering: '开始配送',
  delivered: '已送达',
  to_review: '待评价',
  completed: '完成订单',
  cancelled: '取消订单'
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

function getNextStatuses(status, role) {
  if (role === 'owner') return OWNER_TRANSITIONS[status] || []
  return CUSTOMER_TRANSITIONS[status] || []
}

function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatOrder(order) {
  if (!order) return order
  const history = (order.status_history || []).map(h => ({
    ...h,
    status_text: STATUS_TEXT[h.status] || h.status,
    changed_at_text: formatTime(h.changed_at)
  }))
  return {
    ...order,
    short_id: String(order._id || '').slice(-6),
    status_text: STATUS_TEXT[order.status] || order.status,
    created_at_text: formatTime(order.created_at),
    status_history: history
  }
}

module.exports = { STATUS_TEXT, ACTION_TEXT, formatOrder, getNextStatuses }
