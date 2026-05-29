const STYLE_EMOJI = {
  chikawa: '🐹',
  line_puppy: '🐶',
  bubu: '🧸',
  yier: '🐰'
}

const STYLE_PLACEHOLDER = {
  chikawa: '/assets/placeholders/chikawa.png',
  line_puppy: '/assets/placeholders/line_puppy.png',
  bubu: '/assets/placeholders/bubu.png',
  yier: '/assets/placeholders/yier.png'
}

function getProductCover(product) {
  if (!product) return { url: '', emoji: '🍵' }
  if (product.display_image) {
    return { url: product.display_image, emoji: '' }
  }
  const style = product.image_style || 'line_puppy'
  const local = STYLE_PLACEHOLDER[style]
  if (local) return { url: local, emoji: STYLE_EMOJI[style] || '🍵' }
  return { url: '', emoji: STYLE_EMOJI[style] || '🍵' }
}

module.exports = { getProductCover, STYLE_EMOJI }
