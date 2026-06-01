# TASK 15 · 分类管理 + 节日管理后台（v0.3.5）

PRD Phase 2 #15

## 目标

店长可在小程序内维护商品分类与节日配置，为后续顾客端节日主题、专属菜单、推送打基础。

## 后端

### Category（已有模型，扩展 API）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 顾客：仅 `enabled` |
| GET | `/api/categories/owner/all` | 店长：全部 |
| POST | `/api/categories` | 新建 |
| PUT | `/api/categories/:id` | 更新 |
| PATCH | `/api/categories/:id/status` | 启用/停用 |
| DELETE | `/api/categories/:id` | 无商品时可删 |

字段：`name`, `icon`, `sort_order`, `status`, `festival_only`

### Festival（新模型 + API）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/festivals/owner/all` | 店长：全部 |
| POST | `/api/festivals` | 新建 |
| PUT | `/api/festivals/:id` | 更新 |
| PATCH | `/api/festivals/:id/status` | 启用/停用 |
| DELETE | `/api/festivals/:id` | 删除 |

字段：`name`, `date_type` (fixed/lunar), `date` (MM-DD), `banner`, `theme_color`, `product_ids[]`, `push_template`, `status`

## 前端（店长 + 顾客）

- 工作台新增 **分类管理**、**节日管理** 入口
- `pages/owner/categories/index` — 列表 + 新建/编辑表单
- `pages/owner/festivals/index` — 列表 + 新建/编辑，可勾选专属商品
- **顾客厨房**（本版补齐）：
  - `GET /api/festivals/active` — 今日节日 + 专属在售商品
  - 节日当天：顶栏 Banner / 主题色 + 列表顶部「专属菜单」
  - `festival_only` 分类仅节日当天对顾客可见

## 本版不做（留 Phase 3）

- 农历日期计算
- 订阅消息推送（push_template 仅存储）
- 发现页节日专题

## 验收

见 `docs/acceptance/v0.3.5.md`
