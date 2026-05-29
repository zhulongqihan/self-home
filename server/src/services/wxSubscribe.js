const axios = require('axios')
const env = require('../config')

let tokenCache = { access_token: '', expires_at: 0 }

async function getAccessToken() {
  if (tokenCache.access_token && Date.now() < tokenCache.expires_at - 60000) {
    return tokenCache.access_token
  }
  if (!env.wx.appid || !env.wx.appsecret) {
    throw Object.assign(new Error('未配置 WX_APPID / WX_APPSECRET'), { code: 'WX_CREDENTIALS_MISSING' })
  }
  const { data } = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
    params: {
      grant_type: 'client_credential',
      appid: env.wx.appid,
      secret: env.wx.appsecret
    },
    timeout: 8000
  })
  if (data.errcode) {
    throw new Error(`获取 access_token 失败：${data.errmsg}`)
  }
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 7200) * 1000
  }
  return tokenCache.access_token
}

/**
 * 发送订阅消息（需用户曾在小程序内授权对应 tmplId）
 * @returns {boolean} 是否发送成功
 */
async function sendSubscribeMessage({ openid, templateId, page, data }) {
  if (!openid || !templateId) return false
  try {
    const access_token = await getAccessToken()
    const { data: res } = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${access_token}`,
      {
        touser: openid,
        template_id: templateId,
        page: page || '',
        miniprogram_state: 'formal',
        lang: 'zh_CN',
        data: data || {}
      },
      { timeout: 8000 }
    )
    if (res.errcode === 0) return true
    console.warn('[wxSubscribe] send failed:', res.errcode, res.errmsg)
    return false
  } catch (err) {
    console.warn('[wxSubscribe] send error:', err.message)
    return false
  }
}

module.exports = { sendSubscribeMessage, getAccessToken }
