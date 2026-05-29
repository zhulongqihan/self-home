// 用户模型
// 支持两种登录方式：1) openid 白名单 2) username + password
// 关键：openid 和 username 字段都 sparse + unique
// 重要：default 不设为 null，避免 sparse 索引把 null 当作"有值"
const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
  // openid 登录路径用（不设 default，未填则字段不存在，sparse 索引会忽略）
  openid: { type: String, unique: true, sparse: true, index: true },

  // 账号密码登录路径用
  username: { type: String, unique: true, sparse: true, index: true },
  password_hash: { type: String, select: false },

  role: {
    type: String,
    enum: ['customer', 'owner'],
    required: true
  },
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  coins: { type: Number, default: 0 },
  kiss_count_total: { type: Number, default: 0 },
  continuous_sign_days: { type: Number, default: 0 },
  last_sign_date: { type: String, default: '' },
  last_login_at: { type: Date, default: null },
  last_login_method: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users'
})

UserSchema.pre('validate', function (next) {
  if (!this.openid && !this.username) {
    return next(new Error('User 必须有 openid 或 username 之一'))
  }
  next()
})

module.exports = model('User', UserSchema)