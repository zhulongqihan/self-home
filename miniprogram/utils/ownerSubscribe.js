const { get } = require('./request')
const { requestSubscribeByRole } = require('./subscribe')
const { bindWxOpenid } = require('./bindWx')

const PROMPT_KEY = 'owner_subscribe_prompted_v1'

/**
 * 店长端：绑定微信 openid + 拉起「新订单」订阅授权
 */
async function ensureOwnerOrderNotifyReady() {
  try {
    await bindWxOpenid()
  } catch (e) {
    console.warn('[ownerSubscribe] bindWx:', e.message || e)
  }

  const result = await requestSubscribeByRole()
  if (result.ok) return { subscribed: true }

  const prompted = wx.getStorageSync(PROMPT_KEY)
  if (!prompted) {
    wx.setStorageSync(PROMPT_KEY, true)
    return new Promise(resolve => {
      wx.showModal({
        title: '开启新订单微信提醒',
        content:
          '她每次下单后，你会收到微信服务通知。请点「去开启」并在弹窗中选择「允许」。若之前点过拒绝，需在微信「设置 → 通知管理」里重新打开订阅消息。',
        confirmText: '去开启',
        cancelText: '稍后',
        success: async res => {
          if (res.confirm) {
            const again = await requestSubscribeByRole()
            resolve({ subscribed: !!again.ok })
          } else {
            resolve({ subscribed: false })
          }
        },
        fail: () => resolve({ subscribed: false })
      })
    })
  }

  return { subscribed: false }
}

/** 推送配置是否就绪（仅诊断） */
async function fetchNotifyStatus() {
  try {
    const resp = await get('/api/config/notify-status')
    return resp.data || {}
  } catch (_) {
    return null
  }
}

module.exports = { ensureOwnerOrderNotifyReady, fetchNotifyStatus, PROMPT_KEY }
