// 集中读取环境变量
require('dotenv').config()

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '127.0.0.1',
  nodeEnv: process.env.NODE_ENV || 'production',

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/couple_app'
  },

  wx: {
    appid: process.env.WX_APPID || '',
    appsecret: process.env.WX_APPSECRET || ''
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  },

  whitelist: {
    owner: process.env.OWNER_OPENID || '',
    customer: process.env.CUSTOMER_OPENID || ''
  },

  defaultAccounts: {
    owner: {
      username: process.env.OWNER_USERNAME || '',
      password: process.env.OWNER_PASSWORD || '',
      nickname: process.env.OWNER_NICKNAME || '店长'
    },
    customer: {
      username: process.env.CUSTOMER_USERNAME || '',
      password: process.env.CUSTOMER_PASSWORD || '',
      nickname: process.env.CUSTOMER_NICKNAME || '宝宝'
    }
  }
}

module.exports = config