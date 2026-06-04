# TASK 20 · 摇一摇盲盒（v0.3.10）

PRD Phase 3 #20

## 目标

顾客摇一摇随机揭晓隐藏商品；池内商品不出现在常规厨房菜单。

## 后端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/blind-box/kitchen` | 盲盒状态、剩余次数 |
| POST | `/api/blind-box/shake` | 摇一摇开奖 |

- 配置：`config.blind_box`（title/hint/button_text/daily_limit/product_ids/simulate_shake）
- 彩蛋开关：`eggs_switch.shake_blind_box`
- 数据：`blind_box_shakes`（每日次数 + 揭晓记录）
- 顾客商品列表排除盲盒池 ID
- 连签 7 天额外 +1 次摇盒机会

## 前端

- 店长系统设置：盲盒文案 + 商品池勾选
- 顾客厨房：顶栏提示 + 悬浮摇盒按钮 + 开盒弹窗加购

## 验收

见 `docs/acceptance/v0.3.10.md`
