# 任务 5：账号密码登录 + 混合鉴权 ✅ 已完成

## 目标
解决「openid 白名单配置麻烦」问题，实现「只用密码就能登录」+「无感 openid 登录」共存 + 「主动切换」。

## 主要 Agent
- 🔐 **Auth-Agent**：后端 bcrypt + JWT + 账号密码路由
- 🧑‍🍳 **Owner-Agent**：店长端密码登录 + 切换账号
- 👧 **Customer-Agent**：顾客端密码登录 + 切换账号

## 已完成的产出
- ✅ User 模型升级：username/password_hash（sparse 索引）
- ✅ POST /api/auth/login-password 路由（bcrypt 验证）
- ✅ 启动 seed：自动创建默认账号（yangyang/owner, zhuzhu/customer）
- ✅ utils/auth.js：loginByPassword + 统一登录态管理
- ✅ pages/launch/login：仅密码框（密码同时当 username）
- ✅ launch/index：openid 失败 → 直接跳密码登录页
- ✅ 两端首页：「切换账号」action sheet
- ✅ PRD v2.2 更新：鉴权机制章节

## 验收
- 详见 [`docs/acceptance/v0.1.5.md`](../acceptance/v0.1.5.md)

## 版本
- v0.1.5