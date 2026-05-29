const User = require('../models/User')
const env = require('../config')
const { sendSubscribeMessage } = require('./wxSubscribe')
const { STATUS_TEXT } = require('./orderStatus')

function fmtTime(d = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtAmount(price) {
  return `${Number(price || 0).toFixed(2)}元`
}

function orderNo(order) {
  return String(order._id || '').slice(-12)
}

function itemsSummary(order) {
  if (!order.items || !order.items.length) return '新订单'
  const text = order.items
    .map(i => `${i.product_name || '商品'}×${i.qty || 1}`)
    .join(' ')
  return text.slice(0, 20)
}

function statusTip(status) {
  const tips = {
    accepted: '店长已接单，请耐心等待',
    preparing: '正在为你准备美食',
    delivering: '美味正在路上',
    delivered: '订单已送达，请查收',
    to_review: '欢迎给本次订单留个评价',
    completed: '感谢光临，期待下次再来',
    cancelled: '订单已取消'
  }
  return (tips[status] || '订单状态已更新').slice(0, 20)
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
  // 模板「订单受理通知」：订单号/金额/内容/时间/备注
  const data = {
    character_string1: { value: orderNo(order) },
    amount2: { value: fmtAmount(order.total_price) },
    thing3: { value: itemsSummary(order) },
    time4: { value: fmtTime(order.created_at || new Date()) },
    thing5: { value: '请及时确认订单' }
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
  // 模板「订单状态变更通知」：状态/金额/温馨提示/下单时间
  const data = {
    phrase3: { value: String(STATUS_TEXT[status] || status).slice(0, 20) },
    amount4: { value: fmtAmount(order.total_price) },
    thing5: { value: statusTip(status) },
    time12: { value: fmtTime(order.created_at || new Date()) }
  }
  return sendSubscribeMessage({
    openid,
    templateId: tmpl,
    page: 'pages/customer/orders/index',
    data
  })
}

/** 顾客亲亲 → 通知店长 */
async function notifyOwnerKiss() {
  const tmpl = env.wx.templates.ownerNewOrder
  if (!tmpl) return false
  const owner = await User.findOne({ role: 'owner', openid: { $exists: true, $ne: '' } })
    .select('openid')
    .lean()
  if (!owner || !owner.openid) return false
  const data = {
    character_string1: { value: '亲亲' },
    amount2: { value: '1币' },
    thing3: { value: '宝宝亲了你一下' },
    time4: { value: fmtTime() },
    thing5: { value: '快去看看她吧' }
  }
  return sendSubscribeMessage({
    openid: owner.openid,
    templateId: tmpl,
    page: 'pages/owner/index/index',
    data
  })
}

module.exports = { notifyOwnerNewOrder, notifyCustomerOrderStatus, notifyOwnerKiss }
