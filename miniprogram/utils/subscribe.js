const { get } = require('./request')

/**
 * 拉起微信订阅消息授权（用户拒绝不抛错）
 * 需在下单/接单前调用，服务端才能推送
 */
async function requestSubscribeByRole() {
  try {
    const resp = await get('/api/config/subscribe')
    const tmplIds = (resp.data && resp.data.tmplIds) || []
    if (!tmplIds.length) return { ok: false, reason: 'no_template' }
    const res = await wx.requestSubscribeMessage({ tmplIds })
    const accepted = tmplIds.some(id => res[id] === 'accept')
    return { ok: accepted, res }
  } catch (err) {
    return { ok: false, reason: err.errMsg || err.message }
  }
}

module.exports = { requestSubscribeByRole }
