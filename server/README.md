# 后端服务（Node.js + Express + MongoDB）

> 自建后端，部署在已有阿里云服务器上，HTTPS 入口：`https://api.cyruszhang.online`

## 目录结构（任务 2 起逐步填充）
```
server/
├── src/
│   ├── app.js              # Express 应用入口
│   ├── config/             # 配置（环境变量、数据库）
│   ├── models/             # Mongoose 数据模型（对应 PRD 的 10 张表）
│   ├── routes/             # 路由（auth、products、orders、users 等）
│   ├── middlewares/        # 中间件（白名单鉴权、错误处理、日志）
│   ├── services/           # 业务逻辑
│   └── utils/              # 工具函数
├── tests/                  # 单元/集成测试
├── package.json
├── ecosystem.config.js     # PM2 进程管理配置
├── .env.example            # 环境变量模板（不含真实值）
└── README.md
```

## 部署架构
```
微信小程序 (顾客/店长)
       ↓ HTTPS
https://api.cyruszhang.online
       ↓ (主机 Nginx 443 反代)
http://127.0.0.1:3000  (Node.js / Express)
       ↓
MongoDB (本机 27017，仅本地访问)
```

## 启动方式（任务 2 后生效）
```bash
cd server
npm install
cp .env.example .env  # 填入真实配置
pm2 start ecosystem.config.js
```

## 数据备份
- 任务 16 会加自动备份脚本
- 手动备份：`mongodump --db couple_app --out /backup/$(date +%F)`