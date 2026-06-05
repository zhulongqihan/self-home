const { get } = require('./request')
const {
  DEFAULT_SUBSCRIBE_TIMEOUT_MS,
  raceSubscribeMessage,
  parseSubscribeResult
} = require('./subscribeCore')

/**
 * 拉起微信订阅消息授权（用户拒绝不抛错）
 * 须在 wx.showLoading 之前调用，否则真机可能永不回调而卡住下单
 */
async function requestSubscribeByRole() {
  try {
    const resp = await get('/api/config/subscribe')
    const tmplIds = (resp.data && resp.data.tmplIds) || []
    if (!tmplIds.length) return { ok: false, reason: 'no_template' }
    const res = await raceSubscribeMessage(
      ids => wx.requestSubscribeMessage({ tmplIds: ids }),
      tmplIds,
      DEFAULT_SUBSCRIBE_TIMEOUT_MS
    )
    return parseSubscribeResult(res, tmplIds)
  } catch (err) {
    return { ok: false, reason: err.errMsg || err.message }
  }
}

module.exports = { requestSubscribeByRole }
