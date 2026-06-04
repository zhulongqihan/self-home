#!/usr/bin/env bash
# 体验版上传前自检：本机 + 线上 API + SSH 服务器（不输出密钥明文）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PUBLIC="${API_PUBLIC:-https://api.cyruszhang.online}"
API_HEALTH="${API_PUBLIC}/api/health"
SERVER="${SERVER:-root@118.31.221.81}"
APPID_EXPECT="${APPID_EXPECT:-wxb6802a3a7b606136}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

echo "========== 体验版上传前自检 =========="
echo "仓库: $ROOT"
echo ""

echo "--- 本机 ---"
[[ -f "$ROOT/project.config.json" ]] || fail "缺少 project.config.json"
[[ -f "$ROOT/project.private.config.json" ]] || fail "缺少 project.private.config.json"
[[ -d "$ROOT/miniprogram" ]] || fail "缺少 miniprogram/"

APPID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$ROOT/project.private.config.json','utf8')).appid||'')" 2>/dev/null || true)
if [[ -z "$APPID" || "$APPID" == "touristappid" ]]; then
  fail "project.private.config.json 中 appid 无效"
else
  ok "本机 AppID=$APPID"
fi

if command -v git >/dev/null 2>&1; then
  TAG=$(git -C "$ROOT" describe --tags --exact-match 2>/dev/null || git -C "$ROOT" tag -l 'v0.3.*' --sort=-v:refname | head -1)
  ok "Git 最近 tag: ${TAG:-无}"
fi

echo ""
echo "--- 公网 API ---"
HEALTH=$(curl -sS --max-time 10 "$API_HEALTH" || true)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  ok "GET $API_HEALTH 正常"
else
  fail "公网 health 不可用"
fi

echo ""
echo "--- SSH $SERVER ---"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$SERVER" 'exit 0' || fail "SSH 无法连接"
ok "SSH 连通"
ssh -o BatchMode=yes "$SERVER" 'pm2 list | grep -q online && curl -sS http://127.0.0.1:3000/api/health | grep -q ok && echo remote_ok'
ok "服务器 pm2 + health"

echo ""
echo "自检通过。请按 docs/EXPERIENCE_VERSION_GUIDE.md 完成微信侧上传。"
