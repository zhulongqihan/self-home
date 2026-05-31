# TASK 14 - 店长留言板（v0.3.4）

## API
- `GET /api/messages/latest`（顾客，最新一条）
- `GET /api/messages/owner`（店长历史，默认 30 条）
- `POST /api/messages`（店长发留言，content 必填，image 可选）
- `DELETE /api/messages/:id`（店长删除）

## 规则
- 顾客端展示**最新**留言；同一条只弹窗一次（本地 `message_seen_id`）
- 彩蛋开关 `eggs_switch.owner_daily_message` 为 false 时不展示（默认开）

## 前端
- 店长工作台 → 留言板：发布 + 历史 + 删除
- 顾客：厨房页有留言时顶部**弹幕卡片**飘过展示（悬浮，不占行；与商品加载解耦）
