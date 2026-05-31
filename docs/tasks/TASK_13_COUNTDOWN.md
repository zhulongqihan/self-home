# TASK 13 - 三大倒计时（v0.3.3）

## API
- `GET /api/config/countdowns`（顾客，含计算后的 `items`）
- `GET /api/config/countdowns/owner`（店长读配置）
- `PUT /api/config/countdowns`（店长改日期）

## 配置字段
- `relationship_start`：在一起起始日，`YYYY-MM-DD`
- `anniversary_date`：纪念日，`MM-DD`
- `customer_birthday`：顾客生日，`MM-DD`

## 展示规则
- **在一起**：起始日至今含首日天数
- **距纪念日 / 距生日**：距下一次该日期的天数（当天为 0）

## 前端
- 顾客「我的」：卡片展示三项（未配置则占位文案）
- 店长「系统设置」：编辑并保存三个日期
