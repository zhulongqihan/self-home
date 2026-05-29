const CART_KEY = 'customer_cart'

function getCart() {
  const list = wx.getStorageSync(CART_KEY)
  return Array.isArray(list) ? list : []
}

function saveCart(list) {
  wx.setStorageSync(CART_KEY, Array.isArray(list) ? list : [])
}

function buildKey(productId, specs) {
  const specKey = Array.isArray(specs) ? specs.join('|') : ''
  return `${productId}::${specKey}`
}

function normalizeQty(qty) {
  const n = Number(qty)
  if (!Number.isInteger(n) || n < 1) return 1
  return n
}

function addToCart(item) {
  const list = getCart()
  const key = buildKey(item.product_id, item.specs)
  const addQty = normalizeQty(item.qty)
  const idx = list.findIndex(i => i.key === key)
  if (idx >= 0) {
    list[idx].qty += addQty
  } else {
    list.push({
      key,
      product_id: item.product_id,
      name: item.name,
      image: item.image || '',
      price: item.price,
      specs: Array.isArray(item.specs) ? item.specs : [],
      note: item.note || '',
      qty: addQty
    })
  }
  saveCart(list)
  return list
}

function updateQty(key, qty) {
  const list = getCart()
  const idx = list.findIndex(i => i.key === key)
  if (idx < 0) return list
  if (qty <= 0) list.splice(idx, 1)
  else list[idx].qty = normalizeQty(qty)
  saveCart(list)
  return list
}

function clearCart() {
  saveCart([])
}

function getCartStats() {
  const items = getCart()
  const count = items.reduce((sum, i) => sum + (i.qty || 0), 0)
  const totalPrice = items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0)
  return { items, count, totalPrice }
}

module.exports = { CART_KEY, getCart, saveCart, addToCart, updateQty, clearCart, getCartStats }
