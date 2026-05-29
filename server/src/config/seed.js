// 启动种子：
// 0) 确保 users 集合的索引是 sparse（兼容 openid 或 username 二选一的设计）
// 1) 确保 config 单例存在，并把 .env 的白名单填入
// 2) 根据 .env 创建默认账号密码用户
const bcrypt = require('bcryptjs')
const Config = require('../models/Config')
const User = require('../models/User')
const Category = require('../models/Category')
const Product = require('../models/Product')
const { isDummyImage } = require('../utils/productImage')
const env = require('./index')

const DEFAULT_UI = {
  welcome: {
    text: '今天也要好好吃饭哦～',
    image_url: '/assets/welcome/default.png'
  },
  tab_bar: {
    kitchen: '厨房',
    orders: '订单',
    discover: '发现',
    profile: '我的'
  },
  discover_placeholder: {
    title: '发现',
    desc: '精彩内容筹备中，敬请期待～'
  }
}

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

  let uiUpdated = false
  if (!cfg.welcome || !cfg.welcome.text) {
    cfg.welcome = { ...DEFAULT_UI.welcome, ...(cfg.welcome || {}) }
    uiUpdated = true
  }
  if (!cfg.tab_bar || !cfg.tab_bar.kitchen) {
    cfg.tab_bar = { ...DEFAULT_UI.tab_bar, ...(cfg.tab_bar || {}) }
    uiUpdated = true
  }
  if (!cfg.discover_placeholder || !cfg.discover_placeholder.title) {
    cfg.discover_placeholder = { ...DEFAULT_UI.discover_placeholder, ...(cfg.discover_placeholder || {}) }
    uiUpdated = true
  }
  if (uiUpdated) await cfg.save()

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

async function seedCatalog() {
  const categoryCount = await Category.countDocuments()
  if (categoryCount > 0) {
    console.log('[Seed] 分类已存在，跳过默认分类和商品初始化')
    return
  }

  const categories = await Category.insertMany([
    { name: '🥤 饮品', icon: '🥤', sort_order: 10 },
    { name: '🍰 甜品零食', icon: '🍰', sort_order: 20 },
    { name: '🍱 正餐外卖', icon: '🍱', sort_order: 30 },
    { name: '💝 情绪服务', icon: '💝', sort_order: 40 }
  ])

  const map = categories.reduce((acc, item) => {
    acc[item.name] = item._id
    return acc
  }, {})

  const styles = ['line_puppy', 'chikawa', 'bubu', 'yier']
  await Product.insertMany([
    {
      name: '早安燕麦拿铁',
      category_id: map['🥤 饮品'],
      images: [],
      image_style: styles[0],
      description: '暖暖的一杯，帮你把困意都赶跑。',
      price: 18,
      specs: [{ name: '温度', options: ['热', '去冰', '少冰'] }, { name: '甜度', options: ['正常糖', '半糖', '无糖'] }],
      tags: ['今日推荐'],
      sort_weight: 100
    },
    {
      name: '晚安可可奶',
      category_id: map['🥤 饮品'],
      images: [],
      image_style: styles[1],
      description: '夜晚的温柔补给，喝完要早点睡哦。',
      price: 20,
      specs: [{ name: '温度', options: ['热', '温'] }],
      tags: ['夜猫子专区'],
      sort_weight: 90
    },
    {
      name: '草莓奶油小蛋糕',
      category_id: map['🍰 甜品零食'],
      images: [],
      image_style: styles[2],
      description: '心情低落时吃一口，甜度立刻回升。',
      price: 26,
      specs: [{ name: '蜡烛', options: ['不要', '要一根'] }],
      tags: ['治愈系'],
      sort_weight: 80
    },
    {
      name: '拥抱加急券',
      category_id: map['💝 情绪服务'],
      images: [],
      image_style: styles[3],
      description: '下单后 10 分钟内必须送达一个大抱抱。',
      price: 52,
      specs: [{ name: '抱抱力度', options: ['轻柔版', '超级用力版'] }],
      tags: ['立即兑现'],
      sort_weight: 120
    }
  ])
  console.log('[Seed] ✅ 初始化默认分类和商品完成')
}

/** 迁移已有商品的 dummyimage 为 image_style 占位 */
async function migrateProductImages() {
  const products = await Product.find({})
  let n = 0
  for (const p of products) {
    const first = p.images && p.images[0]
    if (first && isDummyImage(first)) {
      p.images = []
      if (!p.image_style || p.image_style === 'custom') p.image_style = 'line_puppy'
      await p.save()
      n++
    } else if (!p.image_style) {
      p.image_style = 'line_puppy'
      await p.save()
      n++
    }
  }
  if (n) console.log(`[Seed] 迁移商品图片占位 ${n} 条`)
}

async function runAll() {
  await ensureIndexes()
  await seedConfig()
  await seedDefaultAccounts()
  await seedCatalog()
  await migrateProductImages()
}

module.exports = { ensureIndexes, seedConfig, seedDefaultAccounts, seedCatalog, migrateProductImages, runAll }