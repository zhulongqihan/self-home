/**
 * 下单前余额校验（纯函数，便于单元测试）
 * @returns {string|null} 不足时返回提示文案，否则 null
 */
function insufficientCoinsMessage(totalPrice, coins) {
  const total = Number(totalPrice)
  if (!Number.isFinite(total) || total <= 0) return null
  if (coins == null || coins === '') return null
  const balance = Number(coins)
  if (!Number.isFinite(balance)) return null
  if (total > balance) {
    const gap = total - balance
    return `余额不足（还差 ${gap} 币），去「我的」签到或亲亲攒币吧`
  }
  return null
}

module.exports = { insufficientCoinsMessage }
