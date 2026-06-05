/**
 * 下单 API 集成测试（默认打线上，可用 ORDER_TEST_API_BASE 覆盖）
 * 不创建成功扣款订单：仅测余额不足、空购物车、订阅配置
 */
const { describe, it, before } = require('node:test')
const assert = require('node:assert/strict')

const API_BASE = process.env.ORDER_TEST_API_BASE || 'https://api.cyruszhang.online'
const CUSTOMER_USER = process.env.ORDER_TEST_USER || 'zhuzhu'
const CUSTOMER_PASS = process.env.ORDER_TEST_PASS || 'zhuzhu'

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

describe('order submit API integration', { timeout: 30000 }, () => {
  let token
  let coins
  let expensiveProductId

  before(async () => {
    const login = await api('POST', '/api/auth/login-password', {
      body: { username: CUSTOMER_USER, password: CUSTOMER_PASS }
    })
    assert.equal(login.status, 200, `login failed: ${JSON.stringify(login.data)}`)
    token = login.data.data.token

    const me = await api('GET', '/api/coins/me', { token })
    assert.equal(me.status, 200)
    coins = me.data.data.coins

    const products = await api('GET', '/api/products?status=on_sale', { token })
    assert.equal(products.status, 200)
    const list = products.data.data || []
    const expensive = list.find(p => p.price > coins) || list.find(p => p.name && p.name.includes('拥抱'))
    assert.ok(expensive, 'need at least one product for insufficient-coins test')
    expensiveProductId = expensive._id
  })

  it('GET /api/config/subscribe returns tmplIds for customer', async () => {
    const r = await api('GET', '/api/config/subscribe', { token })
    assert.equal(r.status, 200)
    assert.ok(Array.isArray(r.data.data.tmplIds))
    assert.ok(r.data.data.tmplIds.length > 0, 'production should have subscribe template')
  })

  it('POST /api/orders rejects empty items', async () => {
    const r = await api('POST', '/api/orders', {
      token,
      body: { items: [], delivery_type: '本人配送' }
    })
    assert.equal(r.status, 400)
    assert.equal(r.data.code, 'EMPTY_ITEMS')
  })

  it('POST /api/orders rejects when coins insufficient (52 vs 12 scenario)', async () => {
    const r = await api('POST', '/api/orders', {
      token,
      body: {
        items: [{ product_id: expensiveProductId, qty: 1, specs: [], note: '' }],
        delivery_type: '本人配送',
        customer_note: '支持先赊着。'
      }
    })
    assert.equal(r.status, 400)
    assert.equal(r.data.code, 'INSUFFICIENT_COINS')
    assert.match(r.data.message, /余额不足/)
  })

  it('frontend coin guard would block same cart total', () => {
    const path = require('node:path')
    const { insufficientCoinsMessage } = require(
      path.join(__dirname, '../../miniprogram/utils/orderCoins.js')
    )
    const products = [{ price: 52 }]
    const total = products.reduce((s, p) => s + p.price, 0)
    const msg = insufficientCoinsMessage(total, coins)
    if (total > coins) {
      assert.ok(msg, 'client should block before showLoading')
    }
  })
})
