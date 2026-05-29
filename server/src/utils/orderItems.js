/** 合并下单行：相同 product_id + specs 合并数量 */
function mergeRawOrderItems(items) {
  const map = new Map()
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue
    const productId = String(raw.product_id || '')
    const specs = Array.isArray(raw.specs) ? raw.specs.map(s => String(s)) : []
    const specKey = specs.join('|')
    const key = `${productId}::${specKey}`
    const qty = Number(raw.qty)
    const addQty = Number.isInteger(qty) && qty >= 1 ? qty : NaN
    if (!productId || Number.isNaN(addQty)) {
      return { error: 'INVALID_ITEM' }
    }
    const prev = map.get(key)
    if (prev) prev.qty += addQty
    else {
      map.set(key, {
        product_id: productId,
        qty: addQty,
        specs,
        note: raw.note ? String(raw.note) : ''
      })
    }
  }
  const merged = [...map.values()]
  if (!merged.length) return { error: 'EMPTY_ITEMS' }
  return { items: merged }
}

function lineKey(item) {
  const specs = Array.isArray(item.specs) ? item.specs.join('|') : ''
  return `${item.product_id}::${specs}`
}

module.exports = { mergeRawOrderItems, lineKey }
