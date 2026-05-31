#!/bin/bash
# 大版本 GitHub Release（小版本只打 Tag，不发 Release — 见 PRD §九、.cursor/skills/couple-app-redline/）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
GH="${GH:-gh}"
if ! command -v "$GH" >/dev/null 2>&1; then
  echo "请先安装并登录 gh: brew install gh && gh auth login"
  exit 1
fi
if ! "$GH" auth status >/dev/null 2>&1; then
  echo "请先执行: gh auth login"
  exit 1
fi
REPO="zhulongqihan/self-home"

create_release() {
  local tag="$1" title="$2" notes_file="$3"
  if "$GH" release view "$tag" --repo "$REPO" >/dev/null 2>&1; then
    echo "$tag release 已存在，跳过"
    return 0
  fi
  "$GH" release create "$tag" --repo "$REPO" --title "$title" --notes-file "$notes_file"
  echo "$tag release OK"
}

create_release v0.3.3 "v0.3.3 - 三大倒计时" docs/releases/v0.3.3.md
"$GH" release list --repo "$REPO" --limit 5
