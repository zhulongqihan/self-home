# TASK 08 - 订单状态机 + 状态流转 API（v0.1.8）

## 目标
实现 PRD 任务 7：订单 7 段状态机、后端流转 API、店长/顾客订单 UI。

## 后端
- `server/src/services/orderStatus.js` — 流转规则
- `GET /api/orders/owner/all` — 店长订单列表
- `GET /api/orders/:id` — 订单详情（含 next_statuses）
- `PATCH /api/orders/:id/status` — 变更状态
- `PATCH /api/orders/:id/reply` — 店长备注

## 前端
- `miniprogram/utils/orderStatus.js` — 文案与 formatOrder
- `miniprogram/utils/request.js` — 新增 `patch`
- `pages/owner/orders/*` — 店长订单管理
- `pages/customer/orders/*` — 时间线 + 取消
- `pages/owner/index` — 订单入口可点击

## 部署
```bash
scp -r server/src/* root@118.31.221.81:/opt/couple-app/src/
ssh root@118.31.221.81 "pm2 restart couple-app"
```

## 验收
见 `docs/acceptance/v0.1.8.md`
