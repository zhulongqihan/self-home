const { Schema, model } = require('mongoose')

const BlindBoxShakeSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date_key: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  bonus_limit: { type: Number, default: 0 },
  reveals: {
    type: [{
      _id: false,
      product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
      product_name: String,
      created_at: { type: Date, default: Date.now }
    }],
    default: []
  }
}, {
  collection: 'blind_box_shakes'
})

BlindBoxShakeSchema.index({ user_id: 1, date_key: 1 }, { unique: true })

module.exports = model('BlindBoxShake', BlindBoxShakeSchema)
