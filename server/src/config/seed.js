// 启动种子：确保 config 单例文档存在，并把 .env 的白名单填入
const Config = require('../models/Config')
const env = require('./index')

async function seedConfig() {
  let cfg = await Config.findById('global')
  let created = false

  if (!cfg) {
    cfg = await Config.create({ _id: 'global' })
    created = true
    console.log('[Seed] Created global config doc')
  }

  // 只有当数据库里白名单为空、且 .env 里有值时才注入（不覆盖店长后台改过的值）
  let updated = false
  if (!cfg.whitelist.owner_openid && env.whitelist.owner) {
    cfg.whitelist.owner_openid = env.whitelist.owner
    updated = true
  }
  if (!cfg.whitelist.customer_openid && env.whitelist.customer) {
    cfg.whitelist.customer_openid = env.whitelist.customer
    updated = true
  }
  if (updated) {
    await cfg.save()
    console.log('[Seed] Whitelist injected from .env')
  }

  console.log('[Seed] Whitelist status:',
    `owner=${cfg.whitelist.owner_openid ? 'set' : 'EMPTY'}`,
    `customer=${cfg.whitelist.customer_openid ? 'set' : 'EMPTY'}`
  )

  return { config: cfg, created }
}

module.exports = { seedConfig }