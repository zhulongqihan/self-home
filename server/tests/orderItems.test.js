const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { mergeRawOrderItems } = require('../src/utils/orderItems')

describe('mergeRawOrderItems', () => {
  it('merges same product+specs+blind_free', () => {
    const r = mergeRawOrderItems([
      { product_id: 'abc', qty: 1, specs: ['少冰'], blind_free: false },
      { product_id: 'abc', qty: 2, specs: ['少冰'], blind_free: false }
    ])
    assert.equal(r.error, undefined)
    assert.equal(r.items.length, 1)
    assert.equal(r.items[0].qty, 3)
    assert.equal(r.items[0].blind_free, false)
  })

  it('keeps blind_free and paid lines separate', () => {
    const r = mergeRawOrderItems([
      { product_id: 'abc', qty: 1, specs: [], blind_free: true },
      { product_id: 'abc', qty: 1, specs: [], blind_free: false }
    ])
    assert.equal(r.items.length, 2)
    assert.equal(r.items.filter(i => i.blind_free).length, 1)
    assert.equal(r.items.filter(i => !i.blind_free).length, 1)
  })

  it('returns EMPTY_ITEMS for empty array', () => {
    assert.equal(mergeRawOrderItems([]).error, 'EMPTY_ITEMS')
  })

  it('returns INVALID_ITEM for bad qty', () => {
    assert.equal(mergeRawOrderItems([{ product_id: 'x', qty: 0 }]).error, 'INVALID_ITEM')
  })
})
