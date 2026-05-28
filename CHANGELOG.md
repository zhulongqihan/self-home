# 更新日志

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