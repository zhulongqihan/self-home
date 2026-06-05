const User = require('../models/User')
const Config = require('../models/Config')
const env = require('../config')

/** 解析店长 openid：用户表 → 全局白名单 → .env */
async function resolveOwnerOpenid() {
  const ownerUser = await User.findOne({ role: 'owner', openid: { $exists: true, $ne: '' } })
    .select('openid')
    .lean()
  if (ownerUser && ownerUser.openid) return ownerUser.openid

  const cfg = await Config.findById('global').select('whitelist').lean()
  if (cfg && cfg.whitelist && cfg.whitelist.owner_openid) {
    return cfg.whitelist.owner_openid
  }
  return env.whitelist.owner || ''
}

module.exports = { resolveOwnerOpenid }
