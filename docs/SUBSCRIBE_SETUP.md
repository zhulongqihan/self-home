# 订阅消息配置（服务器已部署代码，差公众平台模板）

## 当前服务器状态
- `couple-app` 已部署 v0.2.0 订阅消息逻辑
- `WX_APPID` / `WX_APPSECRET` 已配置
- **个人订阅模板列表为空**，需在微信公众平台手动添加（API 无法代你选类目开通）

## 一次性配置（约 5 分钟）

1. 打开 [微信公众平台](https://mp.weixin.qq.com) → **功能** → **订阅消息**
2. 添加 **2 个** 个人模板（按你账号里能搜到的为准，字段名接近即可）：
   - **店长 · 新订单**：含商品名、金额、时间类字段
   - **顾客 · 订单状态**：含状态、订单号、时间类字段
3. SSH 登录服务器执行：
   ```bash
   /opt/couple-app/scripts/sync_subscribe_templates.sh
   pm2 restart couple-app
   ```
   脚本会根据模板标题自动写入 `.env` 的 `WX_TEMPLATE_*`。

若自动匹配不准，可手动编辑 `/opt/couple-app/.env`：
```bash
WX_TEMPLATE_OWNER_NEW_ORDER=模板ID1
WX_TEMPLATE_CUSTOMER_ORDER_STATUS=模板ID2
```
然后 `pm2 restart couple-app`。

## 字段映射
若推送失败（47003 等），对照模板实际字段名修改 `server/src/services/orderNotify.js` 中的 `data` 键名。

## 验证
- 真机：顾客下单前点「允许」订阅
- 店长微信 openid 登录，进订单管理页授权
- 下单 / 改状态后应收到服务通知
