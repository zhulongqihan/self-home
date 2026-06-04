# TASK 22 · 情绪预警（v0.3.11）

PRD Phase 3 #22

## 目标

顾客**每下一单**情绪类商品 → 店长 **微信订阅消息** + 工作台弹窗（无需连续多天）。

## 识别

- 分类名含「情绪」「撒娇」
- 或标签含：情绪 / 撒娇 / emo / 生气 / 治愈

## 后端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/emotion-alert/status` | 最新未处理预警 |
| POST | `/api/emotion-alert/dismiss` | `{ order_id }` 知道了 |

- 下单 `POST /api/orders` 含情绪商品 → `handleEmotionOrderPlaced` + `notifyOwnerEmotionOrder`
- 数据：`emotion_alerts` 集合
- 彩蛋：`emotion_alert`；模拟：`config.emotion_alert.simulate_active`

## 前端

- 工作台弹窗 + 顶栏；进入时 `requestSubscribeMessage`
- 系统设置 → 情绪预警（模拟开关）

## 验收

`docs/acceptance/v0.3.11.md`
