// 用户模型
const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
  openid: { type: String, required: true, unique: true, index: true },
  role: {
    type: String,
    enum: ['customer', 'owner'],
    required: true
  },
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  coins: { type: Number, default: 0 },
  continuous_sign_days: { type: Number, default: 0 },
  last_sign_date: { type: String, default: '' },  // YYYY-MM-DD
  last_login_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users'
})

module.exports = model('User', UserSchema)