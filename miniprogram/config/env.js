// 环境配置 - 后端 API 基址
// 微信小程序「服务器域名」白名单需添加此域名
// 配置入口：mp.weixin.qq.com → 开发管理 → 开发设置 →服务器域名 → request 合法域名

const ENV = {
  development: {
    API_BASE: 'https://api.cyruszhang.online'
  },
  production: {
    API_BASE: 'https://api.cyruszhang.online'
  }
}

// 默认 production；开发期可在此切换
module.exports = ENV.production