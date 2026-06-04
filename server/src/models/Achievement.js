const { Schema, model } = require('mongoose')

const AchievementSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  badge_id: { type: String, required: true, index: true },
  unlocked_at: { type: Date, default: Date.now }
}, {
  collection: 'achievements'
})

AchievementSchema.index({ user_id: 1, badge_id: 1 }, { unique: true })

module.exports = model('Achievement', AchievementSchema)
