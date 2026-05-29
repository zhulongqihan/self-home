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

## 服务器共存红线（blog / agent 零影响）

同一台 ECS 上还跑着 **博客 Docker 栈** 和 **agent**（经博客 nginx 按域名分流）。小程序后端必须与之隔离，**禁止**误动 blog/agent。

| 服务 | 域名 | 运行方式 | 端口 |
|------|------|----------|------|
| 小程序 API | `api.cyruszhang.online` | 主机 PM2 `couple-app` | `127.0.0.1:3000` |
| 博客 | `cyruszhang.online` / `www` / `blog` | Docker `myblog-*` | 公网 **80**（容器） |
| Agent | `agent.cyruszhang.online` | 同上，Docker 内分流 | 经 80 → 主机 Nginx 443 反代 |

### 允许的操作（仅小程序）
```bash
# 只同步后端代码目录
scp -r server/src/* root@118.31.221.81:/opt/couple-app/src/

# 只重启 couple-app（不要 pm2 restart all / delete all）
ssh root@118.31.221.81 'pm2 restart couple-app'

# 只看小程序日志
ssh root@118.31.221.81 'pm2 logs couple-app --lines 50 --nostream'
```

### 禁止的操作
- ❌ `docker stop/start/restart` 任何 `myblog-*` 容器（除非用户明确要求续证书等）
- ❌ 修改 `/etc/nginx/conf.d/blog.cyruszhang.online.conf` 或占用 **80** 端口
- ❌ `systemctl restart nginx` 无必要时不做；若必须改 Nginx，**只动** `api.cyruszhang.online.conf`
- ❌ `mongod` 全局配置、重启 MongoDB 服务（小程序用本库 `couple_app`，与 blog MySQL 无关）
- ❌ `pm2 restart all`、删除非 `couple-app` 进程

### 部署后自检（可选）
```bash
curl -sS -o /dev/null -w "api:%{http_code} blog:%{http_code} agent:%{http_code}\n" \
  https://api.cyruszhang.online/api/health \
  https://blog.cyruszhang.online/ \
  https://agent.cyruszhang.online/
```
期望均为 `200`（或业务正常状态码）。