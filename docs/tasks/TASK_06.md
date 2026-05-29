# 任务 6：商品分类 + 商品列表/详情 + 购物车 + 下单（待验收）

> ⚠️ 部署时只动 `/opt/couple-app/` + `pm2 restart couple-app`，勿碰 blog/agent Docker 与 80 端口。见 `server/README.md`「服务器共存红线」。

## 目标
打通顾客端从「浏览商品」到「提交订单」的主流程，完成第一个可用交易闭环。

## 本任务拆分
- 🗄️ **DB-Agent**：补齐 `categories` / `products` / `orders` 模型与默认种子
- ⚡ **Backend-Agent**：提供分类列表、商品列表、商品详情、创建订单、我的订单 API
- 👧 **Customer-Agent**：商品列表、商品详情、购物车、订单列表页面实现
- 🎨 **UI-Agent**：页面样式对齐暖阳主题视觉

## 预计改动
- `server/src/models/*`
- `server/src/routes/*`
- `server/src/config/seed.js`
- `server/src/app.js`
- `miniprogram/pages/customer/products/*`
- `miniprogram/pages/customer/cart/*`
- `miniprogram/pages/customer/orders/*`
- `miniprogram/pages/customer/index/*`
- `miniprogram/utils/cart.js`
