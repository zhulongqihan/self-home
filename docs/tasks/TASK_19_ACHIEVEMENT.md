# TASK 19 · 成就徽章（v0.3.9）

PRD Phase 3 #19

## 目标

顾客「我的」页展示成就徽章墙；店长可配置徽章与触发条件；行为达标自动解锁。

## 后端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/achievements/wall` | 顾客徽章墙（含进度） |

- 配置：`config.badges[]`（id/name/emoji/description/trigger/threshold/hidden/enabled）
- 预览：`config.achievement.preview_all`（验收用，显示全部已解锁样式）
- 彩蛋开关：`eggs_switch.achievement_badges`
- 数据：`achievements` 集合（user_id + badge_id + unlocked_at）
- 触发类型：`sign_in_days` | `kiss_total` | `order_count`
- 解锁钩子：签到、亲亲、下单
- 连签 30 天额外 +50 币（PRD 签到规则补全）

## 前端

- 店长系统设置：徽章 CRUD + 预览全部解锁
- 顾客我的：徽章墙（已解锁高亮 / 隐藏未解锁 ???）

## 验收

见 `docs/acceptance/v0.3.9.md`
