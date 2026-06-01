const Config = require('../models/Config')
const Category = require('../models/Category')
const Product = require('../models/Product')
const env = require('../config')
const { resolveEggSwitch } = require('../constants/eggSwitches')
const { enrichProducts } = require('../utils/productImage')
const { enrichListWithStats } = require('../services/productStats')

const CACHE_TTL_MS = 30 * 60 * 1000
const cache = new Map()

/** 和风 icon 300–313、400–499 等为降水/雨雪类 */
function isRainyCondition(icon, text) {
  const code = parseInt(icon, 10)
  if (!Number.isNaN(code)) {
    if (code >= 300 && code <= 313) return true
    if (code >= 400 && code <= 499) return true
  }
  const t = String(text || '')
  return /雨|雪|冻/.test(t)
}

async function fetchQWeatherNow(cityId) {
  const key = env.weather.qweatherKey
  if (!key || !cityId) return null

  const cacheKey = `now:${cityId}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data

  const url = `https://devapi.qweather.com/v7/weather/now?location=${encodeURIComponent(cityId)}&key=${encodeURIComponent(key)}`
  const resp = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!resp.ok) return null
  const body = await resp.json()
  if (body.code !== '200' || !body.now) return null

  const data = {
    text: body.now.text || '',
    icon: body.now.icon || '',
    temp: body.now.temp || '',
    is_rainy: isRainyCondition(body.now.icon, body.now.text)
  }
  cache.set(cacheKey, { at: Date.now(), data })
  return data
}

function isHotDrinkProduct(product, categoryName) {
  const tags = product.tags || []
  if (tags.some(t => /热饮|hot/i.test(String(t)))) return true

  for (const spec of product.specs || []) {
    if (/温度|temp/i.test(spec.name || '')) {
      const opts = spec.options || []
      if (opts.some(o => /热|温/.test(String(o)))) return true
    }
  }

  const name = `${product.name || ''}${product.description || ''}`
  if (/饮品|🥤/.test(categoryName || '') && /拿铁|可可|奶茶|热|粥|姜/.test(name)) return true
  return false
}

async function loadHotDrinkProducts() {
  const products = await Product.find({ status: 'on_sale' })
    .sort({ sort_weight: -1, created_at: -1 })
    .lean()
  const catIds = [...new Set(products.map(p => String(p.category_id)).filter(Boolean))]
  const categories = await Category.find({ _id: { $in: catIds } }).lean()
  const catMap = categories.reduce((acc, c) => {
    acc[String(c._id)] = c.name || ''
    return acc
  }, {})

  const hot = products.filter(p => isHotDrinkProduct(p, catMap[String(p.category_id)]))
  return enrichListWithStats(enrichProducts(hot))
}

function resolveCityId(cfg) {
  const w = (cfg && cfg.weather) || {}
  return String(w.city_id || env.weather.defaultCityId || '').trim()
}

async function getKitchenWeatherContext() {
  const cfg = await Config.findById('global')
  const enabled = resolveEggSwitch(cfg && cfg.eggs_switch, 'weather_link')
  const weatherCfg = (cfg && cfg.weather) || {}
  const banner = weatherCfg.banner_text || '下雨天，来杯热饮暖暖手～'
  const cityId = resolveCityId(cfg)
  const cityName = weatherCfg.city_name || ''

  if (!enabled) {
    return { enabled: false, active: false, is_rainy: false, banner, city_name: cityName, text: '', products: [] }
  }

  let now = null
  if (weatherCfg.simulate_rainy) {
    now = { text: '小雨（模拟）', icon: '305', temp: '', is_rainy: true }
  } else if (env.weather.qweatherKey && cityId) {
    now = await fetchQWeatherNow(cityId)
  }

  const isRainy = !!(now && now.is_rainy)
  let products = []
  if (isRainy) {
    products = await loadHotDrinkProducts()
  }

  return {
    enabled: true,
    active: isRainy,
    is_rainy: isRainy,
    text: now ? now.text : '',
    temp: now ? now.temp : '',
    banner,
    city_name: cityName,
    products
  }
}

module.exports = {
  isRainyCondition,
  getKitchenWeatherContext,
  isHotDrinkProduct
}
