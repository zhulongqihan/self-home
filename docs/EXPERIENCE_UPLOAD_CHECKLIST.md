# 体验版上传 · 你只勾这 4 步

> 后端与服务器已由助手就绪。详细说明见 [EXPERIENCE_VERSION_GUIDE.md](./EXPERIENCE_VERSION_GUIDE.md)

**导入目录**：`/Users/zhangchangyu.19/selfplay`  
**AppID**：`wxb6802a3a7b606136`

---

## 已完成（不用你做）

- [x] 线上 API `0.3.10` 正常
- [x] 服务器 `scp` + `pm2 restart couple-app`
- [x] `WX_APPID` 与小程序一致
- [x] 本机 `project.private.config.json` 存在

## 她登录方式

- **推荐**：体验版里用 **顾客暗号**（上传前请在店长端改掉默认 `zhuzhu`）
- 顾客微信 openid 白名单 **尚未配置**；不用暗号可能进「店铺暂未营业」

---

## 你必须完成

### 1. 合法域名（约 3 分钟，一次即可）

- [ ] https://mp.weixin.qq.com → **开发** → **开发管理** → **开发设置**
- [ ] **request 合法域名** 含：`https://api.cyruszhang.online`

### 2. 开发者工具上传

- [ ] 打开项目 `/Users/zhangchangyu.19/selfplay`（非游客模式）
- [ ] **编译** 自测 `zhuzhu` 能进厨房
- [ ] **工具 → 上传**，版本号 `0.3.10`，备注见完整教程

### 3. 设为体验版

- [ ] **管理 → 版本管理** → 开发版本 `0.3.10` → **选为体验版**
- [ ] 保存 **体验版二维码**

### 4. 体验成员

- [ ] **成员管理 → 体验成员** → 添加她微信号 → 她点 **接受**
- [ ] 发她体验版二维码 + **顾客暗号**

---

## 完成后

回复「体验版已上传」，继续开发任务 21。

```bash
# 可选复查
bash scripts/check_experience_upload.sh
```
