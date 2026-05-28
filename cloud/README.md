# 云开发目录

- `functions/` —— 云函数（任务 3 起开始填充：auth、order、push 等）
- `database/schemas/` —— 数据库表结构定义（任务 2 完成）
- `database/seeds/` —— 初始化种子数据（任务 2 完成）

## 部署说明
1. 微信开发者工具 → 云开发 → 创建/选择环境
2. 在 `miniprogram/app.js` 中替换 env ID
3. 右键 `cloud/functions/<函数名>` → 上传并部署：云端安装依赖