# 任务 3：openid 白名单鉴权 + JWT ✅ 已完成

## 目标
后端实现微信小程序登录链路：code → openid → 白名单判断 → JWT 签发，并提供受保护路由。

## 主要 Agent
- 🗄️ **DB-Agent**：User / Config Mongoose 模型
- ⚡ **Backend-Agent**：wxAuth 服务、JWT 中间件、auth 路由
- 🚀 **Ops-Agent**：填入 WX_APPID/SECRET 到服务器 .env

## 已完成的产出
- ✅ `User` / `Config` 模型
- ✅ `wxAuth` 服务：code2session + JWT 签发验证
- ✅ `requireAuth` / `requireRole` 中间件
- ✅ `POST /api/auth/login` + `GET /api/auth/me`
- ✅ 启动 seed 自动建 config 单例
- ✅ 服务器 .env 已填 AppID/Secret
- ✅ 假 code 测试返回微信官方拒绝（证明真接通了微信）

## 验收
- 详见 [`docs/acceptance/v0.1.3.md`](../acceptance/v0.1.3.md)

## 版本
- v0.1.3

## 关键设计：陌生人调登录时返回 debug_openid
为方便首次登录时拿 openid 填白名单，陌生人的 403 响应里会带 `debug_openid` 字段。任务 4 上线小程序后，第一次你和女朋友登录会看到对方的真实 openid，填回 .env 即可。
**注意**：上线后应在 routes/auth.js 中移除 debug_openid 字段。

## 关键运维
- 改 .env 后必须重启：`pm2 restart couple-app`
- 看日志：`pm2 logs couple-app --lines 30 --nostream`