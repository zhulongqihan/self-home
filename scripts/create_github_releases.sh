#!/bin/bash
# 本地创建 GitHub Releases（需 gh 已登录：gh auth login）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if ! command -v gh >/dev/null 2>&1; then
  echo "请先安装并登录 gh: brew install gh && gh auth login"
  exit 1
fi
gh release create v0.1.9 --title "v0.1.9 店长商品 CRUD 与评价" --notes-file docs/acceptance/v0.1.9.md 2>/dev/null \
  && echo "v0.1.9 release OK" || echo "v0.1.9 release 可能已存在"
gh release create v0.2.0 --title "v0.2.0 微信订阅消息" --notes-file docs/acceptance/v0.2.0.md 2>/dev/null \
  && echo "v0.2.0 release OK" || echo "v0.2.0 release 可能已存在"
gh release list --limit 5
