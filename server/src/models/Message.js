const { Schema, model } = require('mongoose')

const MessageSchema = new Schema({
  content: { type: String, required: true, maxlength: 300 },
  image: { type: String, default: '' },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  collection: 'messages'
})

module.exports = model('Message', MessageSchema)
