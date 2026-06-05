const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { FIXED_DATES, applyFixedDates } = require('../src/constants/fixedDates')
const { buildCountdownItems } = require('../src/services/countdown')

describe('FIXED_DATES', () => {
  it('has expected memorial dates and owner birthday 10-25', () => {
    assert.equal(FIXED_DATES.relationship_start, '2026-01-09')
    assert.equal(FIXED_DATES.anniversary_date, '01-09')
    assert.equal(FIXED_DATES.customer_birthday, '02-18')
    assert.equal(FIXED_DATES.owner_birthday, '10-25')
  })

  it('applyFixedDates overrides db values', () => {
    const merged = applyFixedDates({
      relationship_start: '2099-01-01',
      anniversary_date: '12-31',
      customer_birthday: '12-31',
      owner_birthday: '01-01'
    })
    assert.equal(merged.relationship_start, FIXED_DATES.relationship_start)
    assert.equal(merged.owner_birthday, '10-25')
  })

  it('buildCountdownItems includes owner birthday row', () => {
    const items = buildCountdownItems(
      applyFixedDates({ owner_nickname: '小羊', customer_nickname: '宝宝' })
    )
    const keys = items.map(i => i.key)
    assert.ok(keys.includes('together'))
    assert.ok(keys.includes('anniversary'))
    assert.ok(keys.includes('birthday'))
    assert.ok(keys.includes('owner_birthday'))
    const ownerRow = items.find(i => i.key === 'owner_birthday')
    assert.match(ownerRow.label, /小羊/)
  })
})
