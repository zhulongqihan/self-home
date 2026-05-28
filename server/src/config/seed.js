// 启动种子：
// 0) 确保 users 集合的索引是 sparse（兼容 openid 或 username 二选一的设计）
// 1) 确保 config 单例存在，并把 .env 的白名单填入
// 2) 根据 .env 创建默认账号密码用户
const bcrypt = require('bcryptjs')
const Config = require('../models/Config')
const User = require('../models/User')
const env = require('./index')

/** 确保 users 集合的 openid / username 索引是 sparse + unique */
async function ensureIndexes() {
  const coll = User.collection
  const idx = await coll.indexes()

  async function rebuild(name, field) {
    const existing = idx.find(i => i.name === name)
    const needsRebuild = !existing || !existing.sparse
    if (needsRebuild) {
      if (existing) {
        try { await coll.dropIndex(name) } catch (e) { /* ignore */ }
      }
      await coll.createIndex({ [field]: 1 }, { unique: true, sparse: true, name })
      console.log(`[Seed] 重建索引 ${name}（unique + sparse）`)
    }
  }

  await rebuild('openid_1', 'openid')
  await rebuild('username_1', 'username')
}

async function seedConfig() {
  let cfg = await Config.findById('global')
  let created = false

  if (!cfg) {
    cfg = await Config.create({ _id: 'global' })
    created = true
    console.log('[Seed] Created global config doc')
  }

  let updated = false
  if (!cfg.whitelist.owner_openid && env.whitelist.owner) {
    cfg.whitelist.owner_openid = env.whitelist.owner
    updated = true
  }
  if (!cfg.whitelist.customer_openid && env.whitelist.customer) {
    cfg.whitelist.customer_openid = env.whitelist.customer
    updated = true
  }
  if (updated) await cfg.save()

  console.log('[Seed] Whitelist:',
    `owner=${cfg.whitelist.owner_openid ? 'set' : 'EMPTY'}`,
    `customer=${cfg.whitelist.customer_openid ? 'set' : 'EMPTY'}`
  )
  return { config: cfg, created }
}

async function seedDefaultAccounts() {
  const roles = ['owner', 'customer']
  for (const role of roles) {
    const acc = env.defaultAccounts[role]
    if (!acc.username || !acc.password) {
      console.log(`[Seed] 跳过 ${role} 默认账号（.env 未配置）`)
      continue
    }

    const existing = await User.findOne({ username: acc.username })
    if (existing) {
      console.log(`[Seed] ${role} 默认账号 ${acc.username} 已存在，跳过`)
      continue
    }

    const password_hash = await bcrypt.hash(acc.password, 10)
    await User.create({
      username: acc.username,
      password_hash,
      role,
      nickname: acc.nickname
    })
    console.log(`[Seed] ✅ 创建 ${role} 默认账号：${acc.username}`)
  }
}

async function runAll() {
  await ensureIndexes()
  await seedConfig()
  await seedDefaultAccounts()
}

module.exports = { ensureIndexes, seedConfig, seedDefaultAccounts, runAll }