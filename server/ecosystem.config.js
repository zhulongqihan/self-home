// PM2 配置
module.exports = {
  apps: [
    {
      name: 'couple-app',
      script: 'src/app.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      out_file: '/var/log/couple-app/out.log',
      error_file: '/var/log/couple-app/err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
}