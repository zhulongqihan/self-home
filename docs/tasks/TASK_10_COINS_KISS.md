# TASK 10 - 虚拟币 + 亲亲（v0.3.0）

## API
- `GET /api/coins/me`
- `POST /api/coins/kiss`（顾客，+1 币，防刷）
- `GET /api/coins/owner/kiss-stats?days=7`
- `POST /api/orders` 扣币；`pending` 取消退回

## 数据
- `kiss_events` 集合
- `users.kiss_count_total`

## 前端
- 我的页：余额、亲亲、币单位
- 购物车/下单展示「X 币」
- 店长工作台：7 日亲亲统计

## 通知
- 复用「订单受理」模板通知店长（内容：宝宝亲了你一下）
