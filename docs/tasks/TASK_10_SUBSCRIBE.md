# TASK 10 - 微信订阅消息推送（v0.2.0 · PRD 任务 9）

## 目标
顾客下单通知店长；店长改订单状态通知顾客（需用户曾在小程序内授权订阅）。

## 前置配置（微信公众平台）
1. 登录 [微信公众平台](https://mp.weixin.qq.com) → 订阅消息 → 选用模板
2. **店长模板**（新订单）：建议含「商品名称」「金额」「时间」类字段 → 复制模板 ID 到服务器 `.env` 的 `WX_TEMPLATE_OWNER_NEW_ORDER`
3. **顾客模板**（订单状态）：建议含「状态」「订单号」「时间」→ `WX_TEMPLATE_CUSTOMER_ORDER_STATUS`
4. 模板字段名须与 `server/src/services/orderNotify.js` 中 `thing1/amount2/...` 一致，不一致时按实际模板改 `data` 映射

## 后端
- `services/wxSubscribe.js` — access_token、发送订阅消息
- `services/orderNotify.js` — 新订单通知店长、状态变更通知顾客
- `GET /api/config/subscribe` — 返回当前角色 tmplIds
- 钩子：`POST /api/orders`、`PATCH /api/orders/:id/status`

## 前端
- `utils/subscribe.js` — `wx.requestSubscribeMessage`
- 顾客下单前（cart-bar）、店长进入订单管理页（onShow）请求授权

## 限制
- 仅 **微信 openid 登录** 用户可收推送；纯账号密码登录若无 openid 则跳过
- 用户须点「允许」订阅；拒绝则服务端发送会失败（静默，不影响下单）

## 部署
```bash
# 服务器 /opt/couple-app/.env 填入模板 ID 后
scp -r server/src/* root@118.31.221.81:/opt/couple-app/src/
ssh root@118.31.221.81 "pm2 restart couple-app"
```

## 验收
`docs/acceptance/v0.2.0.md`
