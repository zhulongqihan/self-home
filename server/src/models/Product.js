const { Schema, model } = require('mongoose')

const ProductSpecSchema = new Schema({
  name: { type: String, required: true, trim: true },
  options: { type: [String], default: [] }
}, { _id: false })

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  images: { type: [String], default: [] },
  image_style: {
    type: String,
    enum: ['chikawa', 'line_puppy', 'bubu', 'yier', 'custom'],
    default: 'line_puppy'
  },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  specs: { type: [ProductSpecSchema], default: [] },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['on_sale', 'off_sale'], default: 'on_sale', index: true },
  stock: { type: Number, default: 9999, min: 0 },
  sort_weight: { type: Number, default: 0, index: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'products'
})

ProductSchema.index({ category_id: 1, status: 1, sort_weight: -1, created_at: -1 })

module.exports = model('Product', ProductSchema)
