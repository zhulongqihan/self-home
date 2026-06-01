#!/usr/bin/env node
/** 一次性修复：暗号改密后 username 未同步导致的登录失败 */
require('dotenv').config({ path: process.env.ENV_FILE || require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const path = require('path')

async function main() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI missing')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const col = mongoose.connection.collection('users')

  const junk = await col.find({ role: 'owner' }).toArray()
  console.log('before:', junk.map(u => ({ username: u.username, hasHash: !!u.password_hash })))

  await col.deleteMany({
    role: 'owner',
    $or: [
      { password_hash: { $exists: false } },
      { password_hash: null },
      { username: { $exists: false } },
      { username: null }
    ]
  })

  const good = await col.findOne({ role: 'owner', username: 'yangyang', password_hash: { $exists: true } })
  if (good) {
    await col.updateOne({ _id: good._id }, { $set: { username: 'yangyang1' } })
    console.log('renamed yangyang -> yangyang1')
  } else {
    const withHash = await col.findOne({ role: 'owner', password_hash: { $exists: true, $ne: null } })
    if (withHash) {
      await col.updateOne({ _id: withHash._id }, { $set: { username: 'yangyang1' } })
      console.log('set username yangyang1 on', withHash._id)
    }
  }

  const after = await col.find({ role: 'owner' }).toArray()
  console.log('after:', after.map(u => ({ username: u.username, hasHash: !!u.password_hash })))
  await mongoose.disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
