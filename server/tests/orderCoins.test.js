const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { insufficientCoinsMessage } = require(
  path.join(__dirname, '../../miniprogram/utils/orderCoins.js')
)

describe('insufficientCoinsMessage', () => {
  it('returns null when total is 0 (blind free)', () => {
    assert.equal(insufficientCoinsMessage(0, 12), null)
  })

  it('returns null when coins unknown', () => {
    assert.equal(insufficientCoinsMessage(52, null), null)
  })

  it('blocks when 52 > 12 (experience bug case)', () => {
    const msg = insufficientCoinsMessage(52, 12)
    assert.match(msg, /还差 40 币/)
    assert.match(msg, /余额不足/)
  })

  it('allows when balance enough', () => {
    assert.equal(insufficientCoinsMessage(18, 20), null)
  })
})
