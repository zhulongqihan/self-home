const { Schema, model } = require('mongoose')

const OrderItemSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  product_image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
  specs: { type: [String], default: [] },
  note: { type: String, default: '' }
}, { _id: false })

const OrderSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [OrderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  total_price: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'delivering', 'delivered', 'to_review', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  delivery_type: { type: String, default: '本人配送' },
  customer_note: { type: String, default: '' },
  owner_reply: { type: String, default: '' },
  status_history: {
    type: [{
      _id: false,
      status: String,
      changed_at: Date,
      note: String
    }],
    default: []
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'orders'
})

module.exports = model('Order', OrderSchema)
