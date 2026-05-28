# 📄 情侣专属点单小程序 - 需求文档 v2.2（公开版）

> ⚠️ **本文档为项目最高标准与最终执行红线**
> - 任何开发实现必须严格遵循本文档
> - 任何变更需在本文档显式更新后才能执行
> - 本文档优先级高于一切临时讨论与口头约定
>
> 📌 个人信息相关字段（店铺名、用户昵称、纪念日、生日等）已用占位符表示，
> 实际值在本地 `PRD_PRIVATE.md` 维护，或在小程序后台「系统配置」中填写。

---

## 一、项目概述

### 1.1 项目信息
| 项 | 内容 |
|---|---|
| 店铺名 | `<STORE_NAME>`（后台可配） |
| 顾客 | `<CUSTOMER_NICKNAME>`（后台可配） |
| 店长 | `<OWNER_NICKNAME>`（后台可配） |
| 纪念日 | `<ANNIVERSARY_DATE>`（MM-DD 格式，后台可配） |
| 顾客生日 | `<CUSTOMER_BIRTHDAY>`（MM-DD 格式，后台可配） |
| 店长生日 | `<OWNER_BIRTHDAY>`（MM-DD 格式，后台可配） |
| 货币单位 | `<CURRENCY_NAME>`（后台可配，emoji 任选） |

### 1.2 定位
仿主流饮品店（喜茶/瑞幸/Manner）小程序风格，UI 现代清爽，承载情侣专属点单互动。所有内容均可后台配置，无需改代码。

---

## 二、视觉规范

### 2.1 双主题（用户可切换）

| 主题 | 主色 | 辅色 | 背景 | 卡片 | 文字 |
|---|---|---|---|---|---|
| 🌞 **暖阳大地**（默认） | `#E8B86D` 暖黄 | `#C9986A` 大地棕 | `#FDF6EC` 奶白底 | `#FFFFFF` | `#3D2C1E` 深棕 |
| ☁️ **云朵白** | `#FFFFFF` 纯白 | `#E8B86D` 暖黄点缀 | `#F8F8F8` 浅灰底 | `#FFFFFF` | `#222222` 近黑 |

- 切换入口：个人中心 → 设置 → 主题
- 早上 6-18 点自动暖阳，夜晚 18 点后自动云朵白（可关闭）

### 2.2 UI 风格参考
- **布局**：参考瑞幸/喜茶——顶部 Banner + 横滑分类 + 双列商品瀑布流
- **圆角**：12-16px 大圆角卡片
- **字体**：阿里巴巴普惠体 Round
- **图标素材**：用户自选可爱 IP 风格资源（可后台替换）
- **动效**：下单撒爱心、状态变更弹通知、签到摇金币

### 2.3 素材使用注意
⚠️ **版权红线**：若使用任何第三方 IP 形象素材，仅限个人非商用，**严禁上架公开商店、严禁商业化**，通过体验版长期使用。

---

## 三、用户与权限

### 3.1 三种身份
| 角色 | 入口 | 权限 |
|---|---|---|
| 👧 顾客 | openid 白名单 | 浏览、下单、签到、评价 |
| 🧑‍🍳 店长 | openid 白名单 | 全部 + 后台管理 |
| 🚫 陌生人 | - | 兜底页"店铺暂未营业" |

### 3.2 鉴权机制（v2.2 新增账号密码兜底）

#### 双登录路径
**1) openid 自动登录（首选）**
- 小程序调用 `wx.login()` → 拿 code
- code 发给后端 `POST /api/auth/login`
- 后端用 code 调微信 `code2session` 接口换 openid
- 后端比对 `config.whitelist` 表中的 openid → 判断角色
- 颁发 JWT token，前端缓存

**2) 账号密码登录（兜底 + 主动切换）**
- 用户在 `pages/launch/login` 输入暗号（密码同时当 username）
- 调 `POST /api/auth/login-password`
- 后端用 bcrypt 比对 `users.password_hash`
- 颁发 JWT token

#### 自动分流策略
- 启动 → 优先尝试 openid 自动登录 → 不在白名单 → 自动跳暗号登录页
- 首页提供「切换账号」入口 → 跳暗号登录页（清除当前 token）
- 首页提供「退出登录」入口 → 清除 token + 回启动页重新自动登录

#### 默认账号
- 部署时通过 `.env` 的 `OWNER_USERNAME/PASSWORD` + `CUSTOMER_USERNAME/PASSWORD` 配置
- 启动 seed 自动创建（密码用 bcrypt hash 存储）
- 任务 16 提供「系统配置」后台修改密码入口

#### 鉴权红线
- 密码必须 bcrypt 哈希后再存数据库（永不存明文）
- JWT_SECRET 用 `openssl rand -base64 48` 生成
- 白名单和默认账号都存于数据库 `users` / `config` 表（不写死代码）

---

## 四、功能模块

### 4.1 顾客端

#### 🏠 首页
- 顶部：店铺 Logo + "营业中 🟢" / "店长打盹中 💤"
- Banner 轮播（**后台可配**）
- 快捷入口：每日签到、心情急救、今日推荐
- 横滑分类 Tab + 双列商品瀑布流

**时段彩蛋（后台可开关 & 改文案）**
| 时段 | 首页主题 |
|---|---|
| 07:00-10:00 | 早安特调专区 |
| 11:30 | 饭饭时间到啦 |
| 14:00-17:00 | 下午茶时间 |
| 18:00 | 晚饭点啥子 |
| 23:00 后 | 夜猫子安抚专区 |

#### 🛍️ 商品分类（全部后台可增删改）
默认预置 8 大分类：
1. 🥤 饮品  2. 🍰 甜品零食  3. 🍱 正餐外卖  4. 💝 情绪服务
5. 😤 撒娇专区  6. 🎁 神秘盲盒  7. ✨ 节日限定  8. 💰 长期承诺卡

#### 📦 商品详情
- 多图轮播、名称、甜系描述、虚拟货币定价
- 规格选择（冰度/甜度等，**后台自定义**）
- 备注栏（小作文专区）
- 立即下单（爱心粒子动画）

#### 🛒 购物车 & 下单
配送方式：本人配送 / 外卖代下 / 视频陪伴 / 立即兑现

#### 📋 订单中心
**状态机**：`待接单 → 已接单 → 制作中 → 配送中 → 已送达 → 待评价 → 已完成`（可取消）
- 状态时间轴、店长备注、5 星评价 + 表情包

#### 👤 个人中心
- 自定义昵称
- 会员等级：**永远顶级"宇宙第一可爱 VVVVVIP"**
- 💋 虚拟货币余额、历史订单、成就徽章墙
- **三大倒计时**：在一起 X 天 / 距纪念日 / 距顾客生日
- 店长每日留言、主题切换

#### 🎰 每日签到
- 每天 +2 虚拟币
- 连续 7 天 +10 + 抽盲盒
- 连续 30 天 +50 + 解锁隐藏徽章

---

### 4.2 店长端

| 模块 | 功能 |
|---|---|
| 🧑‍🍳 工作台 | 待办红点、今日订单、趋势、快捷入口 |
| 🛍️ 商品管理 | CRUD、规格、库存、标签、排序、批量上下架 |
| 📦 订单管理 | 接单、改状态、回复备注、取消 |
| 📂 分类管理 | CRUD、图标、排序、节日关联 |
| 🎊 节日管理 | 预置节日 + 自定义、Banner、主题色、专属菜单、推送 |
| 📣 主动推送 | 自定义推送、定时推送、模板管理 |
| 💬 留言板 | 每日一句、历史查看 |
| 📊 数据看板 | Top10、月度趋势、心情曲线、累计消费、情绪预警 |
| ⚙️ 系统配置 | 全局所有可配置项（见下） |

#### ⚙️ 系统配置（最重要 · 红线）
**全局可改项**：
- 店铺名、店长昵称、顾客昵称
- 白名单 openid
- 货币名称（任意自定义）
- 营业状态、主题默认值
- 时段彩蛋开关 & 文案
- 三大倒计时配置（纪念日、双方生日）
- 所有按钮/弹窗文案模板
- 所有彩蛋开关

---

## 五、彩蛋功能（全部后台可开关）

| # | 彩蛋 | 说明 | 默认 |
|---|---|---|---|
| 1 | 🎂 纪念日彩蛋 | 雨花瓣 + 隐藏菜单 | 开 |
| 2 | 🎉 生日彩蛋 | 专属页面 | 开 |
| 3 | 🌧️ 天气联动 | 雨天首页热饮专场 | 开 |
| 4 | 📝 店长每日留言 | 首页弹窗 | 开 |
| 5 | 📸 晒单广场 | 收到商品后拍照 | 开 |
| 6 | 🎰 每日签到 | 送虚拟币 | 开 |
| 7 | 🔔 饭点提醒 | 11:30 / 18:00 推送 | 开 |
| 8 | 🎲 摇一摇盲盒 | 隐藏商品 | 开 |
| 9 | 🌙 晚安模式 | 23:00 后深色 | 开 |
| 10 | 💕 恋爱时光机 | 时间轴回顾订单 | 开 |
| 11 | 🎵 专属 BGM | 进入小程序播放 | 关 |
| 12 | 😡 情绪预警 | 店长端弹窗 | 开 |

---

## 六、技术方案（v2.1 自建后端 · 红线）

### 6.1 整体架构
```
微信小程序 (前端)
    ↓ HTTPS
https://api.cyruszhang.online
    ↓ (主机 Nginx 443 反代)
Node.js + Express (127.0.0.1:3000，PM2 守护)
    ↓
MongoDB (本机 27017，仅本地访问)
    +
微信开放接口 (code2session、订阅消息)
```

### 6.2 技术选型

| 维度 | 方案 | 说明 |
|---|---|---|
| 小程序框架 | 微信原生 | 稳定、AI 生成质量高 |
| UI 库 | Vant Weapp | 开箱即用 |
| 后端语言 | Node.js v20 | 服务器已就绪 |
| 后端框架 | Express 4.x | 轻量、生态成熟 |
| 数据库 | MongoDB 7.x | NoSQL，原表结构兼容 |
| ODM | Mongoose | Schema 校验 + 类型安全 |
| 鉴权 | JWT (jsonwebtoken) | 无状态 |
| 进程管理 | PM2 | 自动重启、日志管理 |
| 反向代理 | Nginx | 已配 HTTPS |
| 推送通知 | 微信订阅消息 | 官方原生 API |
| 文件存储 | 本机磁盘 + Nginx 静态服务 | `/uploads` 路径 |
| 天气 API | 和风天气开发版 | 1000 次/天免费 |

### 6.3 部署 / 运维（已就绪）
- **服务器**：阿里云 ECS（2H2G，到 2027.2.25）
- **域名**：`cyruszhang.online` 已 ICP 备案
- **HTTPS**：Let's Encrypt 多域名证书（已部署，自动续期）
- **API 域名**：`api.cyruszhang.online`（443 端口）
- **博客共存**：博客 Docker 容器继续占 80 端口，互不干扰

### 6.4 月度成本：¥0
（服务器和域名都是已购沉没成本；Let's Encrypt 证书免费；MongoDB 自部署免费）

---

## 七、数据库设计（MongoDB Collections）

```js
// 1. users - 用户
users { _id, openid, role: 'customer'|'owner', nickname, avatar, coins,
        continuous_sign_days, last_sign_date, created_at }

// 2. products - 商品
products { _id, name, category_id, images:[], description, price,
           specs:[{name, options:[]}], tags:[], status, stock,
           sort_weight, festival_id?, created_at, updated_at }

// 3. categories - 分类
categories { _id, name, icon, sort_order, status, festival_only }

// 4. festivals - 节日
festivals { _id, name, date_type:'fixed'|'lunar', date, banner,
            theme_color, product_ids:[], push_template, status }

// 5. orders - 订单
orders { _id, user_openid, items:[{product_id, specs, qty, note}],
         total_price, status, delivery_type, customer_note,
         owner_reply, status_history:[], created_at, updated_at }

// 6. messages - 留言
messages { _id, content, image, created_at }

// 7. achievements - 成就
achievements { _id, badge_id, user_openid, unlocked_at }

// 8. sign_ins - 签到
sign_ins { _id, user_openid, date, reward, continuous_days }

// 9. shares - 晒单
shares { _id, order_id, user_openid, images:[], content, created_at }

// 10. ⭐ config - 全局配置（核心扩展点）
config { _id: 'global',
         store_name, owner_nickname, customer_nickname,
         currency_name, currency_emoji,
         whitelist: { owner_openid, customer_openid },
         anniversary_date, owner_birthday, customer_birthday,
         store_status, default_theme,
         time_easter_eggs:[{ start, end, banner, text, enabled }],
         countdowns:[{ name, date, enabled }],
         text_templates:{...}, eggs_switch:{...} }
```

**设计红线**：
- ✅ 所有"内容""文案""配置"都在 config 文档
- ✅ 商品/分类/节日 全部 CRUD
- ✅ 改任何文案/价格/节日，**不用动一行代码**

---

## 八、AI 开发任务清单（24 任务 · 三期）

### 🟢 Phase 1：基础框架（MVP）
1. ✅ 初始化项目骨架（已完成 v0.0.0）
2. 服务器装 MongoDB + Node 后端骨架（Express + Mongoose）
3. 后端鉴权：openid 白名单 + JWT
4. 小程序前端：双端入口路由 + 兜底页
5. 双主题系统（暖阳/云朵白切换）
6. 商品列表 + 详情 + 购物车 + 下单
7. 订单状态机 + 状态流转 API
8. 店长端：商品 CRUD + 订单管理
9. 微信订阅消息推送

### 🟡 Phase 2：体验增强
10. 个人中心 + 虚拟币系统
11. 每日签到
12. 评价系统
13. 三大倒计时
14. 店长留言板
15. 分类管理 + 节日管理后台
16. 全局配置后台

### 🔵 Phase 3：彩蛋
17. 天气联动
18. 时段彩蛋
19. 成就徽章
20. 摇一摇盲盒
21. 晒单广场
22. 情绪预警
23. 数据看板
24. 恋爱时光机

---

## 九、开发流程红线（强约束）

1. **分版本开发**：每完成 1 个任务即为 1 个版本（v0.1.1 → v0.1.2 …）
2. **每版本必须存档**：提交 Git + 推送 GitHub + 打 Tag + 发布 Release
3. **每版本必须用户验收**：未通过验收不得进入下一个任务
4. **多 Agent 并行**：无依赖关系的任务可并行执行，便于用户分块检验
5. **可回退**：任何版本出问题，必须可通过 Git Tag 回退
6. **不偏离 PRD**：任何超出本文档的实现需求需先回来更新文档
7. **不破坏既有服务**：服务器上博客和 agent 项目零中断（除证书续期）

---

## 十、可扩展接口预留 ✅

| 想改什么 | 在哪改 |
|---|---|
| 加 / 删 / 改商品 | 店长端 → 商品管理 |
| 加 / 删商品分类 | 店长端 → 分类管理 |
| 加自定义节日 | 店长端 → 节日管理 |
| 改虚拟币名字 | 店长端 → 系统配置 |
| 改店铺名、昵称 | 店长端 → 系统配置 |
| 改任何文案 | 店长端 → 文案模板 |
| 开关任何彩蛋 | 店长端 → 系统配置 |
| 换主题色 | 系统配置 → 主题色（HEX 直接填） |
| 加 / 改倒计时 | 店长端 → 倒计时管理 |

---

**文档版本**：v2.1（自建后端架构）
**变更**：v2.0 → v2.1 仅技术实现方式从"微信云开发"改为"Node.js + MongoDB 自建"，所有产品功能、UI、彩蛋、数据库设计均不变
**状态**：✅ 定稿 · 最终红线