const env = require('./index')

const WEAK_JWT_SECRETS = new Set(['', 'change-me-in-production', 'changeme'])

function assertProductionSecrets() {
  if (env.nodeEnv !== 'production') return

  const secret = env.jwt.secret
  if (WEAK_JWT_SECRETS.has(secret) || (secret && secret.length < 32)) {
    throw new Error(
      '[Config] 生产环境必须设置至少 32 位的 JWT_SECRET（.env），禁止使用默认值'
    )
  }
}

module.exports = { assertProductionSecrets }
