const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const {
  raceSubscribeMessage,
  parseSubscribeResult
} = require(path.join(__dirname, '../../miniprogram/utils/subscribeCore.js'))

describe('raceSubscribeMessage', () => {
  it('resolves when requestFn returns quickly', async () => {
    const res = await raceSubscribeMessage(
      async () => ({ tmpl1: 'accept' }),
      ['tmpl1'],
      200
    )
    assert.equal(res.tmpl1, 'accept')
  })

  it('times out when requestFn never resolves', async () => {
    const res = await raceSubscribeMessage(
      () => new Promise(() => {}),
      ['tmpl1'],
      30
    )
    assert.equal(res.__timeout, true)
  })
})

describe('parseSubscribeResult', () => {
  it('timeout → ok false', () => {
    const r = parseSubscribeResult({ __timeout: true }, ['a'])
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'timeout')
  })

  it('accept → ok true', () => {
    const r = parseSubscribeResult({ x: 'accept' }, ['x'])
    assert.equal(r.ok, true)
  })
})
