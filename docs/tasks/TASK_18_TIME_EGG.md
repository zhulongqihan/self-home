# TASK 18 · 时段彩蛋（v0.3.8）

PRD Phase 3 #18

## 目标

按上海时区当前时段，在顾客厨房展示可配置的 Banner / 文案专区。

## 后端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/time-eggs/kitchen` | 当前生效时段（含预览） |

- 配置：`config.time_easter_eggs[]`（start/end/banner/text/enabled）
- 彩蛋开关：`eggs_switch.time_easter_egg`
- 预览：`config.time_egg.preview_index`（-1=自动，0+=强制某条）
- 启动 seed：若为空则写入 4 条默认时段

## 前端

- 店长系统设置：时段 CRUD + 预览选择 + 保存
- 顾客厨房：金色时段 Banner 条（在天气/节日之上）

## 验收

见 `docs/acceptance/v0.3.8.md`
