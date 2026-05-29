# TASK 09 - 店长端商品 CRUD（v0.1.9）

## 目标
PRD Phase 1 任务 8 中的商品管理部分：店长可增删改查商品、上下架、配置 `images` / `image_style`。

## 后端 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products/owner/all` | 店长列表（含下架） |
| POST | `/api/products` | 新建 |
| PUT | `/api/products/:id` | 更新 |
| PATCH | `/api/products/:id/status` | 上下架 |
| DELETE | `/api/products/:id` | 删除 |

## 前端
- `pages/owner/products/index` — 列表
- `pages/owner/products/edit` — 新建/编辑

## 部署
```bash
scp -r server/src/* root@118.31.221.81:/opt/couple-app/src/
ssh root@118.31.221.81 "pm2 restart couple-app"
```

## 验收
`docs/acceptance/v0.1.9.md`
