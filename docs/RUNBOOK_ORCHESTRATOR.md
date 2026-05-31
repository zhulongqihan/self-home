# Orchestrator 执行手册

与 [AI_EXECUTION_PROMPT.md](../AI_EXECUTION_PROMPT.md) 一致，摘要如下：

1. 每版本：开发 → `docs/acceptance/vX.Y.Z.md` → **用户验收「通过」**
2. 通过后：`CHANGELOG.md` → `git push origin main`（SSH）→ `git tag` → `git push tag`；**GitHub Release 仅大版本**
3. 部署：`scp server/src/* root@118.31.221.81:/opt/couple-app/src/` → 服务器 `npm install`（若依赖变）→ `pm2 restart couple-app --update-env`
4. 不碰 80 端口 blog/agent

**Agent 强制 Skill**：`.cursor/skills/couple-app-redline/SKILL.md`（本仓库每次任务自动遵守）

## 并行分工
- Backend：`server/src/`
- Miniprogram：`miniprogram/`
- Docs：`docs/`、`CHANGELOG.md`
