const { Schema, model } = require('mongoose')

const KissEventSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  collection: 'kiss_events'
})

module.exports = model('KissEvent', KissEventSchema)
