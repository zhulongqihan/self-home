const { Schema, model } = require('mongoose')

const CategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
  festival_only: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'categories'
})

CategorySchema.index({ sort_order: 1, created_at: 1 })

module.exports = model('Category', CategorySchema)
