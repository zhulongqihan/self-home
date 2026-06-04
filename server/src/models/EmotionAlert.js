const { Schema, model } = require('mongoose')

const EmotionAlertItemSchema = new Schema({
  product_name: { type: String, default: '' },
  qty: { type: Number, default: 1 }
}, { _id: false })

const EmotionAlertSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
  items: { type: [EmotionAlertItemSchema], default: [] },
  dismissed: { type: Boolean, default: false, index: true },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  collection: 'emotion_alerts'
})

module.exports = model('EmotionAlert', EmotionAlertSchema)
