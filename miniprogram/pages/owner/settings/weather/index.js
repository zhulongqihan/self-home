const { get, put } = require('../../../../utils/request.js')

Page({
  data: {
    loading: true,
    saving: false,
    weatherCityId: '',
    weatherCityName: '',
    weatherBanner: '',
    weatherSimulateRainy: false
  },

  async onLoad() { await this.fetchConfig() },

  async fetchConfig() {
    this.setData({ loading: true })
    try {
      const weather = ((await get('/api/config/owner')).data || {}).weather || {}
      this.setData({
        loading: false,
        weatherCityId: weather.city_id || '',
        weatherCityName: weather.city_name || '',
        weatherBanner: weather.banner_text || '下雨天，来杯热饮暖暖手～',
        weatherSimulateRainy: !!weather.simulate_rainy
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  onInputWeatherCityId(e) { this.setData({ weatherCityId: e.detail.value }) },
  onInputWeatherCityName(e) { this.setData({ weatherCityName: e.detail.value }) },
  onInputWeatherBanner(e) { this.setData({ weatherBanner: e.detail.value }) },
  onToggleWeatherSimulate(e) { this.setData({ weatherSimulateRainy: e.detail.value }) },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await put('/api/config/owner', {
        weather: {
          city_id: this.data.weatherCityId.trim(),
          city_name: this.data.weatherCityName.trim(),
          banner_text: this.data.weatherBanner.trim(),
          simulate_rainy: this.data.weatherSimulateRainy
        }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
