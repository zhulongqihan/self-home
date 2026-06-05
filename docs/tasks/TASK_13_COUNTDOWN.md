# TASK 13 - 三大倒计时（v0.3.3）

## API
- `GET /api/config/countdowns`（顾客，含计算后的 `items`）
- `GET /api/config/countdowns/owner`（店长读配置）
- `PUT /api/config/countdowns`（店长改日期）

## 固定日期（`server/src/constants/fixedDates.js`，改后需部署）
| 字段 | 值 |
|------|-----|
| `relationship_start` | `2026-01-09` |
| `anniversary_date` | `01-09` |
| `customer_birthday` | `02-18` |
| `owner_birthday` | `10-25`（店长生日） |

## 展示规则
- **在一起**：起始日至今含首日天数
- **距纪念日 / 距生日**：距下一次该日期的天数（当天为 0）
- 顾客「我的」展示四项（含店长生日）

## 前端
- 顾客「我的」：卡片展示倒计时
- 店长「系统设置 → 我们的小日子」：只读查看，不可改
