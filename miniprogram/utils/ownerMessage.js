const { get } = require('./request.js')

const SEEN_MSG_KEY = 'message_seen_id'

/** 最新留言（字幕展示，不阻塞主流程） */
async function fetchLatestOwnerMessage() {
  try {
    const resp = await get('/api/messages/latest')
    const msg = resp.data
    if (!msg || !msg.content) return null
    return msg
  } catch (e) {
    console.warn('[ownerMessage] latest:', e.message || e)
    return null
  }
}

/** 未读留言（弹窗用，保留备用） */
async function fetchUnreadOwnerMessage() {
  const msg = await fetchLatestOwnerMessage()
  if (!msg || !msg.id) return null
  const seenId = wx.getStorageSync(SEEN_MSG_KEY)
  if (seenId === msg.id) return null
  return msg
}

function markOwnerMessageSeen(msg) {
  if (msg && msg.id) {
    wx.setStorageSync(SEEN_MSG_KEY, msg.id)
  }
}

module.exports = {
  SEEN_MSG_KEY,
  fetchLatestOwnerMessage,
  fetchUnreadOwnerMessage,
  markOwnerMessageSeen
}
