#!/usr/bin/env node
/**
 * 注入一单情绪类订单 + 预警记录（联调用，无需连测 3 天）
 * 用法：cd /opt/couple-app && node scripts/seed_emotion_alert_demo.js
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const mongoose = require('mongoose')

const Order = require('../src/models/Order')
const User = require('../src/models/User')
const Product = require('../src/models/Product')
const Category = require('../src/models/Category')
const EmotionAlert = require('../src/models/EmotionAlert')
const Config = require('../src/models/Config')

const TAG = '[seed_emotion_alert_demo]'
const MARKER = 'emotion_alert_demo'

async function findEmotionProduct() {
  const categories = await Category.find({ status: 'enabled' }).lean()
  const emotionCatIds = categories
    .filter(c => /情绪|撒娇/.test(c.name || ''))
    .map(c => c._id)
  const products = await Product.find({ status: 'on_sale' }).lean()
  for (const p of products) {
    if (emotionCatIds.some(id => String(id) === String(p.category_id))) return p
  }
  return null
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/couple_app')
  const customer = await User.findOne({ role: 'customer' })
  const product = await findEmotionProduct()
  if (!customer || !product) {
    console.error(TAG, '缺少顾客或情绪商品')
    process.exit(1)
  }

  await Order.deleteMany({ customer_note: MARKER })
  await EmotionAlert.deleteMany({})

  const now = new Date()
  const order = await Order.create({
    user_id: customer._id,
    items: [{
      product_id: product._id,
      product_name: product.name,
      product_image: (product.images && product.images[0]) || '',
      price: product.price,
      qty: 1,
      specs: [],
      note: ''
    }],
    total_price: product.price,
    status: 'pending',
    delivery_type: '本人配送',
    customer_note: MARKER,
    status_history: [{ status: 'pending', changed_at: now, note: 'demo' }],
    created_at: now,
    updated_at: now
  })

  await EmotionAlert.create({
    order_id: order._id,
    items: [{ product_name: product.name, qty: 1 }],
    dismissed: false,
    created_at: now
  })

  const cfg = await Config.findById('global')
  if (cfg) {
    if (!cfg.emotion_alert) cfg.emotion_alert = {}
    cfg.emotion_alert.simulate_active = false
    cfg.emotion_alert.simulate_dismissed = false
    cfg.markModified('emotion_alert')
    await cfg.save()
  }

  console.log(TAG, 'OK', { order_id: String(order._id), product: product.name })
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(TAG, err)
  process.exit(1)
})
