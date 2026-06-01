# TASK 17 · 天气联动（v0.3.7）

PRD Phase 3 #17

## 目标

雨天时顾客厨房置顶「热饮专场」，由和风天气 API + 彩蛋开关 `weather_link` 控制。

## 后端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/weather/kitchen` | 雨天状态 + 热饮商品列表 |

- 依赖 `.env` 的 `QWEATHER_KEY`（和风开发版）
- 城市：`config.weather.city_id` 或 `WEATHER_CITY_ID` 默认
- 30 分钟内存缓存，控制 API 用量
- 热饮识别：标签 `热饮`、温度规格含「热/温」、饮品分类关键词
- `config.weather.simulate_rainy`：店长验收用模拟雨天

## 前端

- 厨房：雨天顶栏 + 「☔ 热饮专场」商品区
- 系统设置：城市 ID、Banner 文案、模拟雨天开关

## 验收

见 `docs/acceptance/v0.3.7.md`
