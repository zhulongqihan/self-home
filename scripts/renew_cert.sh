#!/bin/bash
# /usr/local/bin/renew-api-cert.sh
# 自动续期多域名 Let's Encrypt 证书（涵盖 api/根/www/blog/agent）
# 因 80 端口被博客 Docker 占用，续期时临时停启博客容器（约 30-60 秒中断）

set -e

DOMAIN="api.cyruszhang.online"   # 证书以此为主名（acme.sh 用第一个 -d 当主名）
ALL_DOMAINS="-d api.cyruszhang.online -d cyruszhang.online -d www.cyruszhang.online -d blog.cyruszhang.online -d agent.cyruszhang.online"
LOG="/var/log/acme-renew.log"
ACME="/root/.acme.sh/acme.sh"

log() {
  echo "[$(date '+%F %T')] $*" >> "$LOG"
}

log "===== 开始检查续期 ====="

# 检查证书剩余天数（< 30 天才续期）
CERT_FILE="/etc/nginx/ssl/$DOMAIN/fullchain.pem"
if [ ! -f "$CERT_FILE" ]; then
  log "证书文件不存在，跳过"
  exit 0
fi
EXPIRY_TS=$(date -d "$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)" +%s)
NOW_TS=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_TS - NOW_TS) / 86400 ))
log "证书剩余 $DAYS_LEFT 天"

if [ "$DAYS_LEFT" -gt 30 ]; then
  log "剩余天数 > 30，无需续期"
  exit 0
fi

# 表示需要续期，开始执行真实续期流程
log "证书剩余 ≤ 30 天，开始续期流程"
if true; then

  # 1. 停掉博客 nginx 释放 80 端口
  log "停止 myblog-nginx 容器..."
  docker stop myblog-nginx >> "$LOG" 2>&1 || { log "停止博客失败！终止"; exit 1; }

  # 2. acme.sh standalone 模式申请新证书
  log "执行 acme.sh 续期..."
  if "$ACME" --renew -d "$DOMAIN" --ecc --standalone --force >> "$LOG" 2>&1; then
    log "续期成功 ✅"
    SUCCESS=1
  else
    log "续期失败 ❌"
    SUCCESS=0
  fi

  # 3. 无论续期是否成功，都要立即把博客 nginx 拉起来
  log "启动 myblog-nginx 容器..."
  docker start myblog-nginx >> "$LOG" 2>&1

  # 4. 续期成功的话，重载主机 nginx 让新证书生效
  if [ "$SUCCESS" = "1" ]; then
    log "重载 nginx 加载新证书"
    systemctl reload nginx >> "$LOG" 2>&1
  fi
else
  log "证书还不需要续期，跳过"
fi

log "===== 完成 ====="