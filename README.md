# 情侣专属点单小程序 🍵

> 一个专为两人设计的微信小程序——把日常的关心、陪伴、撒娇、惊喜全部"商品化"，让爱情有仪式感。

模仿主流连锁饮品店（喜茶 / 瑞幸 / Manner）的点单体验，但顾客只有一位（你的另一半），店长也只有一位（你）。

---

## 💡 设计理念

- **仪式感**：把"我想喝奶茶"变成"我下了一单"
- **情绪出口**：emo / 生气 / 想撒娇 都有专属"商品"承接
- **数据沉淀**：每一次下单都是恋爱的数据足迹
- **专属感**：全宇宙只有一位顾客，会员等级永远顶级

---

## ✨ 功能亮点

### 顾客端
- 🛍️ 8 大商品分类：饮品 / 甜品 / 正餐 / 情绪服务 / 撒娇专区 / 神秘盲盒 / 节日限定 / 长期承诺卡
- 🛒 完整下单流程：购物车 → 选规格 → 配送方式（亲送 / 外卖 / 视频陪伴 / 立即兑现）
- 📦 7 段订单状态机：待接单 → 已接单 → 制作中 → 配送中 → 已送达 → 待评价 → 已完成
- 🎰 每日签到、虚拟币、成就徽章、恋爱倒计时
- 💋 用自定义虚拟货币付款（不涉及真实支付）

### 店长后台
- 商品 / 分类 / 节日全部 CRUD
- 订单接单与状态流转
- 主动推送 + 留言板
- 数据看板（含「情绪预警」：连续多日下单情绪类商品自动提醒）
- **所有文案、彩蛋、主题色、价格单位均可后台直改**

### 12 个彩蛋功能
纪念日彩蛋 / 生日彩蛋 / 天气联动 / 时段专区 / 摇一摇盲盒 / 晒单广场 / 晚安模式 / 恋爱时光机 …

详见 [`PRD.md`](./PRD.md) 第五章。

---

## 🎨 双主题

| 主题 | 主色 | 适用 |
|---|---|---|
| 🌞 暖阳大地（默认） | `#E8B86D` 暖黄 + 大地棕 | 白天 / 温馨场景 |
| ☁️ 云朵白 | 纯白 + 暖黄点缀 | 夜晚 / 简约场景 |

支持手动切换 + 早晚自动切换。

---

## 🧱 技术架构

```
微信小程序 (前端)
    ↓ HTTPS
api.cyruszhang.online (你的域名)
    ↓ Nginx 443 反代
Node.js + Express (PM2 守护)
    ↓
MongoDB (本机存储)
```

### 选型
| 维度 | 方案 |
|---|---|
| 前端 | 微信原生小程序 + Vant Weapp |
| 后端 | Node.js v20 + Express 4.x |
| 数据库 | MongoDB 7.x（Mongoose ODM） |
| 鉴权 | openid 白名单 + JWT |
| 进程 | PM2 守护 |
| 反代 | Nginx + Let's Encrypt 免费证书 |
| 推送 | 微信订阅消息 |

**月成本：¥0**（基于已有阿里云 ECS + 已备案域名 + 免费证书）

---

## 🚀 快速开始

### 环境要求
- 微信开发者工具
- Node.js 20+
- 一台已备案域名的 Linux 服务器（任意云厂商均可）
- Git

### 部署步骤
1. **小程序前端**
   - 申请微信小程序 AppID（[mp.weixin.qq.com](https://mp.weixin.qq.com/)）
   - 克隆仓库 → 创建 `project.private.config.json` 填入 AppID
   - 微信开发者工具导入项目根目录

2. **后端服务器**（任务 2 起的 AI 自动化部署）
   - 装 MongoDB 7.x
   - 装 Node.js v20 + PM2
   - 配 Nginx + HTTPS（参考 [`scripts/`](./scripts/)）
   - 部署 [`server/`](./server/) 代码
   - 详见 [`server/README.md`](./server/README.md)

3. **微信公众平台配置**
   - 服务器域名白名单：添加你的 API 子域名

---

## 📁 项目结构

```
.
├── PRD.md                  # 📌 项目需求文档（最高红线）
├── AI_EXECUTION_PROMPT.md  # 🤖 多 Agent 并行开发指南
├── CHANGELOG.md            # 📝 版本变更日志
├── miniprogram/            # 小程序前端
├── server/                 # 后端服务（Node.js + Express + MongoDB）
├── scripts/                # 部署脚本（Nginx 配置、HTTPS 续期）
├── docs/                   # 设计文档、验收清单、任务清单
└── tests/                  # 测试代码
```

---

## 🛠️ 开发流程（强约束）

1. **分版本开发**：每完成 1 个任务 = 1 个 Git Tag（小版本不发 Release；大版本见 PRD §九）
2. **用户验收强制**：每个版本完成后必须通过 [`docs/acceptance/`](./docs/acceptance/) 清单验收
3. **GitHub 同步（SSH）**：验收通过后 `git push origin main` + `git push origin vX.Y.Z`（远程 `git@github.com:zhulongqihan/self-home.git`），详见 PRD §9.1
4. **Agent 红线 Skill**：[`.cursor/skills/couple-app-redline/`](./.cursor/skills/couple-app-redline/SKILL.md) — 每次开发/提交/部署自动遵守
5. **可回退**：任何版本出问题，`git checkout vX.Y.Z` 或 `git reset --hard <tag>` 立即回滚

完整工作手册见 [`AI_EXECUTION_PROMPT.md`](./AI_EXECUTION_PROMPT.md)。

---

## 📄 License

MIT · 仅供个人非商用学习与使用。第三方 IP 素材请遵守版权规则。