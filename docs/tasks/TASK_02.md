# 任务 2：服务器装 MongoDB + Node 后端骨架 ✅ 已完成

## 目标
在阿里云服务器搭建后端运行环境：MongoDB + Node.js + PM2 + Express，让 `https://api.cyruszhang.online/api/health` 端到端可访问。

## 主要 Agent
- 🚀 **Ops-Agent**：MongoDB / PM2 安装、部署
- ⚡ **Backend-Agent**：Express 应用骨架

## 已完成的产出
- ✅ MongoDB 7.0.34（仅本机监听）
- ✅ PM2 7.0.1 全局
- ✅ `/opt/couple-app/` 部署目录
- ✅ Node 后端代码骨架（Express + Mongoose + 健康检查路由）
- ✅ PM2 进程守护，开机自启
- ✅ 公网 HTTPS 端到端验证通过

## 验收
- 详见 [`docs/acceptance/v0.1.2.md`](../acceptance/v0.1.2.md)

## 版本
- v0.1.2

## 关键命令速查
- 重启后端：`ssh root@118.31.221.81 'pm2 restart couple-app'`
- 看日志：`ssh root@118.31.221.81 'pm2 logs couple-app --lines 50'`
- 重新部署：本地改完代码 → `scp -r server/src/* root@118.31.221.81:/opt/couple-app/src/` → `pm2 restart couple-app`