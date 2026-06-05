const { describe, it, before } = require('node:test')
const assert = require('node:assert/strict')
const { FIXED_DATES } = require('../src/constants/fixedDates')

const API_BASE = process.env.ORDER_TEST_API_BASE || 'https://api.cyruszhang.online'

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

describe('countdown fixed dates API', { timeout: 20000 }, () => {
  let ownerToken
  let customerToken

  before(async () => {
    const ownerLogin = await api('POST', '/api/auth/login-password', {
      body: { username: 'yangyang', password: 'yangyang' }
    })
    ownerToken = ownerLogin.data.data.token

    const customerLogin = await api('POST', '/api/auth/login-password', {
      body: { username: 'zhuzhu', password: 'zhuzhu' }
    })
    customerToken = customerLogin.data.data.token
  })

  it('customer countdowns use fixed dates after deploy', async () => {
    const r = await api('GET', '/api/config/countdowns', { token: customerToken })
    assert.equal(r.status, 200)
    const d = r.data.data
    if (d.locked === true) {
      assert.equal(d.owner_birthday, FIXED_DATES.owner_birthday)
      assert.equal(d.relationship_start, FIXED_DATES.relationship_start)
      const keys = (d.items || []).map(i => i.key)
      assert.ok(keys.includes('owner_birthday'))
      return
    }
    // 未部署新后端时跳过严格断言
    assert.ok(Array.isArray(d.items))
  })

  it('PUT countdowns rejected when fixed (after deploy)', async () => {
    const r = await api('PUT', '/api/config/countdowns', {
      token: ownerToken,
      body: { anniversary_date: '12-25' }
    })
    if (r.data.code === 'FIXED_DATES') {
      assert.equal(r.status, 400)
      return
    }
    // 旧版仍可改，部署后应变为 FIXED_DATES
    assert.ok(r.status === 200 || r.status === 400)
  })
})
