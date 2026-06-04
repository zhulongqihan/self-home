Page({
  data: {
    menus: [
      {
        key: 'general',
        icon: '🏪',
        title: '店铺与基础',
        desc: '店名、虚拟币、Tab、彩蛋总开关',
        url: '/pages/owner/settings/general/index'
      },
      {
        key: 'welcome',
        icon: '👋',
        title: '欢迎页',
        desc: '欢迎文案与图片',
        url: '/pages/owner/settings/welcome/index'
      },
      {
        key: 'countdowns',
        icon: '📅',
        title: '三大倒计时',
        desc: '在一起、纪念日、生日',
        url: '/pages/owner/settings/countdowns/index'
      },
      {
        key: 'weather',
        icon: '🌧️',
        title: '天气联动',
        desc: '雨天热饮专场',
        url: '/pages/owner/settings/weather/index'
      },
      {
        key: 'time-egg',
        icon: '⏰',
        title: '时段彩蛋',
        desc: '按时段 Banner',
        url: '/pages/owner/settings/time-egg/index'
      },
      {
        key: 'badges',
        icon: '🏅',
        title: '成就徽章',
        desc: '徽章规则与预览',
        url: '/pages/owner/settings/badges/index'
      },
      {
        key: 'blind-box',
        icon: '🎲',
        title: '摇一摇盲盒',
        desc: '从全店在售随机，摇中当日免费',
        url: '/pages/owner/settings/blind-box/index'
      },
      {
        key: 'password',
        icon: '🔐',
        title: '修改暗号',
        desc: '店长登录暗号',
        url: '/pages/owner/settings/password/index'
      }
    ]
  },

  onOpenMenu(e) {
    const url = e.currentTarget.dataset.url
    if (url) wx.navigateTo({ url })
  }
})
