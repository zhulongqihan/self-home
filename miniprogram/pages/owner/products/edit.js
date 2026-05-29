const { get, post, put } = require('../../../utils/request')

const IMAGE_STYLES = [
  { value: 'line_puppy', label: '线条小狗' },
  { value: 'chikawa', label: 'Chiikawa' },
  { value: 'bubu', label: '布布' },
  { value: 'yier', label: '一二' },
  { value: 'custom', label: '自定义 URL' }
]

function emptySpec() {
  return { name: '', options: '' }
}

Page({
  data: {
    id: '',
    isEdit: false,
    saving: false,
    categories: [],
    categoryIndex: 0,
    form: {
      name: '',
      price: '',
      description: '',
      stock: '9999',
      sort_weight: '0',
      image_style: 'line_puppy',
      image_url: ''
    },
    specs: [emptySpec()],
    styleIndex: 0,
    imageStyles: IMAGE_STYLES
  },

  onLoad(options) {
    const id = options.id || ''
    this.setData({ id, isEdit: !!id })
    this.init(id)
  },

  async init(id) {
    wx.showLoading({ title: '加载中' })
    try {
      const catResp = await get('/api/categories')
      const categories = catResp.data || []
      let form = this.data.form
      let categoryIndex = 0
      let styleIndex = 0
      let specs = [emptySpec()]

      if (id) {
        const resp = await get(`/api/products/${id}`)
        const p = resp.data || {}
        const idx = categories.findIndex(c => String(c._id) === String(p.category_id))
        categoryIndex = idx >= 0 ? idx : 0
        styleIndex = IMAGE_STYLES.findIndex(s => s.value === (p.image_style || 'line_puppy'))
        if (styleIndex < 0) styleIndex = 0
        form = {
          name: p.name || '',
          price: String(p.price ?? ''),
          description: p.description || '',
          stock: String(p.stock ?? 9999),
          sort_weight: String(p.sort_weight ?? 0),
          image_style: p.image_style || 'line_puppy',
          image_url: (p.images && p.images[0]) || p.display_image || ''
        }
        if (Array.isArray(p.specs) && p.specs.length) {
          specs = p.specs.map(s => ({
            name: s.name || '',
            options: (s.options || []).join('，')
          }))
        }
      }

      this.setData({ categories, categoryIndex, form, styleIndex, specs })
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onSpecInput(e) {
    const { index, field } = e.currentTarget.dataset
    this.setData({ [`specs[${index}].${field}`]: e.detail.value })
  },

  onAddSpec() {
    this.setData({ specs: [...this.data.specs, emptySpec()] })
  },

  onRemoveSpec(e) {
    const index = Number(e.currentTarget.dataset.index)
    const specs = this.data.specs.filter((_, i) => i !== index)
    this.setData({ specs: specs.length ? specs : [emptySpec()] })
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
  },

  onStyleChange(e) {
    const styleIndex = Number(e.detail.value)
    const image_style = IMAGE_STYLES[styleIndex].value
    this.setData({ styleIndex, 'form.image_style': image_style })
  },

  buildSpecsPayload() {
    return this.data.specs
      .filter(s => s.name && s.options)
      .map(s => ({
        name: s.name.trim(),
        options: s.options.split(/[,，]/).map(o => o.trim()).filter(Boolean)
      }))
      .filter(s => s.name && s.options.length)
  },

  buildPayload() {
    const { form, categories, categoryIndex } = this.data
    const cat = categories[categoryIndex]
    const images = form.image_url ? [form.image_url.trim()] : []
    const payload = {
      name: form.name.trim(),
      category_id: cat && cat._id,
      price: Number(form.price),
      description: form.description.trim(),
      stock: Number(form.stock) || 0,
      sort_weight: Number(form.sort_weight) || 0,
      image_style: form.image_style,
      images,
      specs: this.buildSpecsPayload()
    }
    if (images.length) payload.image_style = 'custom'
    return payload
  },

  async onSave() {
    if (this.data.saving) return
    const { form, isEdit, id } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写名称', icon: 'none' })
      return
    }
    if (!form.price || Number(form.price) < 0) {
      wx.showToast({ title: '请填写有效价格', icon: 'none' })
      return
    }

    const payload = this.buildPayload()
    if (!payload.category_id) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中' })
    try {
      if (isEdit) {
        await put(`/api/products/${id}`, payload)
      } else {
        await post('/api/products', payload)
      }
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 500)
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ saving: false })
    }
  }
})
