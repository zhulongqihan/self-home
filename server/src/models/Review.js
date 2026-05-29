const { Schema, model } = require('mongoose')

const ReviewSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  line_index: { type: Number, required: true, min: 0 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'reviews'
})

ReviewSchema.index({ order_id: 1, line_index: 1 }, { unique: true })

module.exports = model('Review', ReviewSchema)
