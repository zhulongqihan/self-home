const { post } = require('./request')

/** 暗号登录后把当前微信 openid 绑到账号（订阅推送必需） */
function bindWxOpenid() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) {
          return reject(new Error('wx.login 未返回 code'))
        }
        post('/api/auth/bind-wx', { code: res.code })
          .then(body => resolve(body.data || {}))
          .catch(reject)
      },
      fail(err) {
        reject(new Error(err.errMsg || 'wx.login 失败'))
      }
    })
  })
}

module.exports = { bindWxOpenid }
