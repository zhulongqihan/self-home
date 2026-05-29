# 任务 7（UI）：顾客端 IA + 厨房点单页（v0.1.7）

> PRD v2.3 · 依赖任务 6 后端下单 API

## 目标
将顾客端改为：欢迎页 → 四 Tab（厨房/订单/发现/我的），厨房页参考点单小程序布局（左分类右商品 + 悬浮购物车）。

## 主要 Agent
- 👧 **Customer-Agent**：welcome / kitchen / discover / custom-tab-bar / cart 组件
- ⚡ **Backend-Agent**：config API、Product.image_style、display_image
- 🧑‍🍳 **Owner-Agent**：settings 欢迎页轻量编辑

## 产出
- PRD v2.3
- `GET /api/config/customer`、`PUT /api/config/welcome`
- 顾客端新页面与自定义 TabBar
- 店长欢迎页配置表单

## 版本
- v0.1.7

## 部署
仅 `scp server/src/*` + `pm2 restart couple-app`，勿碰 blog/agent Docker。
