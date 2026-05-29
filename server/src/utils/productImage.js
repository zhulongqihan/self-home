const PLACEHOLDER_STYLES = ['chikawa', 'line_puppy', 'bubu', 'yier', 'custom']

function isDummyImage(url) {
  return typeof url === 'string' && url.includes('dummyimage.com')
}

/** 解析商品展示图：优先 images[0]（非 dummy），否则返回 image_style 供前端本地占位 */
function resolveProductDisplay(product) {
  const p = product && typeof product.toObject === 'function' ? product.toObject() : { ...product }
  const first = p.images && p.images[0]
  let display_image = ''
  if (first && !isDummyImage(first)) {
    display_image = first
  }
  let image_style = p.image_style || 'line_puppy'
  if (!PLACEHOLDER_STYLES.includes(image_style)) image_style = 'line_puppy'
  if (display_image) image_style = 'custom'
  return { ...p, display_image, image_style }
}

function enrichProducts(list) {
  return (list || []).map(resolveProductDisplay)
}

module.exports = { resolveProductDisplay, enrichProducts, isDummyImage, PLACEHOLDER_STYLES }
