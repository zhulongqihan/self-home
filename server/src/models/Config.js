// 全局配置模型（PRD §7-10）
// 单例：始终只有一个 _id = 'global' 的文档
const { Schema, model } = require('mongoose')

const ConfigSchema = new Schema({
  _id: { type: String, default: 'global' },

  // 基本信息（可后台改）
  store_name: { type: String, default: '我们的小窝' },
  owner_nickname: { type: String, default: '店长' },
  customer_nickname: { type: String, default: '宝宝' },
  currency_name: { type: String, default: '爱心币' },
  currency_emoji: { type: String, default: '💋' },

  // 白名单
  whitelist: {
    owner_openid: { type: String, default: '' },
    customer_openid: { type: String, default: '' }
  },

  // 纪念日 / 生日（MM-DD 格式，例如 "02-18"）
  anniversary_date: { type: String, default: '' },
  owner_birthday: { type: String, default: '' },
  customer_birthday: { type: String, default: '' },

  // 营业状态
  store_status: { type: String, enum: ['open', 'closed'], default: 'open' },
  default_theme: { type: String, enum: ['default', 'cloud'], default: 'default' },

  // 时段彩蛋
  time_easter_eggs: {
    type: [{
      _id: false,
      start: String,    // "07:00"
      end: String,      // "10:00"
      banner: String,
      text: String,
      enabled: Boolean
    }],
    default: []
  },

  // 倒计时
  countdowns: {
    type: [{
      _id: false,
      name: String,
      date: String,    // MM-DD
      enabled: Boolean
    }],
    default: []
  },

  // 彩蛋开关
  eggs_switch: {
    type: Map,
    of: Boolean,
    default: {}
  },

  // v2.3 欢迎页
  welcome: {
    text: { type: String, default: '今天也要好好吃饭哦～' },
    image_url: { type: String, default: '/assets/welcome/default.png' }
  },

  // v2.3 底部 Tab 文案
  tab_bar: {
    kitchen: { type: String, default: '厨房' },
    orders: { type: String, default: '订单' },
    discover: { type: String, default: '发现' },
    profile: { type: String, default: '我的' }
  },

  // v2.3 发现页占位
  discover_placeholder: {
    title: { type: String, default: '发现' },
    desc: { type: String, default: '精彩内容筹备中，敬请期待～' }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'config'
})

module.exports = model('Config', ConfigSchema)