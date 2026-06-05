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

## 正式号模板 ID（2026-05）
| 用途 | 标题 | priTmplId |
|------|------|-----------|
| 顾客 · 状态变更 | 订单状态变更通知 | `_W9d_GK9FWVUlA-HJAsQZF-kocqduzLQGHS8GD8_LFo` |
| 店长 · 新订单 | 订单受理通知 | `0c751SIxGUBLEjhchR5geQp9puxLD1x0qAZguc-PUs8` |

## 字段映射（已与公众平台对齐）
- **订单受理通知**：`character_string1` 订单号、`amount2` 金额、`thing3` 内容、`time4` 时间、`thing5` 备注
- **订单状态变更通知**：`phrase3` 状态、`amount4` 金额、`thing5` 温馨提示、`time12` 下单时间

若推送失败（47003 等），对照模板实际字段名修改 `server/src/services/orderNotify.js` 中的 `data` 键名。

## 亲亲通知（v0.3.0）
复用「订单受理通知」模板，字段示例：内容为「宝宝亲了你一下」。顾客需微信 openid 登录且曾授权订阅。

## 验证（新订单通知店长）

1. **店长**用**自己的微信**打开体验版（暗号 `yangyang` 即可，进工作台会自动绑定 openid）
2. 弹出「开启新订单微信提醒」→ 点 **去开启** → 微信弹窗选 **允许**（模板：订单受理通知）
3. 让她下一单测试 → 你微信应收到 **服务通知**
4. 若曾点过「拒绝」：微信 → 发现 → 小程序 → 本小程序 → 设置 → 订阅消息 → 打开

**说明**：通知发给**店长**，与顾客是否点订阅无关；顾客订阅只用于「订单状态变更」通知她。

## 常见错误码
| errcode | 含义 |
|---------|------|
| 43101 | 未授权或已拒绝订阅 → 店长重新点允许 |
| 47003 | 模板字段名不匹配 → 对照 `orderNotify.js` 改 data 键名 |

## 服务器
`.env` 建议包含：
```bash
WX_MINIPROGRAM_STATE=trial   # 体验版必须 trial，正式版用 formal
```
