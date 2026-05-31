---
name: couple-app-redline
description: >-
  Enforces the couple-ordering mini program (selfplay / self-home) development
  red lines: PRD alignment, user acceptance before tag, SSH git push, per-version
  tags, GitHub Release only on major versions, server deploy rules, and reveal
  secrets policy. Use for every task in this repo—especially commit, tag, push,
  deploy, release, acceptance, 红线, 验收, v0.x.y, or orchestrator workflow.
---

# 情侣点单小程序 · 开发红线 Skill

本 Skill 为 **selfplay 仓库强制流程**。在本项目中执行任何开发、提交、部署、发版操作前，**必须先读并遵守**。

权威来源：`PRD.md` §九、`AI_EXECUTION_PROMPT.md`、`docs/RUNBOOK_ORCHESTRATOR.md`。

---

## 1. 不可违反

| # | 规则 |
|---|------|
| 1 | `PRD.md` 为唯一真相；超出范围先改 PRD 再开发 |
| 2 | 全免费方案；商品/文案/配置存 DB，禁止硬编码 |
| 3 | **用户验收「通过」前**：不得 `commit` 归档、不得打 Tag、不得部署声称「完成」 |
| 4 | 秘密不进 Git：`.env`、`project.private.config.json`、AppSecret |
| 5 | 揭晓前不给她体验码；见 `docs/REVEAL_CHECKLIST.md` |
| 6 | 服务器只动 `couple-app`；**不碰 80 端口** blog/agent |

---

## 2. 版本与 GitHub（核心变更）

### 2.1 每个任务版本（小版本 · 必做）

用户回复 **「通过」** 后，**同一轮对话内**完成：

```
- [ ] CHANGELOG.md + docs/acceptance/vX.Y.Z.md
- [ ] git add → git commit
- [ ] git push origin main          # SSH: git@github.com:zhulongqihan/self-home.git
- [ ] git tag -a vX.Y.Z → git push origin vX.Y.Z
```

**禁止**：只改本地不推送；验收未通过就打 Tag。

### 2.2 GitHub Release（大版本 · 才做）

**小版本（如 v0.3.1 / v0.3.2 / v0.3.3）只打 Tag，不创建 GitHub Release。**

仅在以下情况创建或更新 **GitHub Release**：

| 类型 | 示例 | 说明 |
|------|------|------|
| 次版本里程碑 | `v0.4.0`、`v1.0.0` | Y 位为 0 的 Phase/阶段收口 |
| 用户明确要求 | 「发 Release」「大版本收尾」 | 按用户指定 tag |
| 揭晓正式版 | `v1.0.0` | 惊喜版上线 |

Release 正文：`docs/releases/vX.Y.Z.md` 或 `docs/acceptance/vX.Y.Z.md` 摘要。  
优先 `gh release create`；未登录 `gh` 时提供 Web 链接 + 正文，**不要**每个小版本都催用户发 Release。

### 2.3 回退

用户说「回退到 vX.Y.Z」→ `git reset --hard vX.Y.Z`；`git push -f` 须用户明确确认。

---

## 3. 部署（有后端改动时）

```bash
scp -r server/src/* root@118.31.221.81:/opt/couple-app/src/
ssh root@118.31.221.81 'cd /opt/couple-app && npm install && pm2 restart couple-app --update-env'
```

- 线上 API：`https://api.cyruszhang.online`
- 测暗号：顾客 `zhuzhu`，店长 `yangyang`

---

## 4. 每轮任务 SOP

```
1. 开发（server / miniprogram / docs）
2. 写 docs/acceptance/vX.Y.Z.md → 交给用户 solo 验收
3. 等用户「通过」
4. commit + push + tag（必做）
5. 若为大版本 → GitHub Release；否则跳过
6. 有后端改动 → 部署服务器
7. 再开始下一 PRD 任务
```

---

## 5. Agent 自检（每次执行 git/部署/发版命令前）

回答以下问题，任一项为「否」则停下：

1. 用户是否已对本版本说「通过」？
2. 本次是否只需 Tag，还是大版本需要 Release？
3. 是否使用 SSH 推送，且未提交秘密文件？
4. 部署是否只影响 `couple-app`？

---

## 6. 参考

- 任务清单：`PRD.md` Phase 任务列表
- 揭晓清单：`docs/REVEAL_CHECKLIST.md`
- Release 脚本（大版本用）：`scripts/create_github_releases.sh`
