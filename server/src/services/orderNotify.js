const User = require('../models/User')
const env = require('../config')
const { sendSubscribeMessage } = require('./wxSubscribe')
const { STATUS_TEXT } = require('./orderStatus')

function fmtTime(d = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function getUserOpenid(userId) {
  const user = await User.findById(userId).select('openid').lean()
  return user && user.openid ? user.openid : ''
}

/** 新订单 → 通知店长 */
async function notifyOwnerNewOrder(order) {
  const tmpl = env.wx.templates.ownerNewOrder
  if (!tmpl) return false
  const owner = await User.findOne({ role: 'owner', openid: { $exists: true, $ne: '' } })
    .select('openid')
    .lean()
  if (!owner || !owner.openid) return false
  const first = order.items && order.items[0]
  const name = first ? first.product_name : '新订单'
  const data = {
    thing1: { value: String(name).slice(0, 20) },
    amount2: { value: `¥${order.total_price}` },
    time3: { value: fmtTime(order.created_at || new Date()) }
  }
  return sendSubscribeMessage({
    openid: owner.openid,
    templateId: tmpl,
    page: 'pages/owner/orders/index',
    data
  })
}

/** 状态变更 → 通知顾客 */
async function notifyCustomerOrderStatus(order, status) {
  const tmpl = env.wx.templates.customerOrderStatus
  if (!tmpl) return false
  const openid = await getUserOpenid(order.user_id)
  if (!openid) return false
  const data = {
    thing1: { value: String(STATUS_TEXT[status] || status).slice(0, 20) },
    character_string2: { value: String(order._id).slice(-8) },
    time3: { value: fmtTime() }
  }
  return sendSubscribeMessage({
    openid,
    templateId: tmpl,
    page: 'pages/customer/orders/index',
    data
  })
}

module.exports = { notifyOwnerNewOrder, notifyCustomerOrderStatus }
