const { post } = require('../../../../utils/request.js')

Page({
  data: {
    saving: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  },

  onInputCurrentPassword(e) { this.setData({ currentPassword: e.detail.value }) },
  onInputNewPassword(e) { this.setData({ newPassword: e.detail.value }) },
  onInputConfirmPassword(e) { this.setData({ confirmPassword: e.detail.value }) },

  async onSave() {
    if (this.data.saving) return
    const { currentPassword, newPassword, confirmPassword } = this.data
    if (!currentPassword || !newPassword) {
      wx.showToast({ title: '请填写当前暗号和新暗号', icon: 'none' })
      return
    }
    if (newPassword.length < 4) {
      wx.showToast({ title: '新暗号至少 4 位', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次新暗号不一致', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      })
      this.setData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      wx.showToast({ title: '暗号已更新', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '修改失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
