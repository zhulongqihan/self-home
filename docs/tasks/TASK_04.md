# 任务 4：小程序前端入口路由 + 兜底页 ✅ 已完成

## 目标
前端完成自动登录 + 角色分流的完整链路，让真实的小程序界面第一次跑起来。

## 主要 Agent
- 🎨 **UI-Agent**：launch 加载页 + forbidden 兜底页 UI
- 👧 **Customer-Agent**：顾客首页升级
- 🧑‍🍳 **Owner-Agent**：店长工作台升级

## 已完成的产出
- ✅ utils/request.js - 统一 HTTPS 请求 + 自动 token + 401 自动跳启动页
- ✅ utils/auth.js - login/logout/verify/getter
- ✅ pages/launch/index - 启动加载页 + 自动 wx.login + 角色分流
- ✅ pages/launch/forbidden - 陌生人兜底（含 openid 显示 + 一键复制）
- ✅ 顾客首页 - 时段问候 + 状态卡 + 占位入口
- ✅ 店长工作台 - 4 宫格管理入口（点击占位）

## 验收
- 详见 [`docs/acceptance/v0.1.4.md`](../acceptance/v0.1.4.md)

## 版本
- v0.1.4