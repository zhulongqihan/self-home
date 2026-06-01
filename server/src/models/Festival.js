const { Schema, model } = require('mongoose')

const FestivalSchema = new Schema({
  name: { type: String, required: true, trim: true },
  date_type: { type: String, enum: ['fixed', 'lunar'], default: 'fixed' },
  date: { type: String, default: '' },
  banner: { type: String, default: '' },
  theme_color: { type: String, default: '#E8B86D' },
  product_ids: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  push_template: { type: String, default: '' },
  status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'festivals'
})

FestivalSchema.index({ status: 1, date: 1 })

module.exports = model('Festival', FestivalSchema)
