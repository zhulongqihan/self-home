const User = require('../models/User')

async function getBalance(userId) {
  const user = await User.findById(userId).select('coins role').lean()
  if (!user) return null
  return user
}

async function adjustCoins(userId, delta) {
  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { coins: delta } },
    { new: true }
  ).select('coins')
  if (!updated || updated.coins < 0) {
    await User.findByIdAndUpdate(userId, { $inc: { coins: -delta } })
    return null
  }
  return updated.coins
}

module.exports = { getBalance, adjustCoins }
