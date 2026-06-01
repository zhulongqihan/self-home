# TASK 16 · 全局配置后台（v0.3.6）

PRD Phase 2 #16

## 目标

店长在「系统设置」中可修改全局文案与开关，无需改代码或 `.env`。

## 后端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config/owner` | 店长读取全量可编辑配置 |
| PUT | `/api/config/owner` | 部分字段更新 |
| POST | `/api/auth/change-password` | 暗号登录用户修改自己的密码 |

可编辑字段：店铺名、昵称、虚拟币、营业状态、默认主题、Tab 文案、发现页占位、欢迎页、三大倒计时、彩蛋开关 `eggs_switch`。

## 前端（店长）

扩展 `pages/owner/settings/`：
- 店铺 / 虚拟币 / 营业与主题 / Tab / 发现页 / 彩蛋开关
- 欢迎页、倒计时（沿用）
- 修改暗号

保存后 `clearCached()` 刷新顾客端 UI 配置缓存。

## 本版不做

- 时段彩蛋文案编辑（Phase 3 #18）
- 全量 `text_templates` 按钮文案
- 主题色 HEX（沿用 `default` / `cloud` 双主题）

## 验收

见 `docs/acceptance/v0.3.6.md`
