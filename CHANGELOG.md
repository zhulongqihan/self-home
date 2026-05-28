# 更新日志

## v0.1.4 - 任务 4：小程序前端入口路由 + 兜底页（2026-05-28）

### 新增
- `miniprogram/utils/request.js` - 统一 HTTPS 请求封装（自动 token + 401 自动跳启动页）
- `miniprogram/utils/auth.js` - 鉴权工具
- `pages/launch/index` - 启动加载页（自动 wx.login → 后端鉴权 → 按角色分流）
- `pages/launch/forbidden` - 陌生人兜底页（含 openid 显示 + 一键复制）

### 变更
- `app.json` pages 数组首项改为 `pages/launch/index`（应用启动默认进此页）
- 顾客首页升级：时段问候 + 状态卡 + 占位入口（饮品/签到等）
- 店长工作台升级：4 宫格管理入口（商品/订单/数据/配置）
- 两端都加退出登录按钮

### 里程碑
**这是第一个能在微信开发者工具中"看到东西"的版本** 🎉
- 第一次小程序能完成完整的"启动 → 微信登录 → 后端鉴权 → 按角色分流到不同首页"全流程
- 陌生人会看到设计感的兜底页，并能复制 openid 给店长加白名单

---

## v0.1.3 - 任务 3：openid 白名单鉴权 + JWT（2026-05-28）

### 后端新增
- `User` 模型（openid 唯一索引、角色、虚拟币、签到字段）
- `Config` 模型（PRD §7-10 全局配置单例文档）
- `wxAuth` 服务：封装微信 code2session + JWT 签发/验证
- `requireAuth` / `requireRole` 鉴权中间件
- `POST /api/auth/login` - 完整登录链路
- `GET /api/auth/me` - 受保护的当前用户信息
- 启动种子：自动建 config 单例 + 从 .env 注入白名单
- 陌生人 403 响应带 `debug_openid` 字段（仅开发期，便于填白名单）

### 服务器侧
- /opt/couple-app/.env 填入 WX_APPID + WX_APPSECRET
- PM2 重启 → v0.1.3 上线

### 验证
- 假 code 调登录返回微信官方错误 → 证明 AppID/Secret 配置正确
- 所有错误码路径（NO_TOKEN / INVALID_TOKEN / MISSING_CODE / WX_LOGIN_FAILED / NOT_WHITELISTED）测试通过

---

## v0.1.2 - 任务 2：MongoDB + Node 后端骨架（2026-05-28）

### 服务器侧
- 安装 MongoDB 7.0.34（仅本机 127.0.0.1:27017 监听）
- 安装 PM2 7.0.1 全局
- 部署目录 `/opt/couple-app/`
- PM2 进程 `couple-app` 守护 + 开机自启
- 日志目录 `/var/log/couple-app/`

### 本地代码新增
- `server/package.json`（express/mongoose/helmet/cors/morgan/dotenv/jwt/axios）
- `server/ecosystem.config.js`（PM2 配置）
- `server/.env.example`（环境变量模板）
- `server/src/app.js`（Express 入口）
- `server/src/config/index.js`（环境变量）
- `server/src/config/db.js`（MongoDB 连接）
- `server/src/routes/health.js`（GET /api/health）
- `server/src/middlewares/errorHandler.js`（404 + 全局错误）

### 验证
- `https://api.cyruszhang.online/api/health` 端到端 OK，返回 `db: "connected"`

---

## v0.0.1 - 服务器 HTTPS + 项目结构整理（2026-05-28）

### 新增
- 主机 Nginx 配置：`api.cyruszhang.online` 子域名 HTTPS 反代到 Node 后端（`scripts/api_nginx.conf`）
- 博客 + Agent 域名 HTTPS 配置：根域名/www/blog/agent 共用同一张证书（`scripts/blog_https_nginx.conf`）
- Let's Encrypt 多域名证书自动续期脚本（`scripts/renew_cert.sh`）
- `server/` 目录与 README，准备 Node.js 后端
- `miniprogram/config/env.js`：API 基址配置

### 变更
- **PRD 升级到 v2.1**：技术栈从「微信云开发」改为「Node.js + Express + MongoDB 自建」（产品功能、UI、数据库设计均不变）
- AI 执行提示词适配新架构（新增 Backend-Agent / Ops-Agent，移除 Cloud-Agent）
- README 改写为反映自建后端架构

### 删除
- `cloud/` 整个目录（云开发已弃用）
- `miniprogram/app.json` 中的 `"cloud": true`
- `miniprogram/app.js` 中的 `wx.cloud.init()`
- `project.config.json` 中的 `cloudfunctionRoot`

### 移动
- `TASK_1.md` → `docs/tasks/TASK_01.md`

---

## v0.0.0 - 项目初始化（2026-05-28）

### 新增
- 微信小程序项目骨架（含 `app.js / app.json / app.wxss / sitemap.json`）
- 11 个页面占位（顾客端 6 + 店长端 5）
- 双主题系统（暖阳大地 / 云朵白）的 CSS 变量基础
- 通用工具函数 `utils/util.js`
- Git 仓库初始化 + GitHub 远程
- PRD v2.0 与 AI 多 Agent 开发指南