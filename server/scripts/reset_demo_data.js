#!/usr/bin/env node
/**
 * 清空测试订单、评价、亲亲记录，并重置顾客爱心币 / 签到 / 成就解锁
 * 用法（服务器）：cd /opt/couple-app && node scripts/reset_demo_data.js
 * 可选环境变量：CUSTOMER_COINS=200（重置后给顾客币数，默认 200）
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const mongoose = require('mongoose')

const Order = require('../src/models/Order')
const Review = require('../src/models/Review')
const KissEvent = require('../src/models/KissEvent')
const EmotionAlert = require('../src/models/EmotionAlert')
const BlindBoxShake = require('../src/models/BlindBoxShake')
const Achievement = require('../src/models/Achievement')
const User = require('../src/models/User')

const TAG = '[reset_demo_data]'
const CUSTOMER_COINS = Number(process.env.CUSTOMER_COINS ?? 200)

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/couple_app')

  const [orders, reviews, kisses, alerts, shakes, achievements] = await Promise.all([
    Order.deleteMany({}),
    Review.deleteMany({}),
    KissEvent.deleteMany({}),
    EmotionAlert.deleteMany({}),
    BlindBoxShake.deleteMany({}),
    Achievement.deleteMany({})
  ])

  const customer = await User.findOneAndUpdate(
    { role: 'customer' },
    {
      $set: {
        coins: CUSTOMER_COINS,
        kiss_count_total: 0,
        continuous_sign_days: 0,
        last_sign_date: ''
      }
    },
    { new: true }
  ).select('username nickname coins kiss_count_total')

  const owner = await User.findOneAndUpdate(
    { role: 'owner' },
    { $set: { coins: 0, kiss_count_total: 0 } },
    { new: true }
  ).select('username nickname coins')

  console.log(TAG, 'deleted', {
    orders: orders.deletedCount,
    reviews: reviews.deletedCount,
    kiss_events: kisses.deletedCount,
    emotion_alerts: alerts.deletedCount,
    blind_box_shakes: shakes.deletedCount,
    achievements: achievements.deletedCount
  })
  console.log(TAG, 'users', {
    customer: customer
      ? { username: customer.username, nickname: customer.nickname, coins: customer.coins }
      : null,
    owner: owner ? { username: owner.username, nickname: owner.nickname, coins: owner.coins } : null
  })

  await mongoose.disconnect()
}

main().catch(err => {
  console.error(TAG, err)
  process.exit(1)
})
