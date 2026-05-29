# 更新日志

## v0.1.8 - 任务 8：订单状态机 + 流转 API（2026-05-29）

### 后端
- `orderStatus` 服务：店长/顾客合法状态流转
- `GET /api/orders/owner/all`、`GET /api/orders/:id`
- `PATCH /api/orders/:id/status`、`PATCH /api/orders/:id/reply`

### 前端
- 店长订单管理：接单、推进、取消、备注
- 顾客订单：进度时间线、待接单取消、店长回复展示
- `request.patch`、共享 `utils/orderStatus.js`

## v0.1.7.1 - 多端适配与登录/工作台修复（2026-05-29）

### 修复
- 厨房悬浮购物车：修正 TabBar 高度计算，购物车条完整显示在 TabBar 上方（含金额与下单按钮）
- 登录页：暗号输入框与「进入店铺」按钮文字完整显示、居中；顾客登录后跳转欢迎页
- 店长工作台：「系统配置」可点击进入（欢迎页编辑）；商品/订单/数据看板标注后续任务
- PRD §2.4 新增多端适配红线

## v0.1.7 - 任务 7（UI）：顾客端 IA + 厨房点单页（2026-05-29）

### PRD
- 升级 v2.3：欢迎页、四 Tab、厨房布局、商品图占位策略

### 后端
- Config 扩展 welcome / tab_bar / discover_placeholder
- Product 增加 image_style；商品 API 返回 display_image
- GET /api/config/customer、GET/PUT /api/config/welcome

### 前端
- 欢迎页、厨房（左分类右列表 + 悬浮购物车）、发现占位、我的
- 自定义 TabBar（文案可配置）
- 店长设置页可编辑欢迎页

## v0.1.6 - 任务 6：商品分类 + 商品列表/详情 + 购物车 + 下单（2026-05-29）

### 后端新增
- `Category` / `Product` / `Order` 模型
- `GET /api/categories` 分类列表
- `GET /api/products` 商品列表（支持按分类过滤）
- `GET /api/products/:id` 商品详情
- `POST /api/orders` 创建订单
- `GET /api/orders/my` 我的订单
- 启动种子新增默认分类和演示商品

### 前端新增
- 顾客端商品列表页：分类横滑 + 双列商品卡
- 商品详情页：图片轮播、规格选择、数量选择、加入购物车/立即下单
- 购物车页：数量调整、配送方式、备注、提交订单
- 订单页：展示我的订单列表与状态
- 顾客首页入口从占位改为真实可点击跳转（商品/购物车）

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