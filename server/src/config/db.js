// MongoDB 连接管理
const mongoose = require('mongoose')
const config = require('./index')

mongoose.set('strictQuery', true)

async function connect() {
  try {
    await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false  // 索引由我们手工或 syncIndexes 管理，避免 schema 与 DB 不一致时崩溃
    })
    console.log('[DB] MongoDB connected:', config.mongo.uri)
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message)
    throw err
  }
}

function isConnected() {
  return mongoose.connection.readyState === 1
}

module.exports = { connect, isConnected, mongoose }