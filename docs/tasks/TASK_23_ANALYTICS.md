# TASK 23 · 数据看板（v0.3.12）

PRD Phase 3 #23

## 目标

店长端数据看板：Top10、30 日趋势、心情曲线、累计消费、情绪预警摘要。

## 后端

`GET /api/analytics/owner/dashboard`

- summary：30 日订单/消费/均分/亲亲/情绪单
- top_products：销量 Top10
- monthly_trend：30 日订单量与消费额
- mood_curve：评价均分与条数
- emotion_alert_pending：未处理预警

## 前端

- 工作台入口启用
- `pages/owner/analytics` 滚动看板 + 简易柱状图

## 验收

`docs/acceptance/v0.3.12.md`
