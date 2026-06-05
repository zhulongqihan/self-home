const DEFAULT_SUBSCRIBE_TIMEOUT_MS = 6000

/**
 * 订阅消息授权加超时，避免真机无回调时永久挂起
 * @param {function(string[]): Promise<object>} requestFn - 如 wx.requestSubscribeMessage
 */
function raceSubscribeMessage(requestFn, tmplIds, timeoutMs = DEFAULT_SUBSCRIBE_TIMEOUT_MS) {
  return Promise.race([
    requestFn(tmplIds),
    new Promise(resolve => {
      setTimeout(() => resolve({ __timeout: true }), timeoutMs)
    })
  ])
}

function parseSubscribeResult(res, tmplIds) {
  if (!res || res.__timeout) return { ok: false, reason: 'timeout' }
  const accepted = tmplIds.some(id => res[id] === 'accept')
  return { ok: accepted, res, reason: accepted ? undefined : 'rejected' }
}

module.exports = {
  DEFAULT_SUBSCRIBE_TIMEOUT_MS,
  raceSubscribeMessage,
  parseSubscribeResult
}
