const STYLE_EMOJI = {
  chikawa: '🐹',
  line_puppy: '🐶',
  bubu: '🧸',
  yier: '🐰',
  custom: '🖼️'
}

/** 内置风格暂无本地 png 资源，用 emoji 卡片占位，避免 image 加载失败呈空白 */
function getProductCover(product) {
  if (!product) return { url: '', emoji: '🍵' }
  const customUrl = product.display_image || (product.images && product.images[0])
  if (customUrl) {
    return { url: customUrl, emoji: STYLE_EMOJI[product.image_style] || '🍵' }
  }
  const style = product.image_style || 'line_puppy'
  return { url: '', emoji: STYLE_EMOJI[style] || '🍵' }
}

module.exports = { getProductCover, STYLE_EMOJI }
